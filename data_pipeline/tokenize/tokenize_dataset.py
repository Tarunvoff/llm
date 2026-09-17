"""
Stage 8: Aryabhata 2.0 Harmony Tokenization & Loss Masking
===========================================================

Tokenizes SFT dataset splits into HuggingFace Dataset Arrow format
(input_ids, attention_mask, labels) using Aryabhata 2.0 tokenizer and Harmony chat format.

Harmony Structure:
  <|start|>system<|message|>You are Aryabhata, a large language model post trained by PhysicsWallah.
  Reasoning: auto

  # Valid channels: analysis, commentary, final. Channel must be included for every message.<|end|>
  <|start|>user<|message|>{question}<|end|>
  <|start|>assistant<|channel|>analysis<|message|>{reasoning_trace}<|channel|>final<|message|>{final_answer}<|end|>

Loss Masking Rules:
  - System prompt, user question turn, and channel headers -> label = -100
  - Analysis channel reasoning content -> label = actual token_ids
  - Final channel answer content -> label = actual token_ids

Truncation Rules (max_seq_length = 8192):
  - Sequences > 24,000 tokens -> Hard DROP (extreme_outlier_beyond_threshold).
  - Sequences between 8,192 and 24,000 tokens -> Truncate from END of analysis channel.
  - If truncation would cut into final channel -> DROP (dropped_answer_truncation).
  - Truncated examples logged to data_pipeline/tokenize/truncated_examples.jsonl.
"""

import argparse
import json
import os
import shutil
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import datasets
import yaml
from transformers import AutoTokenizer

# Add parent directory for manifest utilities
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from manifest.manifest_utils import append_stage_manifest


SYSTEM_PROMPT = (
    "<|start|>system<|message|>You are Aryabhata, a large language model post trained by PhysicsWallah.\n"
    "Reasoning: auto\n\n"
    "# Valid channels: analysis, commentary, final. Channel must be included for every message.<|end|>"
)


def format_harmony_components(question: str, reasoning: str, final_ans: str) -> Dict[str, str]:
    """Breaks down the Harmony format into its constituent masked / unmasked parts."""
    return {
        "system_and_user": f"{SYSTEM_PROMPT}<|start|>user<|message|>{question.strip()}<|end|><|start|>assistant<|channel|>analysis<|message|>",
        "reasoning": reasoning.strip(),
        "channel_bridge": "<|channel|>final<|message|>",
        "final_answer": f"{final_ans.strip()}<|end|>"
    }


def tokenize_single_example(
    row: Dict[str, Any],
    tokenizer: Any,
    max_seq_length: int = 8192,
    hard_max_length: int = 24000
) -> Tuple[Optional[Dict[str, List[int]]], Optional[Dict[str, Any]]]:
    """
    Tokenizes a single row with exact label masking and analysis-channel-only truncation.
    Returns: (tokenized_dict, drop_record_or_truncation_record)
    """
    example_id = row.get("example_id", "")
    q = row.get("question", "")
    reasoning = row.get("reasoning_trace", "")
    ans = row.get("final_answer", "")

    comp = format_harmony_components(q, reasoning, ans)

    # Encode components separately
    prompt_ids = tokenizer.encode(comp["system_and_user"], add_special_tokens=False)
    reasoning_ids = tokenizer.encode(comp["reasoning"], add_special_tokens=False)
    bridge_ids = tokenizer.encode(comp["channel_bridge"], add_special_tokens=False)
    answer_ids = tokenizer.encode(comp["final_answer"], add_special_tokens=False)

    total_len = len(prompt_ids) + len(reasoning_ids) + len(bridge_ids) + len(answer_ids)

    # Rule 1: Hard drop for extreme outliers > hard_max_length (24,000)
    if total_len > hard_max_length:
        return None, {
            "example_id": example_id,
            "source_dataset": row.get("source_dataset"),
            "original_length": total_len,
            "status": "dropped",
            "reason": "extreme_outlier_beyond_threshold"
        }

    # Rule 2: Check if truncation is needed
    truncated_log = None
    if total_len > max_seq_length:
        # Non-negotiable token budget for prompt + bridge + answer
        fixed_budget = len(prompt_ids) + len(bridge_ids) + len(answer_ids)
        available_for_reasoning = max_seq_length - fixed_budget

        # If even without reasoning the prompt + answer exceed max_seq_length -> Drop
        if available_for_reasoning < 16:
            return None, {
                "example_id": example_id,
                "source_dataset": row.get("source_dataset"),
                "original_length": total_len,
                "status": "dropped",
                "reason": "dropped_answer_truncation"
            }

        # Truncate reasoning from the end
        reasoning_ids = reasoning_ids[:available_for_reasoning]
        truncated_log = {
            "example_id": example_id,
            "source_dataset": row.get("source_dataset"),
            "original_length": total_len,
            "truncated_length": len(prompt_ids) + len(reasoning_ids) + len(bridge_ids) + len(answer_ids),
            "status": "truncated",
            "reason": "analysis_tail_truncated"
        }

    # Assemble input_ids, attention_mask, and labels
    input_ids = prompt_ids + reasoning_ids + bridge_ids + answer_ids
    attention_mask = [1] * len(input_ids)

    # Labels: -100 for prompt and bridge tokens, actual IDs for reasoning and answer tokens
    labels = (
        [-100] * len(prompt_ids) +
        list(reasoning_ids) +
        [-100] * len(bridge_ids) +
        list(answer_ids)
    )

    assert len(input_ids) == len(labels) == len(attention_mask), "Tensor dimension mismatch!"

    return {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
        "labels": labels
    }, truncated_log


