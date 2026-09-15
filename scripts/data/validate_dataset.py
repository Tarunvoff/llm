#!/usr/bin/env python3
"""Dataset validation script for SFT and DPO data.

Performs schema verification, missing field detection, duplicate checks,
train/val/test data leakage checks, and conversation-level split verification.

Usage:
    python scripts/data/validate_dataset.py --train-file data/sft/train.jsonl --val-file data/sft/validation.jsonl
    python scripts/data/validate_dataset.py --dpo-file data/dpo/train_dpo.jsonl
"""

import argparse
from collections import Counter
import hashlib
import json
import os
import sys
from typing import Any, Dict, List, Optional, Set, Tuple


REQUIRED_SFT_METADATA_FIELDS = {"subject", "grade", "concept"}
VALID_ROLES = {"user", "assistant", "system"}


def compute_hash(text: str) -> str:
    """Computes SHA-256 hash of normalized text."""
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()


def validate_sft_example(
    example: Dict[str, Any], index: int
) -> Tuple[bool, List[str]]:
    """Validates a single SFT training example."""
    errors = []
    if "messages" not in example:
        errors.append(f"Row {index}: Missing 'messages' field.")
        return False, errors

    messages = example.get("messages", [])
    if not isinstance(messages, list) or len(messages) < 2:
        errors.append(f"Row {index}: 'messages' must be a list with at least 2 turns (user + assistant).")
        return False, errors

    for turn_idx, msg in enumerate(messages):
        if not isinstance(msg, dict):
            errors.append(f"Row {index}, Turn {turn_idx}: Message is not a dict.")
            continue
        role = msg.get("role")
        content = msg.get("content")

        if role not in VALID_ROLES:
            errors.append(f"Row {index}, Turn {turn_idx}: Invalid role '{role}'. Valid roles: {VALID_ROLES}.")
        if not content or not isinstance(content, str) or len(content.strip()) == 0:
            errors.append(f"Row {index}, Turn {turn_idx}: Content is empty or not a string.")

    # Metadata check
    metadata = example.get("metadata", {})
    if not isinstance(metadata, dict):
        errors.append(f"Row {index}: 'metadata' must be a dictionary.")
    else:
        for field in REQUIRED_SFT_METADATA_FIELDS:
            if field not in metadata or not str(metadata.get(field, "")).strip():
                errors.append(f"Row {index}: Metadata missing required field '{field}'.")

    return len(errors) == 0, errors


def validate_dpo_example(
    example: Dict[str, Any], index: int
) -> Tuple[bool, List[str]]:
    """Validates a single DPO preference pair."""
    errors = []
    required_fields = ["prompt", "chosen", "rejected"]
    for field in required_fields:
        if field not in example or not isinstance(example[field], str) or len(example[field].strip()) == 0:
            errors.append(f"Row {index}: Missing or empty required DPO field '{field}'.")

    if "chosen" in example and "rejected" in example:
        if example["chosen"].strip() == example["rejected"].strip():
            errors.append(f"Row {index}: 'chosen' and 'rejected' responses are identical.")

    return len(errors) == 0, errors


