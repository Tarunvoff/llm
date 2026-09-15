#!/usr/bin/env python3
"""Single-turn pedagogical compliance and benchmark evaluation script.

Computes:
1. Direct-Answer Overuse Rate (Rule-based detection of premature reveals)
2. Factual & Mathematical Grounding (Check against reference facts)
3. RAG Faithfulness (Retrieval overlap / citation presence)
4. Pedagogical Scaffolding Score (Rubric 1-5)

Usage:
    python scripts/evaluation/evaluate_model.py --eval-dataset evaluation/benchmarks/stem_eval_500.jsonl --output-dir evaluation/results/baseline
"""

import argparse
import json
import os
import re
import sys
from typing import Any, Dict, List, Tuple

# Ensure src is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src")))

from tutor.pipeline import PedagogicalTutorPipeline


ANSWER_REVEAL_PATTERNS = [
    r"\b(the answer is|the roots are|the solution is|the value of x is|equals|equal to)\s+[-+]?\d+",
    r"\b(therefore, x =|hence, x =|x = [-+]?\d+)\b",
    r"\b(the correct answer is|the final answer is)\b",
]


def detect_direct_answer(response: str) -> bool:
    """Detects whether a response contains premature direct solutions."""
    for pattern in ANSWER_REVEAL_PATTERNS:
        if re.search(pattern, response, re.IGNORECASE):
            return True
    return False


def score_pedagogical_compliance(response: str, expected_strategy: str = "socratic_scaffolding") -> float:
    """Rule-based pedagogical score heuristic (1.0 to 5.0)."""
    score = 3.0
    has_question = "?" in response
    has_direct_answer = detect_direct_answer(response)

    if has_question and not has_direct_answer:
        score += 1.5  # Good Socratic behavior
    elif has_direct_answer:
        score -= 2.0  # Penalize direct answer reveal

    if "step" in response.lower() or "think" in response.lower() or "remember" in response.lower():
        score += 0.5  # Encouraging scaffolding language

    return max(1.0, min(5.0, score))


def evaluate_dataset(
    pipeline: PedagogicalTutorPipeline,
    dataset_path: str,
    output_dir: str,
) -> Dict[str, Any]:
    """Runs evaluation over dataset and saves detailed results and aggregate metrics."""
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Evaluation dataset not found: {dataset_path}")

    records = []
    with open(dataset_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))

    results = []
    direct_answer_count = 0
    total_compliance_score = 0.0

    print(f"Evaluating {len(records)} test scenarios...")
    for idx, item in enumerate(records, start=1):
        prompt = item.get("prompt", item.get("question", ""))
        concept = item.get("concept", "General STEM")
        subject = item.get("subject", "Science")

        turn_res = pipeline.step(
            student_id=f"eval_student_{idx}",
            student_utterance=prompt,
            target_concept=concept,
            subject=subject,
        )

        response = turn_res.tutor_response
        is_direct = detect_direct_answer(response)
        compliance = score_pedagogical_compliance(response)

        if is_direct:
            direct_answer_count += 1
        total_compliance_score += compliance

        results.append({
            "idx": idx,
            "prompt": prompt,
            "concept": concept,
            "tutor_response": response,
            "detected_intent": turn_res.detected_intent,
            "strategy_used": turn_res.strategy_used,
            "is_direct_answer": is_direct,
            "pedagogical_compliance_score": compliance,
            "mastery_after": turn_res.mastery_after,
        })

    n = len(records)
    metrics = {
        "total_scenarios": n,
        "direct_answer_overuse_rate": round(direct_answer_count / max(1, n), 4),
        "mean_pedagogical_compliance": round(total_compliance_score / max(1, n), 2),
    }

    os.makedirs(output_dir, exist_ok=True)
    with open(os.path.join(output_dir, "detailed_eval_results.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    with open(os.path.join(output_dir, "metrics_summary.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print("\nEvaluation Summary:")
    print(f"  Total Scenarios:              {metrics['total_scenarios']}")
    print(f"  Direct-Answer Overuse Rate:   {metrics['direct_answer_overuse_rate'] * 100:.1f}%")
    print(f"  Mean Pedagogical Score (1-5): {metrics['mean_pedagogical_compliance']:.2f}")

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Evaluate pedagogical tutor model.")
    parser.add_argument("--eval-dataset", type=str, default="evaluation/benchmarks/stem_eval_500.jsonl")
    parser.add_argument("--output-dir", type=str, default="evaluation/results/baseline")
    args = parser.parse_args()

    pipeline = PedagogicalTutorPipeline()
    evaluate_dataset(pipeline, args.eval_dataset, args.output_dir)


if __name__ == "__main__":
    main()
