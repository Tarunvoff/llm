#!/usr/bin/env python3
"""
Model Verification Script
Inspects and validates that model weights, configuration, and tokenizer files exist locally and are intact.
"""

import argparse
import os
import sys
from pathlib import Path
import yaml


def format_size(bytes_size: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.2f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.2f} PB"


def load_config(config_path: str = "configs/model.yaml") -> dict:
    path = Path(config_path)
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def verify_model(model_dir: str) -> bool:
    target_path = Path(model_dir)

    print("=" * 70)
    print("MODEL VERIFICATION REPORT")
    print("=" * 70)
    print(f"Target Model Path : {target_path.resolve()}")

    if not target_path.exists() or not target_path.is_dir():
        print(f"Verification Status: FAILED (Directory '{model_dir}' does not exist)")
        print("=" * 70)
        return False

    all_files = list(target_path.rglob("*"))
    files = [f for f in all_files if f.is_file()]

    if not files:
        print(f"Verification Status: FAILED (Directory '{model_dir}' is empty)")
        print("=" * 70)
        return False

    total_size = sum(f.stat().st_size for f in files)

    # Check for config files
    config_files = [f.name for f in files if "config" in f.name.lower() and f.name.endswith(".json")]
    has_config = "config.json" in [f.name for f in files]

    # Check for tokenizer files
    tokenizer_files = [f.name for f in files if "tokenizer" in f.name.lower() or f.name in ["vocab.json", "merges.txt", "spiece.model"]]
    has_tokenizer = len(tokenizer_files) > 0

    # Check for weight checkpoints (safetensors or bin)
    weight_files = [f for f in files if f.name.endswith(".safetensors") or f.name.endswith(".bin")]
    weight_file_names = [f.name for f in weight_files]
    weight_size = sum(f.stat().st_size for f in weight_files)

    print("-" * 70)
    print(f"Total File Count  : {len(files)}")
    print(f"Total Model Size  : {format_size(total_size)} ({total_size:,} bytes)")
    print("-" * 70)
    print(f"Configuration     : {'PRESENT' if has_config else 'MISSING'} ({', '.join(config_files) if config_files else 'None'})")
    print(f"Tokenizer         : {'PRESENT' if has_tokenizer else 'MISSING'} ({', '.join(tokenizer_files) if tokenizer_files else 'None'})")
    print(f"Checkpoints Found : {len(weight_files)} file(s) ({format_size(weight_size)})")

    for wf in weight_files[:10]:
        print(f"  - {wf.name} ({format_size(wf.stat().st_size)})")
    if len(weight_files) > 10:
        print(f"  ... and {len(weight_files) - 10} more weight files")

    # Validation criteria: must have config, tokenizer, and at least one weight checkpoint (>10MB)
    passed = has_config and has_tokenizer and len(weight_files) > 0 and weight_size > 10 * 1024 * 1024

    print("=" * 70)
    if passed:
        print("Verification Status: PASSED (All essential model components are present)")
        print("=" * 70)
        return True
    else:
        reasons = []
        if not has_config:
            reasons.append("Missing config.json")
        if not has_tokenizer:
            reasons.append("Missing tokenizer files")
        if len(weight_files) == 0:
            reasons.append("No checkpoint weight files (.safetensors/.bin) found")
        elif weight_size <= 10 * 1024 * 1024:
            reasons.append("Weight files seem incomplete or truncated")

        print(f"Verification Status: FAILED ({'; '.join(reasons)})")
        print("=" * 70)
        return False


def main():
    parser = argparse.ArgumentParser(description="Verify local model files integrity.")
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
    args = parser.parse_args()

    config = load_config(args.config)
    model_cfg = config.get("model", {})
    model_dir = args.model_dir or model_cfg.get("local_dir", "model/aryabhata-2.0")

    success = verify_model(model_dir)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
