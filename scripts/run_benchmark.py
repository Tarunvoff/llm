#!/usr/bin/env python3
"""
Local Benchmark Runner
Executes evaluation on local benchmark datasets if supplied.
If no dataset is provided, reports that no local benchmark dataset is available.
Never fabricates fake results.
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
import yaml


def load_config(config_path: str = "configs/model.yaml") -> dict:
    path = Path(config_path)
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def run_benchmark_on_dataset(
    dataset_path: str,
    benchmark_name: str,
    model_dir: str,
    output_dir: str = "benchmarks/results"
):
    path = Path(dataset_path)
    if not path.exists():
        print(f"[ERROR] Benchmark dataset file '{dataset_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    # Load dataset items (json or jsonl)
    items = []
    with open(path, "r", encoding="utf-8") as f:
        if path.suffix == ".jsonl":
            for line in f:
                if line.strip():
                    items.append(json.loads(line))
        else:
            items = json.load(f)

    if not items:
        print("[WARNING] Dataset is empty. No evaluations executed.")
        return

    print("=" * 70)
    print(f"RUNNING LOCAL BENCHMARK: {benchmark_name}")
    print(f"Dataset Items : {len(items)}")
    print(f"Model Path    : {os.path.abspath(model_dir)}")
    print("=" * 70)

    # Import inference utilities
    from scripts.run_model import load_model_and_tokenizer, run_inference, load_config
    config = load_config()
    model, tokenizer = load_model_and_tokenizer(model_dir, config)
    system_prompt = config.get("system_prompt")

    results = []
    total_tokens = 0
    total_time = 0.0

    for idx, item in enumerate(items):
        prompt = item.get("prompt") or item.get("question") or item.get("input")
        expected_answer = item.get("answer") or item.get("target") or item.get("ground_truth")

        if not prompt:
            continue

        print(f"Evaluating item [{idx + 1}/{len(items)}]...")
        inf_result = run_inference(
            model=model,
            tokenizer=tokenizer,
            prompt=prompt,
            system_prompt=system_prompt,
            max_new_tokens=config.get("generation", {}).get("max_new_tokens", 4096)
        )

        total_tokens += inf_result["output_tokens"]
        total_time += inf_result["generation_time"]

        results.append({
            "index": idx + 1,
            "prompt": prompt,
            "expected_answer": expected_answer,
            "model_response": inf_result["response"],
            "input_tokens": inf_result["input_tokens"],
            "output_tokens": inf_result["output_tokens"],
            "generation_time": inf_result["generation_time"],
            "tokens_per_sec": inf_result["tokens_per_sec"]
        })

    avg_tokens_per_sec = total_tokens / max(total_time, 1e-6)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    result_file = out_path / f"{benchmark_name}_{timestamp}.json"

    summary_data = {
        "benchmark_name": benchmark_name,
        "dataset_path": str(path.resolve()),
        "model_path": str(Path(model_dir).resolve()),
        "timestamp": datetime.now().isoformat(),
        "total_evaluated": len(results),
        "total_output_tokens": total_tokens,
        "total_time_seconds": total_time,
        "average_tokens_per_sec": avg_tokens_per_sec,
        "evaluations": results
    }

    with open(result_file, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)

    print("\n" + "=" * 70)
    print("LOCAL BENCHMARK EVALUATION COMPLETE")
    print(f"Total Evaluated : {len(results)}")
    print(f"Avg Speed       : {avg_tokens_per_sec:.2f} t/s")
    print(f"Saved Results   : {result_file.resolve()}")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="Evaluate model on local benchmark datasets.")
    parser.add_argument(
        "--dataset",
        type=str,
        default=None,
        help="Path to local benchmark dataset (.json or .jsonl)."
    )
    parser.add_argument(
        "--benchmark-name",
        type=str,
        default="custom_benchmark",
        help="Name of the benchmark suite."
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
        "--output-dir",
        type=str,
        default="benchmarks/results",
        help="Directory to save benchmark output."
    )
    args = parser.parse_args()

    if not args.dataset:
        print("No local benchmark dataset supplied.")
        print("To run local benchmarks, provide a dataset via: python scripts/run_benchmark.py --dataset path/to/dataset.jsonl --benchmark-name <name>")
        sys.exit(0)

    config = load_config(args.config)
    model_dir = args.model_dir or config.get("model", {}).get("local_dir", "model/aryabhata-2.0")

    run_benchmark_on_dataset(
        dataset_path=args.dataset,
        benchmark_name=args.benchmark_name,
        model_dir=model_dir,
        output_dir=args.output_dir
    )


if __name__ == "__main__":
    main()
