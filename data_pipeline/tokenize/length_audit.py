"""
Stage 8a: Token-Length Distribution Audit (Pre-Tokenization Gate)
================================================================

Measures the exact token-length distribution across all balanced splits
using the official Aryabhata 2.0 tokenizer and Harmony chat format:
<|start|>system<|message|>You are Aryabhata, a large language model post trained by PhysicsWallah.
Reasoning: auto

# Valid channels: analysis, commentary, final. Channel must be included for every message.<|end|><|start|>user<|message|>{question}<|end|><|start|>assistant<|channel|>analysis<|message|>{reasoning_trace}<|channel|>final<|message|>{final_answer}<|end|>

Calculates per-subject and overall:
- min, p50, p90, p95, p99, max token length
- count and % of examples exceeding 2048, 4096, and 8192 tokens
- Longest example per subject (example_id, source_dataset, token_count)
Outputs markdown report to data_pipeline/tokenize/length_audit_report.md.
"""

import argparse
import json
import os
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np
import yaml
from transformers import AutoTokenizer


def build_harmony_prompt(question: str, reasoning: str, final_ans: str) -> str:
    """Constructs the full complete Harmony training sequence."""
    sys_header = (
        "<|start|>system<|message|>You are Aryabhata, a large language model post trained by PhysicsWallah.\n"
        "Reasoning: auto\n\n"
        "# Valid channels: analysis, commentary, final. Channel must be included for every message.<|end|>"
    )
    user_turn = f"<|start|>user<|message|>{question.strip()}<|end|>"
    assistant_turn = (
        f"<|start|>assistant<|channel|>analysis<|message|>{reasoning.strip()}"
        f"<|channel|>final<|message|>{final_ans.strip()}<|end|>"
    )
    return f"{sys_header}{user_turn}{assistant_turn}"