def validate_file(
    file_path: str, is_dpo: bool = False
) -> Tuple[bool, List[Dict[str, Any]], List[str]]:
    """Reads and validates an entire JSONL file."""
    if not os.path.exists(file_path):
        return False, [], [f"File does not exist: {file_path}"]

    valid_examples = []
    all_errors = []

    with open(file_path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                example = json.loads(line)
            except json.JSONDecodeError as e:
                all_errors.append(f"Row {idx}: JSON parse error: {e}")
                continue

            if is_dpo:
                is_valid, errors = validate_dpo_example(example, idx)
            else:
                is_valid, errors = validate_sft_example(example, idx)

            if is_valid:
                valid_examples.append(example)
            else:
                all_errors.extend(errors)

    return len(all_errors) == 0, valid_examples, all_errors


def check_leakage_and_duplicates(
    train_examples: List[Dict[str, Any]],
    val_examples: List[Dict[str, Any]],
    test_examples: Optional[List[Dict[str, Any]]] = None,
    is_dpo: bool = False,
) -> Tuple[bool, List[str]]:
    """Checks for duplicates within splits and leakage between splits."""
    errors = []

    def get_fingerprint(ex: Dict[str, Any]) -> str:
        if is_dpo:
            return compute_hash(ex["prompt"])
        else:
            first_user_msg = next((m["content"] for m in ex["messages"] if m["role"] == "user"), "")
            return compute_hash(first_user_msg)

    def get_conversation_id(ex: Dict[str, Any]) -> str:
        return ex.get("metadata", {}).get("conversation_id", "")

    train_hashes = set()
    train_conv_ids = set()

    for idx, ex in enumerate(train_examples, start=1):
        fp = get_fingerprint(ex)
        if fp in train_hashes:
            errors.append(f"Duplicate example detected within train set (Row ~{idx}).")
        train_hashes.add(fp)

        conv_id = get_conversation_id(ex)
        if conv_id:
            train_conv_ids.add(conv_id)

    val_hashes = set()
    for idx, ex in enumerate(val_examples, start=1):
        fp = get_fingerprint(ex)
        if fp in train_hashes:
            errors.append(f"Data leakage: Validation row ~{idx} matches an example in train set.")
        val_hashes.add(fp)

        conv_id = get_conversation_id(ex)
        if conv_id and conv_id in train_conv_ids:
            errors.append(f"Conversation leakage: Conversation '{conv_id}' exists in both train and val.")

    if test_examples:
        for idx, ex in enumerate(test_examples, start=1):
            fp = get_fingerprint(ex)
            if fp in train_hashes:
                errors.append(f"Data leakage: Test row ~{idx} matches an example in train set.")
            if fp in val_hashes:
                errors.append(f"Data leakage: Test row ~{idx} matches an example in validation set.")
            conv_id = get_conversation_id(ex)
            if conv_id and conv_id in train_conv_ids:
                errors.append(f"Conversation leakage: Conversation '{conv_id}' exists in both train and test.")

    return len(errors) == 0, errors


def print_statistics(examples: List[Dict[str, Any]], is_dpo: bool = False):
    """Prints breakdown statistics of dataset."""
    print(f"\nTotal valid examples: {len(examples)}")
    if is_dpo or not examples:
        return

    subjects = Counter(ex.get("metadata", {}).get("subject", "unknown") for ex in examples)
    grades = Counter(str(ex.get("metadata", {}).get("grade", "unknown")) for ex in examples)
    strategies = Counter(ex.get("metadata", {}).get("strategy", "unspecified") for ex in examples)

    print("  Subject breakdown:", dict(subjects))
    print("  Grade breakdown:  ", dict(grades))
    print("  Strategy breakdown:", dict(strategies))


def main():
    parser = argparse.ArgumentParser(description="Validate SFT and DPO datasets.")
    parser.add_argument("--train-file", type=str, default=None, help="Path to train JSONL")
    parser.add_argument("--val-file", type=str, default=None, help="Path to val JSONL")
    parser.add_argument("--test-file", type=str, default=None, help="Path to test JSONL")
    parser.add_argument("--dpo-file", type=str, default=None, help="Path to DPO JSONL")

    args = parser.parse_args()

    has_errors = False

    if args.dpo_file:
        print(f"Validating DPO dataset: {args.dpo_file}")
        valid, dpo_examples, errors = validate_file(args.dpo_file, is_dpo=True)
        if not valid:
            has_errors = True
            print(f"FAILED: Found {len(errors)} errors in DPO file:")
            for e in errors[:10]:
                print(f"  - {e}")
        else:
            print("OK: DPO dataset is valid.")
            print_statistics(dpo_examples, is_dpo=True)

    if args.train_file:
        print(f"\nValidating SFT Train dataset: {args.train_file}")
        train_valid, train_examples, train_errors = validate_file(args.train_file, is_dpo=False)
        if not train_valid:
            has_errors = True
            print(f"FAILED: Found {len(train_errors)} errors in train file:")
            for e in train_errors[:10]:
                print(f"  - {e}")
        else:
            print("OK: Train dataset format valid.")
            print_statistics(train_examples, is_dpo=False)

        val_examples = []
        if args.val_file:
            print(f"\nValidating SFT Val dataset: {args.val_file}")
            val_valid, val_examples, val_errors = validate_file(args.val_file, is_dpo=False)
            if not val_valid:
                has_errors = True
                print(f"FAILED: Found {len(val_errors)} errors in val file:")
                for e in val_errors[:10]:
                    print(f"  - {e}")
            else:
                print("OK: Validation dataset format valid.")

        test_examples = []
        if args.test_file:
            print(f"\nValidating SFT Test dataset: {args.test_file}")
            test_valid, test_examples, test_errors = validate_file(args.test_file, is_dpo=False)
            if not test_valid:
                has_errors = True
                print(f"FAILED: Found {len(test_errors)} errors in test file:")
                for e in test_errors[:10]:
                    print(f"  - {e}")
            else:
                print("OK: Test dataset format valid.")

        if train_valid and val_examples:
            leak_ok, leak_errors = check_leakage_and_duplicates(
                train_examples, val_examples, test_examples, is_dpo=False
            )
            if not leak_ok:
                has_errors = True
                print("\nFAILED: Duplicate / Leakage checks failed:")
                for e in leak_errors:
                    print(f"  - {e}")
            else:
                print("\nOK: Leakage and duplicate checks passed.")

    if has_errors:
        sys.exit(1)
    print("\nAll dataset checks PASSED successfully.")


if __name__ == "__main__":
    main()
