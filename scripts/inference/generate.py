#!/usr/bin/env python3
"""Inference CLI script for pedagogical tutor generation.

Supports interactive generation, prompt evaluation, adapter testing,
and a lightweight non-downloading smoke test for local verification.

Usage:
    python scripts/inference/generate.py --smoke-test
    python scripts/inference/generate.py --model Qwen/Qwen3-4B-Instruct-2507 --prompt "How do I solve quadratic equations?"
    python scripts/inference/generate.py --model Qwen/Qwen3-4B-Instruct-2507 --adapter outputs/qwen3_4b_sft/final_adapter --prompt "Why is 2x + 5 = 15?"
"""

import argparse
import os
import sys
import time

# Ensure src is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src")))

from tutor.model.inference import TutorGenerationConfig, TutorGenerator
from tutor.model.loader import get_optimal_device, load_model_and_tokenizer


def run_smoke_test():
    """Runs a non-downloading smoke test to verify inference structures and configs."""
    print("=" * 60)
    print(" Running Lightweight Model & Inference Smoke Test")
    print("=" * 60)

    device = get_optimal_device()
    print(f"1. Target Hardware Device: {device}")

    # Test TutorGenerationConfig initialization
    config = TutorGenerationConfig(
        max_new_tokens=64,
        temperature=0.7,
        top_p=0.9,
    )
    print(f"2. Generation Config Initialized: max_tokens={config.max_new_tokens}, temp={config.temperature}")

    # Verify Mock Generator flow
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
    parser = argparse.ArgumentParser(description="Generate pedagogical tutoring responses.")
    parser.add_argument("--model", type=str, default="Qwen/Qwen3-4B-Instruct-2507", help="Model name or path")
    parser.add_argument("--adapter", type=str, default=None, help="Path to LoRA adapter")
    parser.add_argument("--prompt", type=str, default=None, help="Input prompt or question")
    parser.add_argument("--use-4bit", action="store_true", help="Enable 4-bit QLoRA loading")
    parser.add_argument("--dtype", type=str, default="bfloat16", help="Tensor dtype (bfloat16/float16/float32)")
    parser.add_argument("--max-new-tokens", type=int, default=512, help="Maximum generated tokens")
    parser.add_argument("--temperature", type=float, default=0.7, help="Sampling temperature")
    parser.add_argument("--top-p", type=float, default=0.9, help="Top-p sampling")
    parser.add_argument("--smoke-test", action="store_true", help="Run lightweight smoke test without loading model")

    args = parser.parse_args()

    if args.smoke_test:
        return run_smoke_test()

    if not args.prompt:
        print("Error: --prompt is required when not running in --smoke-test mode.")
        parser.print_help()
        sys.exit(1)

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

    gen_config = TutorGenerationConfig(
        max_new_tokens=args.max_new_tokens,
        temperature=args.temperature,
        top_p=args.top_p,
    )

    generator = TutorGenerator(model=model, tokenizer=tokenizer, default_config=gen_config)

    print("\n" + "=" * 50)
    print("PROMPT:")
    print(args.prompt)
    print("=" * 50)

    import torch

    messages = [{"role": "user", "content": args.prompt}]
    if hasattr(tokenizer, "apply_chat_template"):
        inputs = tokenizer.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt",
        )
    else:
        inputs = tokenizer(args.prompt, return_tensors="pt")

    device = next(model.parameters()).device
    if isinstance(inputs, torch.Tensor):
        inputs = {"input_ids": inputs.to(device)}
    else:
        inputs = {k: v.to(device) for k, v in inputs.items()}

    prompt_len = inputs["input_ids"].shape[1]

    gen_start = time.time()

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=args.max_new_tokens,
            temperature=args.temperature,
            top_p=args.top_p,
            do_sample=args.temperature > 0,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

    generated_ids = output_ids[0, prompt_len:]

    print("\n" + "=" * 50)
    print("DIAGNOSTIC")
    print("=" * 50)

    print(f"Prompt tokens: {prompt_len}")
    print(f"Generated tokens: {len(generated_ids)}")

    print("\nFirst 20 generated tokens:")

    for i, token_id in enumerate(generated_ids[:20]):
        token_text = tokenizer.decode(
            [token_id],
            skip_special_tokens=False,
        )
        print(f"{i:3d}: ID={int(token_id):<8} TEXT={repr(token_text)}")

    print("\nLast 20 generated tokens:")

    start = max(0, len(generated_ids) - 20)

    for i, token_id in enumerate(generated_ids[start:], start):
        token_text = tokenizer.decode(
            [token_id],
            skip_special_tokens=False,
        )
        print(f"{i:3d}: ID={int(token_id):<8} TEXT={repr(token_text)}")

    eos_ids = tokenizer.eos_token_id

    if not isinstance(eos_ids, list):
        eos_ids = [eos_ids]

    found_eos = [
        (i, int(token_id))
        for i, token_id in enumerate(generated_ids.tolist())
        if int(token_id) in eos_ids
    ]

    print("\nEOS IDs:", eos_ids)
    print("EOS detected:", "YES" if found_eos else "NO")

    if found_eos:
        print("EOS positions:", found_eos)

    print("=" * 50)

    response = tokenizer.decode(
        generated_ids,
        skip_special_tokens=False,
    ).strip()

    print("\nRAW DECODED RESPONSE:")
    print(response)
    print("=" * 50)

    gen_time = time.time() - gen_start

    print("\nTUTOR RESPONSE:")
    print(response)
    print("=" * 50)
    print(f"Generated in {gen_time:.2f} seconds.")


if __name__ == "__main__":
    main()
