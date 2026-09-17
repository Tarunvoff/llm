"""
Benchmark Data Store
Contains the official model card benchmark results and discovers real local benchmark results.
Maintains strict separation between official and local metrics.
"""

import json
from pathlib import Path
from typing import Dict, Any, List


OFFICIAL_BENCHMARKS = {
    "title": "Aryabhata 2.0 Official Baseline Benchmark Results",
    "source": "https://huggingface.co/PhysicsWallahAI/Aryabhata-2.0",
    "evaluation_method": "Pass@1, 4-sample mean (%)",
    "note": "Baseline benchmark scores for the base model Aryabhata 2.0. Vidhya 2.0 (Fine-Tuned Reasoning) evaluations are pending checkpoint training.",
    "in_distribution": {
        "title": "IN-DISTRIBUTION (Competitive Exam Benchmarks)",
        "metrics": [
            {"name": "JEE Advanced 2025", "score": 86.51},
            {"name": "NEET 2025", "score": 84.66},
            {"name": "JEE Main 2025", "score": 87.80},
            {"name": "JEE Main 2026", "score": 92.99},
            {"name": "Average", "score": 88.95}
        ],
        "comparison_table": [
            {"model": "Gemini 2.5 Flash", "jee_adv_2025": 96.81, "neet_2025": 90.00, "jee_main_2025": 87.26, "jee_main_2026": 96.22, "avg": 90.23},
            {"model": "GPT-5 Mini", "jee_adv_2025": 93.65, "neet_2025": 87.33, "jee_main_2025": 87.07, "jee_main_2026": 95.83, "avg": 89.71},
            {"model": "Aryabhata 2.0 (Base Baseline)", "jee_adv_2025": 86.51, "neet_2025": 84.66, "jee_main_2025": 87.80, "jee_main_2026": 92.99, "avg": 88.95, "highlight": True},
            {"model": "Qwen3-30B-A3B (Thinking)", "jee_adv_2025": 90.48, "neet_2025": 86.00, "jee_main_2025": 84.89, "jee_main_2026": 97.26, "avg": 88.55},
            {"model": "GPT-OSS-120B", "jee_adv_2025": 84.13, "neet_2025": 85.33, "jee_main_2025": 85.61, "jee_main_2026": 95.42, "avg": 88.28},
            {"model": "Nemotron 3 Nano 30B A3B", "jee_adv_2025": 90.87, "neet_2025": 84.00, "jee_main_2025": 82.89, "jee_main_2026": 94.84, "avg": 86.51},
            {"model": "GPT-OSS-20B (Base)", "jee_adv_2025": 77.38, "neet_2025": 81.33, "jee_main_2025": 79.27, "jee_main_2026": 92.46, "avg": 83.00}
        ]
    },
    "out_of_distribution": {
        "title": "OUT-OF-DISTRIBUTION (General Reasoning Benchmarks)",
        "metrics": [
            {"name": "AIME", "score": 86.67},
            {"name": "HMMT", "score": 78.96},
            {"name": "GPQA", "score": 74.86},
            {"name": "MMLU-Pro", "score": 88.49},
            {"name": "MMLU-Redux 2.0", "score": 92.92},
            {"name": "Average", "score": 87.64}
        ],
        "comparison_table": [
            {"model": "GPT-OSS-120B", "aime": 90.00, "hmmt": 80.01, "gpqa": 77.06, "mmlu_pro": 90.11, "mmlu_redux": 95.94, "avg": 89.50},
            {"model": "Qwen3-30B-A3B (Thinking)", "aime": 84.58, "hmmt": 51.88, "gpqa": 73.31, "mmlu_pro": 90.80, "mmlu_redux": 97.77, "avg": 89.42},
            {"model": "Gemini 2.5 Flash", "aime": 66.61, "hmmt": 59.13, "gpqa": 75.09, "mmlu_pro": 90.44, "mmlu_redux": 96.85, "avg": 89.13},
            {"model": "GPT-5 Mini", "aime": 83.33, "hmmt": 70.97, "gpqa": 75.46, "mmlu_pro": 89.64, "mmlu_redux": 96.40, "avg": 88.85},
            {"model": "Aryabhata 2.0 (Base Baseline)", "aime": 86.67, "hmmt": 78.96, "gpqa": 74.86, "mmlu_pro": 88.49, "mmlu_redux": 92.92, "avg": 87.64, "highlight": True},
            {"model": "GPT-OSS-20B (Base)", "aime": 86.67, "hmmt": 77.42, "gpqa": 70.51, "mmlu_pro": 85.42, "mmlu_redux": 93.32, "avg": 84.95},
            {"model": "Nemotron 3 Nano 30B A3B", "aime": 77.08, "hmmt": 65.86, "gpqa": 65.38, "mmlu_pro": 84.33, "mmlu_redux": 94.10, "avg": 83.48}
        ]
    },
    "token_efficiency": {
        "title": "Token Efficiency (Acc./1K tokens)",
        "summary": "Aryabhata 2.0 base achieves high accuracy-per-token ratio among base architectures. Vidhya 2.0 fine-tuning aims to boost reasoning depth while preserving low token overhead.",
        "table": [
            {"model": "Aryabhata 2.0 (Base Baseline)", "in_dist_pass1": 88.95, "in_dist_tokens": 2102, "in_dist_acc_per_1k": 42.31, "ood_pass1": 87.64, "ood_tokens": 2214, "ood_acc_per_1k": 39.58, "highlight": True},
            {"model": "GPT-OSS-120B", "in_dist_pass1": 88.28, "in_dist_tokens": 3312, "in_dist_acc_per_1k": 26.66, "ood_pass1": 89.50, "ood_tokens": 3661, "ood_acc_per_1k": 24.44},
            {"model": "Qwen3-30B-A3B (Thinking)", "in_dist_pass1": 88.55, "in_dist_tokens": 4556, "in_dist_acc_per_1k": 19.44, "ood_pass1": 89.42, "ood_tokens": 4299, "ood_acc_per_1k": 20.80},
            {"model": "GPT-OSS-20B (Base)", "in_dist_pass1": 83.00, "in_dist_tokens": 5293, "in_dist_acc_per_1k": 15.68, "ood_pass1": 84.95, "ood_tokens": 4860, "ood_acc_per_1k": 17.48}
        ]
    },
    "methodology": {
        "title": "Evaluation Methodology",
        "dataset_sources": "Competitive exam papers (JEE Advanced 2025, NEET 2025, JEE Main 2025/2026) and international Olympiad benchmarks (AIME, HMMT, GPQA, MMLU-Pro, MMLU-Redux 2.0).",
        "metric": "Pass@1 (4-sample mean %)",
        "protocol": "Feed standard problem prompt -> model generates step-by-step reasoning -> extract \\boxed{} answer -> deterministic equivalence check against ground truth.",
        "runner_script": "scripts/run_benchmark.py"
    }
}


def get_local_benchmark_results(results_dir: str = "benchmarks/results") -> Dict[str, Any]:
    path = Path(results_dir)
    if not path.exists():
        return {
            "has_local_results": False,
            "message": "No local benchmark results available.",
            "results": []
        }

    json_files = list(path.glob("*.json"))
    if not json_files:
        return {
            "has_local_results": False,
            "message": "No local benchmark results available.",
            "results": []
        }

    results = []
    for jf in json_files:
        try:
            with open(jf, "r", encoding="utf-8") as f:
                data = json.load(f)
                results.append(data)
        except Exception as e:
            print(f"[WARNING] Could not parse local benchmark file '{jf}': {e}")

    if not results:
        return {
            "has_local_results": False,
            "message": "No local benchmark results available.",
            "results": []
        }

    return {
        "has_local_results": True,
        "message": f"{len(results)} local benchmark run(s) found.",
        "results": results
    }


def get_all_benchmark_data(results_dir: str = "benchmarks/results") -> Dict[str, Any]:
    return {
        "official_model_card_results": OFFICIAL_BENCHMARKS,
        "local_benchmark_results": get_local_benchmark_results(results_dir)
    }