def process_split_file(
    input_file: Path,
    output_dir: Optional[Path],
    tokenizer: Any,
    max_seq_length: int = 8192,
    hard_max_length: int = 24000,
    sample_limit: Optional[int] = None
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
    """Tokenizes a single split JSONL file."""
    rows: List[Dict[str, Any]] = []
    with open(input_file, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))

    if sample_limit and sample_limit < len(rows):
        rows = rows[:sample_limit]

    tokenized_data: List[Dict[str, List[int]]] = []
    logs: List[Dict[str, Any]] = []
    dropped_count = 0
    truncated_count = 0

    for r in rows:
        tok_res, log_res = tokenize_single_example(
            r,
            tokenizer=tokenizer,
            max_seq_length=max_seq_length,
            hard_max_length=hard_max_length
        )
        if tok_res is not None:
            tokenized_data.append(tok_res)
        if log_res is not None:
            logs.append(log_res)
            if log_res["status"] == "dropped":
                dropped_count += 1
            elif log_res["status"] == "truncated":
                truncated_count += 1

    stats = {
        "input_rows": len(rows),
        "kept_rows": len(tokenized_data),
        "dropped_rows": dropped_count,
        "truncated_rows": truncated_count,
        "max_seq_length": max_seq_length
    }

    # If output_dir is specified, save as Arrow dataset
    if output_dir is not None and tokenized_data:
        output_dir.mkdir(parents=True, exist_ok=True)
        hf_ds = datasets.Dataset.from_dict({
            "input_ids": [d["input_ids"] for d in tokenized_data],
            "attention_mask": [d["attention_mask"] for d in tokenized_data],
            "labels": [d["labels"] for d in tokenized_data]
        })
        hf_ds.save_to_disk(str(output_dir))
        print(f"[INFO] Saved {len(hf_ds):,} tokenized examples to: {output_dir}")

    return tokenized_data, logs, stats


def print_decoded_example_verification(tokenized_example: Dict[str, List[int]], tokenizer: Any, example_num: int = 1):
    """Visual inspection tool: Decodes input_ids and prints label mask alignment."""
    input_ids = tokenized_example["input_ids"]
    labels = tokenized_example["labels"]

    decoded_full = tokenizer.decode(input_ids)
    
    # Extract unmasked tokens (where label != -100)
    unmasked_ids = [tid for tid, lab in zip(input_ids, labels) if lab != -100]
    decoded_learned = tokenizer.decode(unmasked_ids)

    # Extract masked tokens (where label == -100)
    masked_ids = [tid for tid, lab in zip(input_ids, labels) if lab == -100]
    decoded_masked = tokenizer.decode(masked_ids)

    print(f"\n=======================================================")
    print(f"       SAMPLE VERIFICATION INSPECTION (EXAMPLE #{example_num})")
    print(f"=======================================================")
    print(f"Total Sequence Tokens: {len(input_ids)} | Loss-Trained Tokens: {len(unmasked_ids)} | Masked (-100) Tokens: {len(masked_ids)}")
    print(f"\n--- 1. FULL ROUNDTRIP DECODED TEXT ---")
    print(decoded_full[:500] + ("\n... [truncated for display] ...\n" if len(decoded_full) > 500 else "") + decoded_full[-300:])
    print(f"\n--- 2. MASKED TOKENS (label = -100, ZERO LOSS) ---")
    print(decoded_masked[:300] + ("..." if len(decoded_masked) > 300 else ""))
    print(f"\n--- 3. UNMASKED LEARNED TOKENS (label != -100, ACTIVE SFT LOSS) ---")
    print(decoded_learned[:400] + ("\n... [analysis body] ...\n" if len(decoded_learned) > 400 else "") + decoded_learned[-200:])
    print(f"=======================================================\n")


