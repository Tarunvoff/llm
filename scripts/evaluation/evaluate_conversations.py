#!/usr/bin/env python3
"""Multi-turn conversation evaluation for Scaffolding Collapse.

Simulates multi-turn student trajectories (with repeated failure, begging for direct answers,
and partial understanding) to measure whether the tutor collapses into direct-answering
as the conversation lengthens.

Usage:
    python scripts/evaluation/evaluate_conversations.py --scenarios evaluation/benchmarks/scaffolding_scenarios.jsonl --output-dir evaluation/results/scaffolding_stability
"""

import argparse
import json
import os
import sys
from typing import Any, Dict, List

# Ensure src and scripts are in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

from evaluation.evaluate_model import detect_direct_answer
from tutor.pipeline import PedagogicalTutorPipeline


def evaluate_multiturn_conversations(
    pipeline: PedagogicalTutorPipeline,
    scenarios_path: str,
    output_dir: str,
) -> Dict[str, Any]:
    """Runs multi-turn simulated dialogues and evaluates scaffolding collapse rate."""
    if not os.path.exists(scenarios_path):
        raise FileNotFoundError(f"Scenarios file not found: {scenarios_path}")

    with open(scenarios_path, "r", encoding="utf-8") as f:
        scenarios = [json.loads(line) for line in f if line.strip()]

    conversation_results = []
    collapsed_conversations = 0
    total_turns = 0
    direct_answers_in_early_turns = 0

    print(f"Evaluating {len(scenarios)} multi-turn student trajectories...")

    for s_idx, scenario in enumerate(scenarios, start=1):
        concept = scenario.get("concept", "General STEM")
        subject = scenario.get("subject", "Science")
        student_id = f"sim_student_{s_idx:03d}"
        turns = scenario.get("turns", [])

        history = []
        dialogue_log = []
        has_collapsed = False

        for t_idx, student_turn in enumerate(turns, start=1):
            total_turns += 1
            turn_res = pipeline.step(
                student_id=student_id,
                student_utterance=student_turn,
                target_concept=concept,
                conversation_history=history,
                subject=subject,
            )

            is_direct = detect_direct_answer(turn_res.tutor_response)

            # Scaffolding collapse definition: Direct answer given prematurely in early/mid turns (< turn 4)
            # when student was just begging for answer
            if is_direct and t_idx < 4:
                direct_answers_in_early_turns += 1
                has_collapsed = True

            dialogue_log.append({
                "turn": t_idx,
                "student_utterance": student_turn,
                "tutor_response": turn_res.tutor_response,
                "detected_intent": turn_res.detected_intent,
                "strategy_used": turn_res.strategy_used,
                "is_direct_answer": is_direct,
                "mastery_after": turn_res.mastery_after,
            })

            history.append({"role": "user", "content": student_turn})
            history.append({"role": "assistant", "content": turn_res.tutor_response})

        if has_collapsed:
            collapsed_conversations += 1

        conversation_results.append({
            "scenario_id": scenario.get("id", f"sc_{s_idx}"),
            "concept": concept,
            "subject": subject,
            "has_scaffolding_collapse": has_collapsed,
            "turns_count": len(turns),
            "transcript": dialogue_log,
        })

    n_convs = len(scenarios)
    metrics = {
        "total_conversations": n_convs,
        "total_turns": total_turns,
        "collapsed_conversations": collapsed_conversations,
        "scaffolding_collapse_rate": round(collapsed_conversations / max(1, n_convs), 4),
        "early_turn_direct_answer_rate": round(direct_answers_in_early_turns / max(1, total_turns), 4),
    }

    os.makedirs(output_dir, exist_ok=True)
    with open(os.path.join(output_dir, "multi_turn_eval_transcripts.json"), "w", encoding="utf-8") as f:
        json.dump(conversation_results, f, indent=2)

    with open(os.path.join(output_dir, "scaffolding_stability_summary.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print("\nMulti-Turn Scaffolding Stability Results:")
    print(f"  Total Conversations:          {metrics['total_conversations']}")
    print(f"  Scaffolding Collapse Rate:    {metrics['scaffolding_collapse_rate'] * 100:.1f}%")
    print(f"  Early-Turn Direct Reveal Rate:{metrics['early_turn_direct_answer_rate'] * 100:.1f}%")

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Evaluate multi-turn scaffolding stability.")
    parser.add_argument("--scenarios", type=str, default="evaluation/benchmarks/scaffolding_scenarios.jsonl")
    parser.add_argument("--output-dir", type=str, default="evaluation/results/scaffolding_stability")
    args = parser.parse_args()

    pipeline = PedagogicalTutorPipeline()
    evaluate_multiturn_conversations(pipeline, args.scenarios, args.output_dir)


if __name__ == "__main__":
    main()
