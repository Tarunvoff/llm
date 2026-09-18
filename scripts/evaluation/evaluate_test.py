#!/usr/bin/env python3
"""
Evaluate Vidhya 2.0 LoRA adapter on the held-out test dataset (test.jsonl).

Usage:
    python scripts/evaluation/evaluate_test.py
    python scripts/evaluation/evaluate_test.py --test-data data/sft/v2_reasoning_boost/test.jsonl --limit 10
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import torch

# Ensure src is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SRC_PATH = os.path.join(PROJECT_ROOT, "src")
sys.path.insert(0, SRC_PATH)

from tutor.model.loader import load_model_and_tokenizer

DEFAULT_MODEL = "PhysicsWallahAI/Aryabhata-2.0"
DEFAULT_ADAPTER = "outputs/vidhya2_reasoning_sft/final_adapter"
DEFAULT_TEST_DATA = "data/sft/v2_reasoning_boost/test.jsonl"
DEFAULT_OUTPUT = "outputs/vidhya2_evaluation/test_predictions.jsonl"


def build_prompt(tokenizer, question: str):
    messages = [{"role": "user", "content": question}]
    if hasattr(tokenizer, "apply_chat_template"):
        inputs = tokenizer.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt",
        )
    else:
        inputs = tokenizer(question, return_tensors="pt")
    return inputs


def main():
    parser = argparse.ArgumentParser(description="Evaluate Vidhya 2.0 on held-out test set.")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help="Base model path")
    parser.add_argument("--adapter", type=str, default=DEFAULT_ADAPTER, help="LoRA adapter path")
    parser.add_argument("--test-data", type=str, default=DEFAULT_TEST_DATA, help="Path to test.jsonl")
    parser.add_argument("--output", type=str, default=DEFAULT_OUTPUT, help="Path for predictions JSONL")
    parser.add_argument("--max-new-tokens", type=int, default=512, help="Max new generated tokens")
    parser.add_argument("--temperature", type=float, default=0.0, help="Sampling temperature")
    parser.add_argument("--top-p", type=float, default=1.0, help="Top-p sampling")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of test examples")

    args = parser.parse_args()

    print("=" * 70)
    print("Vidhya 2.0 Test Set Evaluation")
    print("=" * 70)
    print(f"Model:     {args.model}")
    print(f"Adapter:   {args.adapter}")
    print(f"Test Data: {args.test_data}")
    print(f"Output:    {args.output}")
    print("=" * 70)

    # Load Model
    print("\nLoading model & tokenizer...")
    t0 = time.time()
    model, tokenizer = load_model_and_tokenizer(
        model_name_or_path=args.model,
        torch_dtype="bfloat16",
        use_4bit=False,
        adapter_path=args.adapter,
    )
    device = next(model.parameters()).device
    print(f"Loaded in {time.time() - t0:.2f}s on device: {device}")

    # Stop token: <|end|>
    stop_token_id = tokenizer.convert_tokens_to_ids("<|end|>")
    if stop_token_id is None:
        stop_token_id = tokenizer.eos_token_id
    print(f"Stop token (<|end|>): ID={stop_token_id}")

    # Load test JSONL data directly
    print(f"\nLoading test data from: {args.test_data}")
    if not os.path.exists(args.test_data):
        raise FileNotFoundError(f"Test JSONL file not found at: {args.test_data}")

    with open(args.test_data, "r", encoding="utf-8") as f:
        test_data = [json.loads(line) for line in f if line.strip()]

    total_examples = len(test_data)
    if args.limit and args.limit < total_examples:
        test_data = test_data[:args.limit]
        total_examples = len(test_data)

    print(f"Evaluating {total_examples} examples...")

    output_path = os.path.abspath(os.path.join(PROJECT_ROOT, args.output))
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    total_time = 0.0
    total_tokens = 0
    stopped_count = 0

    with open(output_path, "w", encoding="utf-8") as out_f:
        for idx, example in enumerate(test_data):
            example_id = example.get("example_id", f"test_{idx}")
            subject = example.get("subject", "unknown")
            question = example.get("question", "")
            ground_truth_reasoning = example.get("reasoning_trace", "")
            ground_truth_answer = example.get("final_answer", "")
            answer_key = example.get("answer_key", "")

            inputs = build_prompt(tokenizer, question)

            if isinstance(inputs, torch.Tensor):
                inputs_gpu = {"input_ids": inputs.to(device)}
            else:
                inputs_gpu = {k: v.to(device) for k, v in inputs.items()}

            prompt_len = inputs_gpu["input_ids"].shape[1]

            gen_start = time.time()
            with torch.no_grad():
                output_ids = model.generate(
                    **inputs_gpu,
                    max_new_tokens=args.max_new_tokens,
                    temperature=args.temperature,
                    top_p=args.top_p,
                    do_sample=args.temperature > 0,
                    pad_token_id=tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id,
                    eos_token_id=stop_token_id,
                )
            gen_time = time.time() - gen_start

            generated_ids = output_ids[0, prompt_len:]
            gen_tokens = len(generated_ids)
            stopped = stop_token_id in generated_ids.tolist()
            if stopped:
                stopped_count += 1

            model_answer = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
            tok_per_sec = gen_tokens / gen_time if gen_time > 0 else 0.0

            result = {
                "index": idx,
                "example_id": example_id,
                "subject": subject,
                "question": question,
                "ground_truth_reasoning": ground_truth_reasoning,
                "ground_truth_answer": ground_truth_answer,
                "answer_key": answer_key,
                "model_answer": model_answer,
                "generated_tokens": gen_tokens,
                "generation_time_seconds": round(gen_time, 3),
                "tokens_per_second": round(tok_per_sec, 2),
                "stopped_at_end": stopped,
            }

            out_f.write(json.dumps(result, ensure_ascii=False) + "\n")
            out_f.flush()

            total_time += gen_time
            total_tokens += gen_tokens

            print(
                f"[{idx + 1:4d}/{total_examples}] {gen_time:6.2f}s | "
                f"{gen_tokens:4d} tok | {tok_per_sec:6.2f} tok/s | "
                f"stop={'YES' if stopped else 'NO'}"
            )

            if idx < 3 or (idx + 1) % 50 == 0:
                print(f"\nQuestion: {question[:300]}")
                print(f"\nModel Answer: {model_answer[:400]}")
                print(f"\nGround Truth Answer: {ground_truth_answer[:400]}")
                print("-" * 70)

    print("\n" + "=" * 70)
    print("EVALUATION COMPLETE")
    print("=" * 70)
    print(f"Total Evaluated: {total_examples}")
    print(f"Stopped at <|end|>: {stopped_count}/{total_examples} ({stopped_count/total_examples*100:.1f}%)" if total_examples > 0 else "")
    print(f"Total Time: {total_time:.2f}s | Total Tokens: {total_tokens} ({total_tokens/total_time:.2f} tok/s)" if total_time > 0 else "")
    print(f"Predictions Saved To: {output_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()