def run_length_audit(
    data_dir: Path,
    report_path: Path,
    config_path: str = "configs/model.yaml"
) -> Dict[str, Any]:
    t0 = time.time()
    
    # Load tokenizer
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}

    local_dir = cfg.get("model", {}).get("local_dir", "model/aryabhata-2.0")
    model_id = cfg.get("model", {}).get("model_id", "PhysicsWallahAI/Aryabhata-2.0")
    tok_path = local_dir if Path(local_dir).exists() and (Path(local_dir)/"tokenizer_config.json").exists() else model_id

    print(f"[INFO] Loading Aryabhata 2.0 tokenizer from: {tok_path}...")
    tokenizer = AutoTokenizer.from_pretrained(tok_path, trust_remote_code=True)
    print(f"[INFO] Tokenizer loaded (Vocab: {len(tokenizer):,})")

    # Read all splits from data/sft/v2_reasoning_boost/
    split_files = ["train.jsonl", "val.jsonl", "test.jsonl"]
    all_records: List[Dict[str, Any]] = []

    for s_name in split_files:
        f_path = data_dir / s_name
        if not f_path.exists():
            print(f"[WARNING] File not found: {f_path}")
            continue
        with open(f_path, "r", encoding="utf-8") as f:
            for line_idx, line in enumerate(f):
                if line.strip():
                    r = json.loads(line)
                    r["_split"] = s_name
                    all_records.append(r)

    print(f"[INFO] Auditing {len(all_records):,} examples across {split_files}...")

    # Group measurements by subject
    subject_lengths: Dict[str, List[int]] = defaultdict(list)
    subject_max_example: Dict[str, Dict[str, Any]] = {}
    total_lengths: List[int] = []

    for idx, r in enumerate(all_records):
        subj = (r.get("subject") or "general").lower()
        q = r.get("question") or ""
        reasoning = r.get("reasoning_trace") or ""
        ans = r.get("final_answer") or ""

        full_seq = build_harmony_prompt(q, reasoning, ans)
        tok_ids = tokenizer.encode(full_seq, add_special_tokens=False)
        length = len(tok_ids)

        subject_lengths[subj].append(length)
        total_lengths.append(length)

        if subj not in subject_max_example or length > subject_max_example[subj]["token_length"]:
            subject_max_example[subj] = {
                "example_id": r.get("example_id"),
                "source_dataset": r.get("source_dataset"),
                "token_length": length,
                "split": r.get("_split"),
                "question_preview": q[:120] + ("..." if len(q) > 120 else "")
            }

        if (idx + 1) % 2500 == 0:
            print(f"  -> Tokenized {idx + 1:,} / {len(all_records):,} sequences...")

    # Generate Statistical Markdown Report
    lines = [
        "# Aryabhata 2.0 Token-Length Distribution Audit Report",
        f"\n**Total Sequences Audited**: `{len(all_records):,}` across `{data_dir}`\n",
        "---",
        "## 1. Token Length Percentiles by Subject\n",
        "| Subject | Count | Min | P50 (Median) | P90 | P95 | P99 | Max |",
        "| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |"
    ]

    all_subjects = sorted(subject_lengths.keys())
    for subj in all_subjects:
        arr = np.array(subject_lengths[subj])
        lines.append(
            f"| **{subj.capitalize()}** | {len(arr):,} | {int(np.min(arr))} | {int(np.percentile(arr, 50))} | "
            f"{int(np.percentile(arr, 90))} | **{int(np.percentile(arr, 95))}** | {int(np.percentile(arr, 99))} | {int(np.max(arr))} |"
        )

    tot_arr = np.array(total_lengths)
    lines.append(
        f"| **TOTAL (All Subjects)** | **{len(tot_arr):,}** | {int(np.min(tot_arr))} | {int(np.percentile(tot_arr, 50))} | "
        f"{int(np.percentile(tot_arr, 90))} | **{int(np.percentile(tot_arr, 95))}** | {int(np.percentile(tot_arr, 99))} | **{int(np.max(tot_arr))}** |"
    )

    # Threshold Exceedance Table
    lines.extend([
        "\n---",
        "## 2. Sequence Length Threshold Exceedance\n",
        "| Subject | Total Count | > 2,048 Tokens | % > 2,048 | > 4,096 Tokens | % > 4,096 | > 8,192 Tokens | % > 8,192 |",
        "| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |"
    ])

    for subj in all_subjects:
        arr = np.array(subject_lengths[subj])
        n = len(arr)
        gt_2048 = int(np.sum(arr > 2048))
        gt_4096 = int(np.sum(arr > 4096))
        gt_8192 = int(np.sum(arr > 8192))
        lines.append(
            f"| **{subj.capitalize()}** | {n:,} | {gt_2048:,} | {gt_2048/n*100:.2f}% | "
            f"{gt_4096:,} | {gt_4096/n*100:.2f}% | {gt_8192:,} | {gt_8192/n*100:.2f}% |"
        )

    tot_gt_2048 = int(np.sum(tot_arr > 2048))
    tot_gt_4096 = int(np.sum(tot_arr > 4096))
    tot_gt_8192 = int(np.sum(tot_arr > 8192))
    tot_n = len(tot_arr)
    lines.append(
        f"| **TOTAL** | **{tot_n:,}** | **{tot_gt_2048:,}** | **{tot_gt_2048/tot_n*100:.2f}%** | "
        f"**{tot_gt_4096:,}** | **{tot_gt_4096/tot_n*100:.2f}%** | **{tot_gt_8192:,}** | **{tot_gt_8192/tot_n*100:.2f}%** |"
    )

    # Longest Outlier Examples Table
    lines.extend([
        "\n---",
        "## 3. Longest Outlier Examples by Subject\n",
        "| Subject | Token Length | Source Dataset | Example ID | Split | Question Preview |",
        "| :--- | :---: | :--- | :--- | :---: | :--- |"
    ])

    for subj in all_subjects:
        outlier = subject_max_example[subj]
        lines.append(
            f"| **{subj.capitalize()}** | `{outlier['token_length']:,}` | `{outlier['source_dataset']}` | "
            f"`{outlier['example_id']}` | `{outlier['split']}` | {outlier['question_preview']} |"
        )

    t_end = time.time()
    lines.append(f"\n---\n*Audit completed in {t_end - t0:.2f}s using Aryabhata 2.0 tokenizer.*")

    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\n[SUCCESS] Token length audit report generated at: {report_path}")

    return {
        "total_audited": len(all_records),
        "total_percentiles": {
            "min": int(np.min(tot_arr)),
            "p50": int(np.percentile(tot_arr, 50)),
            "p90": int(np.percentile(tot_arr, 90)),
            "p95": int(np.percentile(tot_arr, 95)),
            "p99": int(np.percentile(tot_arr, 99)),
            "max": int(np.max(tot_arr))
        },
        "exceedance": {
            "gt_2048": tot_gt_2048,
            "gt_4096": tot_gt_4096,
            "gt_8192": tot_gt_8192
        },
        "outliers": subject_max_example
    }


def main():
    parser = argparse.ArgumentParser(description="Stage 8a: Sequence Length Audit.")
    parser.add_argument("--data-dir", type=str, default="data/sft/v2_reasoning_boost", help="Path to splits directory")
    parser.add_argument("--output-report", type=str, default="data_pipeline/tokenize/length_audit_report.md", help="Output markdown report path")
    parser.add_argument("--config", type=str, default="configs/model.yaml", help="Path to model.yaml")

    args = parser.parse_args()
    run_length_audit(
        data_dir=Path(args.data_dir).resolve(),
        report_path=Path(args.output_report).resolve(),
        config_path=args.config
    )


if __name__ == "__main__":
    main()