def main():
    parser = argparse.ArgumentParser(description="Stage 8: Tokenize dataset with Harmony template and loss masking.")
    parser.add_argument("--data-dir", type=str, default="data/sft/v2_reasoning_boost", help="Path to SFT splits directory")
    parser.add_argument("--output-dir", type=str, default="data/sft/v2_reasoning_boost/tokenized", help="Target tokenized output directory")
    parser.add_argument("--config", type=str, default="configs/model.yaml", help="Path to model.yaml")
    parser.add_argument("--max-seq-length", type=int, default=8192, help="Maximum sequence length (default: 8192)")
    parser.add_argument("--hard-max-length", type=int, default=24000, help="Hard drop threshold (default: 24000)")
    parser.add_argument("--sample-test", type=int, default=None, help="If set, run on a sample of train split only for verification (e.g. 200)")
    parser.add_argument("--manifest", type=str, default="data_pipeline/run_manifest.json", help="Path to run_manifest.json")

    args = parser.parse_args()

    # Load tokenizer
    with open(args.config, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}

    local_dir = cfg.get("model", {}).get("local_dir", "model/aryabhata-2.0")
    model_id = cfg.get("model", {}).get("model_id", "PhysicsWallahAI/Aryabhata-2.0")
    tok_path = local_dir if Path(local_dir).exists() and (Path(local_dir)/"tokenizer_config.json").exists() else model_id

    print(f"[INFO] Initializing Aryabhata 2.0 tokenizer from: {tok_path}...")
    tokenizer = AutoTokenizer.from_pretrained(tok_path, trust_remote_code=True)

    data_path = Path(args.data_dir).resolve()
    out_path = Path(args.output_dir).resolve()

    if args.sample_test:
        print(f"\n[INFO] Running DRY-RUN verification on {args.sample_test}-row sample of train.jsonl...")
        train_file = data_path / "train.jsonl"
        tokenized_data, logs, stats = process_split_file(
            input_file=train_file,
            output_dir=None,
            tokenizer=tokenizer,
            max_seq_length=args.max_seq_length,
            hard_max_length=args.hard_max_length,
            sample_limit=args.sample_test
        )
        print(f"\n[SAMPLE STATS]: {stats}")
        print(f"Logged {len(logs)} truncation/drop events from {args.sample_test} sample rows.")

        # Print 2 decoded verification examples
        if len(tokenized_data) >= 1:
            print_decoded_example_verification(tokenized_data[0], tokenizer, example_num=1)
        if len(tokenized_data) >= 2:
            print_decoded_example_verification(tokenized_data[1], tokenizer, example_num=2)

        print("\n[VERIFICATION GATE READY] Inspect the sample decoded outputs above.")
        return

    # Full Run across train, val, test
    print(f"\n[INFO] Executing FULL tokenization across train, val, test (max_seq_length={args.max_seq_length})...")
    all_logs = []
    summary_stats = {}

    for split in ["train", "val", "test"]:
        in_f = data_path / f"{split}.jsonl"
        out_d = out_path / split
        print(f"\n--- Processing {split} split ({in_f}) ---")
        tok_data, logs, stats = process_split_file(
            input_file=in_f,
            output_dir=out_d,
            tokenizer=tokenizer,
            max_seq_length=args.max_seq_length,
            hard_max_length=args.hard_max_length
        )
        all_logs.extend(logs)
        summary_stats[split] = stats

    # Write truncated/dropped logs
    log_file = Path("data_pipeline/tokenize/truncated_examples.jsonl").resolve()
    log_file.parent.mkdir(parents=True, exist_ok=True)
    with open(log_file, "w", encoding="utf-8") as f:
        for l in all_logs:
            f.write(json.dumps(l, ensure_ascii=False) + "\n")

    # Update manifest
    manifest_payload = {
        "max_seq_length": args.max_seq_length,
        "hard_max_length": args.hard_max_length,
        "split_tokenization_summary": summary_stats,
        "total_log_records": len(all_logs),
        "truncated_log_file": str(log_file),
        "tokenized_output_dir": str(out_path)
    }
    append_stage_manifest(
        stage_name="tokenization",
        stage_data=manifest_payload,
        manifest_path=args.manifest
    )

    print(f"\n[SUCCESS] Full tokenization complete! Manifest updated and datasets saved to {out_path}")


if __name__ == "__main__":
    main()
