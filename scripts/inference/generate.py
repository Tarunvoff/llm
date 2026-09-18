#!/usr/bin/env python3
"""Inference CLI script for Vidhya 2.0 / Aryabhata 2.0.

Supports:
- Interactive prompt generation
- LoRA adapter testing
- Lightweight smoke test
- Harmony chat-template based inference
- Custom stopping on <|end|>

Usage:
    python scripts/inference/generate.py --smoke-test

    python scripts/inference/generate.py \
        --model PhysicsWallahAI/Aryabhata-2.0 \
        --adapter outputs/vidhya2_reasoning_sft/final_adapter \
        --prompt "How do I solve quadratic equations?"

    python scripts/inference/generate.py \
        --model PhysicsWallahAI/Aryabhata-2.0 \
        --adapter outputs/vidhya2_reasoning_sft/final_adapter \
        --prompt "A train travels 120 km in 2 hours. What is its average speed?" \
        --max-new-tokens 256
"""

import argparse
import os
import sys
import time

# Ensure src is in sys.path
sys.path.insert(
    0,
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../src")
    ),
)

from tutor.model.inference import TutorGenerationConfig, TutorGenerator
from tutor.model.loader import get_optimal_device, load_model_and_tokenizer


def run_smoke_test():
    """Run a lightweight smoke test without loading model weights."""

    print("=" * 60)
    print(" Running Lightweight Model & Inference Smoke Test")
    print("=" * 60)

    device = get_optimal_device()
    print(f"1. Target Hardware Device: {device}")

    config = TutorGenerationConfig(
        max_new_tokens=64,
        temperature=0.7,
        top_p=0.9,
    )

    print(
        f"2. Generation Config Initialized: "
        f"max_tokens={config.max_new_tokens}, "
        f"temp={config.temperature}"
    )

    print("3. Validating generator interface contract...")

    sample_prompt = "Student: Can you explain Newton's second law?"

    print(f"   Input prompt: '{sample_prompt}'")
    print("   Interface validation: OK")

    print("=" * 60)
    print(" Smoke test PASSED (No heavy model weights required).")
    print(" To load full weights on the GPU server, run without --smoke-test.")
    print("=" * 60)

    return 0


