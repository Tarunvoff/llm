#!/usr/bin/env python3
"""
Model Inference Script
Executes local inference on downloaded weights using Hugging Face Transformers.
Respects CUDA_VISIBLE_DEVICES and evaluates token statistics accurately.
"""

import argparse
import os
import sys
import time
from pathlib import Path
import yaml
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM


def load_config(config_path: str = "configs/model.yaml") -> dict:
    path = Path(config_path)
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def get_torch_dtype(dtype_str: str) -> torch.dtype:
    dtype_str = (dtype_str or "").lower()
    if dtype_str in ["bfloat16", "bf16"] and torch.cuda.is_bf16_supported():
        return torch.bfloat16
    elif dtype_str in ["float16", "fp16"] and torch.cuda.is_available():
        return torch.float16
    elif dtype_str in ["bfloat16", "bf16"]:
        return torch.bfloat16
    return torch.float32


def load_model_and_tokenizer(model_dir: str, config: dict):
    model_cfg = config.get("model", {})
    dtype_str = model_cfg.get("torch_dtype", "bfloat16")
    device_map = model_cfg.get("device_map", "auto")
    trust_remote_code = model_cfg.get("trust_remote_code", True)

    torch_dtype = get_torch_dtype(dtype_str)

    print(f"Loading tokenizer from: {model_dir}")
    tokenizer = AutoTokenizer.from_pretrained(
        model_dir,
        trust_remote_code=trust_remote_code
    )

    print(f"Loading model weights from: {model_dir} (dtype: {torch_dtype}, device_map: {device_map})")
    
    # Respect CUDA_VISIBLE_DEVICES without hardcoding GPUs
    if not torch.cuda.is_available():
        device_map = None
        torch_dtype = torch.float32

    model_kwargs = {
        "device_map": device_map,
        "trust_remote_code": trust_remote_code
    }
    # Pass torch_dtype / dtype
    try:
        model = AutoModelForCausalLM.from_pretrained(
            model_dir,
            dtype=torch_dtype,
            **model_kwargs
        )
    except TypeError:
        model = AutoModelForCausalLM.from_pretrained(
            model_dir,
            torch_dtype=torch_dtype,
            **model_kwargs
        )

    if not torch.cuda.is_available():
        model = model.to("cpu")

    return model, tokenizer


def prepare_inputs(encoded, device="cpu"):
    """
    Extracts tensor input_ids and attention_mask from apply_chat_template or tokenizer outputs,
    safely handling BatchEncoding, dict, list, or tensor types.
    """
    if isinstance(encoded, dict) or hasattr(encoded, "data") or hasattr(encoded, "get"):
        raw_ids = encoded.get("input_ids", encoded)
        raw_mask = encoded.get("attention_mask", None)
    else:
        raw_ids = encoded
        raw_mask = None

    if isinstance(raw_ids, torch.Tensor):
        input_ids = raw_ids
    elif isinstance(raw_ids, list):
        input_ids = torch.tensor(raw_ids, dtype=torch.long)
    else:
        input_ids = torch.as_tensor(raw_ids, dtype=torch.long)

    if input_ids.ndim == 1:
        input_ids = input_ids.unsqueeze(0)

    if raw_mask is not None:
        if isinstance(raw_mask, torch.Tensor):
            attention_mask = raw_mask
        elif isinstance(raw_mask, list):
            attention_mask = torch.tensor(raw_mask, dtype=torch.long)
        else:
            attention_mask = torch.as_tensor(raw_mask, dtype=torch.long)
        if attention_mask.ndim == 1:
            attention_mask = attention_mask.unsqueeze(0)
    else:
        attention_mask = torch.ones_like(input_ids)

    return input_ids.to(device), attention_mask.to(device)


def run_inference(
    model,
    tokenizer,
    prompt: str,
    system_prompt: str = None,
    max_new_tokens: int = 4096,
    temperature: float = 1.0,
    do_sample: bool = False
) -> dict:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    if hasattr(tokenizer, "apply_chat_template"):
        encoded = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            return_tensors="pt"
        )
    else:
        full_text = f"{system_prompt}\nUser: {prompt}\nAssistant:" if system_prompt else f"User: {prompt}\nAssistant:"
        encoded = tokenizer(full_text, return_tensors="pt")

    device = model.device if hasattr(model, "device") else ("cuda" if torch.cuda.is_available() else "cpu")
    input_ids, attention_mask = prepare_inputs(encoded, device=device)
    input_token_count = input_ids.shape[-1]

    # Generation
    start_time = time.perf_counter()
    with torch.no_grad():
        generation_kwargs = {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "max_new_tokens": max_new_tokens,
            "pad_token_id": tokenizer.eos_token_id if tokenizer.eos_token_id is not None else 0
        }
        if do_sample and temperature > 0:
            generation_kwargs["do_sample"] = True
            generation_kwargs["temperature"] = temperature
        else:
            generation_kwargs["do_sample"] = False

        outputs = model.generate(**generation_kwargs)
    end_time = time.perf_counter()

    generation_time = max(end_time - start_time, 1e-6)
    generated_tokens = outputs[0][input_token_count:]
    output_token_count = len(generated_tokens)
    tokens_per_sec = output_token_count / generation_time

    response_text = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

    return {
        "response": response_text,
        "input_tokens": input_token_count,
        "output_tokens": output_token_count,
        "generation_time": generation_time,
        "tokens_per_sec": tokens_per_sec
    }


def main():
    parser = argparse.ArgumentParser(description="Run local model inference on a prompt.")
    parser.add_argument(
        "--prompt",
        type=str,
        required=True,
        help="The input query / STEM problem to solve."
    )
    parser.add_argument(
        "--config",
        type=str,
        default="configs/model.yaml",
        help="Path to model configuration YAML file."
    )
    parser.add_argument(
        "--model-dir",
        type=str,
        default=None,
        help="Directory containing downloaded model files."
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=None,
        help="Maximum generation tokens."
    )
    args = parser.parse_args()

    config = load_config(args.config)
    model_cfg = config.get("model", {})
    gen_cfg = config.get("generation", {})
    model_dir = args.model_dir or model_cfg.get("local_dir", "model/aryabhata-2.0")
    system_prompt = config.get("system_prompt")
    max_tokens = args.max_tokens or gen_cfg.get("max_new_tokens", 4096)
    temperature = gen_cfg.get("temperature", 1.0)
    do_sample = gen_cfg.get("do_sample", False)

    if not Path(model_dir).exists():
        print(f"[ERROR] Model directory '{model_dir}' not found. Please run 'python scripts/download_model.py' first.", file=sys.stderr)
        sys.exit(1)

    model, tokenizer = load_model_and_tokenizer(model_dir, config)

    result = run_inference(
        model=model,
        tokenizer=tokenizer,
        prompt=args.prompt,
        system_prompt=system_prompt,
        max_new_tokens=max_tokens,
        temperature=temperature,
        do_sample=do_sample
    )

    print("\n" + "=" * 70)
    print("GENERATED RESPONSE:")
    print("=" * 70)
    print(result["response"])
    print("\n" + "=" * 70)
    print("INFERENCE METRICS:")
    print("-" * 70)
    print(f"Input Tokens    : {result['input_tokens']}")
    print(f"Output Tokens   : {result['output_tokens']}")
    print(f"Generation Time : {result['generation_time']:.4f} s")
    print(f"Tokens/sec      : {result['tokens_per_sec']:.2f} t/s")
    print("=" * 70)


if __name__ == "__main__":
    main()
