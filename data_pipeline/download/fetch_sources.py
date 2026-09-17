"""
Stage 1: Source Dataset Ingestion
==================================

Downloads HuggingFace datasets based on configs/sources.yaml.
Strictly separates training data (raw/) from evaluation benchmarks (eval_holdout/).
Logs row counts and metadata to run_manifest.json.
Idempotent: skips datasets if already downloaded.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
import yaml
from datasets import load_dataset

# Add parent directory to path to import manifest_utils
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from manifest.manifest_utils import append_stage_manifest


def get_safe_id(hf_id: str) -> str:
    """Converts a HuggingFace repository ID into a filesystem-safe directory name."""
    return hf_id.replace("/", "__")


def load_sources_config(config_path: str) -> List[Dict[str, Any]]:
    """Loads sources list from YAML config file."""
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    return data.get("sources", [])


def download_single_dataset(
    entry: Dict[str, Any],
    train_dir: Path,
    eval_dir: Path,
    max_samples: Optional[int] = None
) -> Dict[str, Any]:
    """
    Downloads a single dataset via datasets.load_dataset and serializes to JSONL.
    Enforces directory separation based on role (eval_only -> eval_dir, others -> train_dir).
    """
    hf_id = entry["hf_id"]
    role = entry.get("role", "train")
    safe_id = get_safe_id(hf_id)
    
    target_base = eval_dir if role == "eval_only" else train_dir
    dataset_dir = target_base / safe_id
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    meta_file = dataset_dir / "meta.json"
    if meta_file.exists():
        print(f"[INFO] Skipping already downloaded dataset: {hf_id} ({dataset_dir})")
        with open(meta_file, "r", encoding="utf-8") as f:
            return json.load(f)

    print(f"[INFO] Downloading: {hf_id} (Role: {role}) -> {dataset_dir}")
    try:
        from datasets import get_dataset_config_names
        try:
            available_configs = get_dataset_config_names(hf_id)
        except Exception:
            available_configs = []
        
        # If dataset requires explicit config selection
        if len(available_configs) > 1 and "default" not in available_configs:
            print(f"  -> Detected multiple sub-configs for {hf_id}: {available_configs}")
            target_configs = entry.get("subsets") or available_configs
            ds_dict = {}
            for cfg in target_configs:
                print(f"  -> Fetching subset '{cfg}'...")
                sub_ds = load_dataset(hf_id, cfg)
                for split_name, split_data in (sub_ds.items() if hasattr(sub_ds, "items") else [(cfg, sub_ds)]):
                    key = f"{cfg}_{split_name}" if hasattr(sub_ds, "items") else cfg
                    ds_dict[key] = split_data
            ds = ds_dict
        else:
            subset = entry.get("subset")
            ds = load_dataset(hf_id, subset) if subset else load_dataset(hf_id)
    except Exception as e:
        print(f"[ERROR] Failed to download {hf_id}: {e}")
        return {
            "hf_id": hf_id,
            "role": role,
            "status": "failed",
            "error": str(e),
            "total_rows": 0,
            "splits": {}
        }

    splits_info = {}
    total_rows = 0

    # ds can be a DatasetDict or Dataset
    split_items = ds.items() if hasattr(ds, "items") else [("train", ds)]
    for split_name, split_data in split_items:
        if max_samples and len(split_data) > max_samples:
            split_data = split_data.select(range(max_samples))
        
        split_count = len(split_data)
        splits_info[split_name] = split_count
        total_rows += split_count
        
        output_file = dataset_dir / f"{split_name}.jsonl"
        print(f"  -> Writing split '{split_name}' ({split_count} rows) to {output_file.name}")
        
        with open(output_file, "w", encoding="utf-8") as f:
            for row in split_data:
                f.write(json.dumps(row, default=str) + "\n")

    summary = {
        "hf_id": hf_id,
        "safe_id": safe_id,
        "subject": entry.get("subject", "unspecified"),
        "role": role,
        "status": "success",
        "total_rows": total_rows,
        "splits": splits_info,
        "storage_path": str(dataset_dir)
    }

    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return summary


def main():
    parser = argparse.ArgumentParser(description="Stage 1: Ingest source datasets from HuggingFace.")
    parser.add_argument("--config", type=str, default="data_pipeline/configs/sources.yaml", help="Path to sources.yaml")
    parser.add_argument("--train-dir", type=str, default="data_pipeline/raw", help="Target dir for train/train_with_care datasets")
    parser.add_argument("--eval-dir", type=str, default="data_pipeline/eval_holdout", help="Target dir for eval_only datasets")
    parser.add_argument("--manifest", type=str, default="data_pipeline/run_manifest.json", help="Path to run_manifest.json")
    parser.add_argument("--dataset", type=str, default=None, help="Optional: Download only a single dataset by hf_id")
    parser.add_argument("--max-samples", type=int, default=None, help="Optional: Limit rows per split for test runs")
    
    args = parser.parse_args()

    train_path = Path(args.train_dir).resolve()
    eval_path = Path(args.eval_dir).resolve()
    train_path.mkdir(parents=True, exist_ok=True)
    eval_path.mkdir(parents=True, exist_ok=True)

    sources = load_sources_config(args.config)
    if args.dataset:
        sources = [s for s in sources if s["hf_id"] == args.dataset]
        if not sources:
            print(f"[ERROR] Dataset '{args.dataset}' not found in {args.config}")
            sys.exit(1)

    print(f"[INFO] Loaded {len(sources)} dataset configuration(s).")
    results = []
    
    for entry in sources:
        res = download_single_dataset(
            entry=entry,
            train_dir=train_path,
            eval_dir=eval_path,
            max_samples=args.max_samples
        )
        results.append(res)

    # Append to run_manifest.json
    append_stage_manifest(
        stage_name="download",
        stage_data={
            "datasets_processed": len(results),
            "summary": results
        },
        manifest_path=args.manifest
    )
    print(f"\n[SUCCESS] Ingestion completed. Appended results to {args.manifest}")


if __name__ == "__main__":
    main()