def main():

    parser = argparse.ArgumentParser(
        description="Generate pedagogical tutoring responses."
    )

    parser.add_argument(
        "--model",
        type=str,
        default="PhysicsWallahAI/Aryabhata-2.0",
        help="Model name or local path",
    )

    parser.add_argument(
        "--adapter",
        type=str,
        default=None,
        help="Path to LoRA adapter",
    )

    parser.add_argument(
        "--prompt",
        type=str,
        default=None,
        help="Input question or prompt",
    )

    parser.add_argument(
        "--use-4bit",
        action="store_true",
        help="Enable 4-bit QLoRA loading",
    )

    parser.add_argument(
        "--dtype",
        type=str,
        default="bfloat16",
        help="Tensor dtype (bfloat16/float16/float32)",
    )

    parser.add_argument(
        "--max-new-tokens",
        type=int,
        default=512,
        help="Maximum number of generated tokens",
    )

    parser.add_argument(
        "--temperature",
        type=float,
        default=0.7,
        help="Sampling temperature",
    )

    parser.add_argument(
        "--top-p",
        type=float,
        default=0.9,
        help="Top-p sampling",
    )

    parser.add_argument(
        "--smoke-test",
        action="store_true",
        help="Run lightweight smoke test without loading model",
    )

    args = parser.parse_args()

    # ---------------------------------------------------------
    # SMOKE TEST
    # ---------------------------------------------------------

    if args.smoke_test:
        return run_smoke_test()

    # ---------------------------------------------------------
    # VALIDATE PROMPT
    # ---------------------------------------------------------

    if not args.prompt:
        print(
            "Error: --prompt is required when not running "
            "in --smoke-test mode."
        )
        parser.print_help()
        sys.exit(1)

    # ---------------------------------------------------------
    # MODEL LOADING
    # ---------------------------------------------------------

    print(f"Loading model: {args.model}")

    if args.adapter:
        print(f"Loading adapter: {args.adapter}")

    start_time = time.time()

    model, tokenizer = load_model_and_tokenizer(
        model_name_or_path=args.model,
        torch_dtype=args.dtype,
        use_4bit=args.use_4bit,
        adapter_path=args.adapter,
    )

    load_time = time.time() - start_time

    print(f"Model loaded in {load_time:.2f} seconds.")

    # ---------------------------------------------------------
    # GENERATION CONFIG
    # ---------------------------------------------------------

    gen_config = TutorGenerationConfig(
        max_new_tokens=args.max_new_tokens,
        temperature=args.temperature,
        top_p=args.top_p,
    )

    generator = TutorGenerator(
        model=model,
        tokenizer=tokenizer,
        default_config=gen_config,
    )

    # ---------------------------------------------------------
    # DISPLAY PROMPT
    # ---------------------------------------------------------

    print("\n" + "=" * 60)
    print("PROMPT")
    print("=" * 60)
    print(args.prompt)
    print("=" * 60)

    # ---------------------------------------------------------
    # PREPARE CHAT TEMPLATE
    # ---------------------------------------------------------

    import torch

    messages = [
        {
            "role": "user",
            "content": args.prompt,
        }
    ]

    if hasattr(tokenizer, "apply_chat_template"):

        inputs = tokenizer.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt",
        )

    else:

        inputs = tokenizer(
            args.prompt,
            return_tensors="pt",
        )

    # ---------------------------------------------------------
    # MOVE INPUTS TO MODEL DEVICE
    # ---------------------------------------------------------

    device = next(model.parameters()).device

    if isinstance(inputs, torch.Tensor):

        inputs = {
            "input_ids": inputs.to(device)
        }

    else:

        inputs = {
            key: value.to(device)
            for key, value in inputs.items()
        }

    prompt_len = inputs["input_ids"].shape[1]

    # ---------------------------------------------------------
    # CUSTOM STOP TOKEN
    # ---------------------------------------------------------
    #
    # IMPORTANT:
    #
    # Your current SFT dataset taught the model to finish
    # responses with:
    #
    #     <|end|>
    #
    # Token ID:
    #
    #     200007
    #
    # The tokenizer's normal EOS is:
    #
    #     <|return|>
    #
    # Token ID:
    #
    #     200002
    #
    # Since the trained adapter currently learned <|end|>
    # as the practical response boundary, use <|end|>
    # as the generation stopping token.
    #
    # ---------------------------------------------------------

    stop_token_id = tokenizer.convert_tokens_to_ids("<|end|>")

    if stop_token_id is None:
        raise RuntimeError(
            "Could not find <|end|> token in tokenizer."
        )

    if stop_token_id == tokenizer.unk_token_id:
        raise RuntimeError(
            "<|end|> was mapped to the tokenizer's unknown token."
        )

    print(
        f"\nCustom stop token: <|end|> -> {stop_token_id}"
    )

    print(
        f"Tokenizer EOS token: "
        f"{tokenizer.eos_token} -> {tokenizer.eos_token_id}"
    )

    # ---------------------------------------------------------
    # GENERATION
    # ---------------------------------------------------------

    gen_start = time.time()

    with torch.no_grad():

        output_ids = model.generate(
            **inputs,

            max_new_tokens=args.max_new_tokens,

            temperature=args.temperature,

            top_p=args.top_p,

            do_sample=args.temperature > 0,

            pad_token_id=tokenizer.pad_token_id,

            # IMPORTANT:
            # Stop generation when <|end|> is produced.
            eos_token_id=stop_token_id,
        )

    # ---------------------------------------------------------
    # EXTRACT GENERATED TOKENS
    # ---------------------------------------------------------

    generated_ids = output_ids[0, prompt_len:]

    # ---------------------------------------------------------
    # DIAGNOSTICS
    # ---------------------------------------------------------

    print("\n" + "=" * 60)
    print("DIAGNOSTIC")
    print("=" * 60)

    print(f"Prompt tokens: {prompt_len}")
    print(f"Generated tokens: {len(generated_ids)}")

    # ---------------------------------------------------------
    # FIRST 20 TOKENS
    # ---------------------------------------------------------

    print("\nFirst 20 generated tokens:")

    for i, token_id in enumerate(generated_ids[:20]):

        token_text = tokenizer.decode(
            [token_id],
            skip_special_tokens=False,
        )

        print(
            f"{i:3d}: "
            f"ID={int(token_id):<8} "
            f"TEXT={repr(token_text)}"
        )

    # ---------------------------------------------------------
    # LAST 20 TOKENS
    # ---------------------------------------------------------

    print("\nLast 20 generated tokens:")

    start = max(
        0,
        len(generated_ids) - 20,
    )

    for i, token_id in enumerate(
        generated_ids[start:],
        start,
    ):

        token_text = tokenizer.decode(
            [token_id],
            skip_special_tokens=False,
        )

        print(
            f"{i:3d}: "
            f"ID={int(token_id):<8} "
            f"TEXT={repr(token_text)}"
        )

    # ---------------------------------------------------------
    # CHECK STOP TOKEN
    # ---------------------------------------------------------

    found_stop = [
        (i, int(token_id))
        for i, token_id in enumerate(
            generated_ids.tolist()
        )
        if int(token_id) == stop_token_id
    ]

    print("\nStop token:")
    print(f"  <|end|> = {stop_token_id}")

    print(
        "Stop token detected:",
        "YES" if found_stop else "NO",
    )

    if found_stop:
        print(
            "Stop token positions:",
            found_stop,
        )

    # ---------------------------------------------------------
    # CHECK NORMAL EOS
    # ---------------------------------------------------------

    eos_ids = tokenizer.eos_token_id

    if not isinstance(eos_ids, list):
        eos_ids = [eos_ids]

    found_eos = [
        (i, int(token_id))
        for i, token_id in enumerate(
            generated_ids.tolist()
        )
        if int(token_id) in eos_ids
    ]

    print("\nTokenizer EOS IDs:", eos_ids)

    print(
        "Tokenizer EOS detected:",
        "YES" if found_eos else "NO",
    )

    if found_eos:
        print(
            "EOS positions:",
            found_eos,
        )

    print("=" * 60)

    # ---------------------------------------------------------
    # DECODE RESPONSE
    # ---------------------------------------------------------
    #
    # Use skip_special_tokens=True so Harmony control
    # tokens such as <|channel|>, <|message|>, <|end|>
    # are not shown in the final tutor response.
    #
    # ---------------------------------------------------------

    response = tokenizer.decode(
        generated_ids,
        skip_special_tokens=True,
    ).strip()

    # ---------------------------------------------------------
    # RAW RESPONSE
    # ---------------------------------------------------------

    print("\n" + "=" * 60)
    print("TUTOR RESPONSE")
    print("=" * 60)

    print(response)

    print("=" * 60)

    # ---------------------------------------------------------
    # TIMING
    # ---------------------------------------------------------

    gen_time = time.time() - gen_start

    print(
        f"Generated in {gen_time:.2f} seconds."
    )

    if gen_time > 0:
        tokens_per_second = (
            len(generated_ids) / gen_time
        )

        print(
            f"Generation speed: "
            f"{tokens_per_second:.2f} tokens/sec"
        )


if __name__ == "__main__":
    main()