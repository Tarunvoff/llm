#!/usr/bin/env python3
"""JEE / NEET / STEM Dataset Downloader for Hugging Face Hub.

Downloads, verifies, and organizes educational and benchmark datasets
for JEE, NEET, NCERT, General Science, and Multimodal reasoning.

Usage:
    python scripts/data/download_hf_datasets.py --output-dir dataset
    python scripts/data/download_hf_datasets.py --output-dir dataset --category jee neet
    python scripts/data/download_hf_datasets.py --export-jsonl --export-parquet
"""

import argparse
import logging
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    from datasets import DatasetDict, Dataset, load_dataset
except ImportError:
    print(
        "ERROR: 'datasets' package is required. Install via: pip install datasets huggingface_hub",
        file=sys.stderr,
    )
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("DatasetDownloader")


@dataclass
class DatasetConfig:
    repo_id: str
    relative_path: str
    category: str
    description: str
    subset: Optional[str] = None
    trust_remote_code: bool = False


# Catalog of datasets for JEE / NEET / STEM fine-tuning & evaluation
DATASET_CATALOG: List[DatasetConfig] = [
    # --- Student Questions ---
    DatasetConfig(
        repo_id="SetFit/student-question-categories",
        relative_path="raw/student_questions",
        category="student_questions",
        description="Student Question Categories & Intents",
    ),
    # --- JEE Main ---
    DatasetConfig(
        repo_id="eQOURSE/jee-main-questions",
        relative_path="raw/jee/jee-main",
        category="jee",
        description="JEE Main Physics, Chemistry & Mathematics Questions",
    ),
    # --- JEE Advanced ---
    DatasetConfig(
        repo_id="Grass-G/jee-advanced-questions",
        relative_path="raw/jee/jee-advanced",
        category="jee",
        description="JEE Advanced Problem Set & Solutions",
    ),
    # --- JEE SFT ---
    DatasetConfig(
        repo_id="farhananis005/jee-sft-v1",
        relative_path="raw/jee/jee-sft-v1",
        category="jee",
        description="JEE Supervised Fine-Tuning Corpus (v1)",
    ),
    # --- JEE GRPO / Reasoning ---
    DatasetConfig(
        repo_id="farhananis005/jee-grpo-v1",
        relative_path="raw/jee/jee-grpo-v1",
        category="jee",
        description="JEE Group Relative Policy Optimization / RL Dataset",
    ),
    # --- NEET Standard ---
    DatasetConfig(
        repo_id="Kshitij-PES/NEET_Dataset",
        relative_path="raw/neet/neet-dataset",
        category="neet",
        description="NEET Biology, Physics & Chemistry Exam Dataset",
    ),
    # --- NEET Tutor / Instruction ---
    DatasetConfig(
        repo_id="catchshubham/neet-dataset",
        relative_path="raw/neet/neet-tutor",
        category="neet",
        description="NEET Socratic Instruction & Tutoring Dataset",
    ),
    # --- NCERT ---
    DatasetConfig(
        repo_id="theshivam7/ncert-dataset",
        relative_path="raw/ncert/ncert-dataset",
        category="ncert",
        description="NCERT Curriculum Textbook Questions & Explanations",
    ),
    # --- General Science Q&A ---
    DatasetConfig(
        repo_id="169Pi/Science-QnA",
        relative_path="raw/science/science-qna",
        category="science",
        description="General STEM & Science Question Answering",
    ),
    # --- Multimodal JEE / NEET ---
    DatasetConfig(
        repo_id="RJTR001/jee-neet-benchmark",
        relative_path="raw/multimodal/rjtr001",
        category="multimodal",
        description="Multimodal JEE / NEET Benchmark (RJTR001)",
    ),
    DatasetConfig(
        repo_id="Vyshnavi93920/jee-neet-benchmark",
        relative_path="raw/multimodal/vyshnavi",
        category="multimodal",
        description="Multimodal JEE / NEET Benchmark (Vyshnavi)",
    ),
    # --- Benchmarks: Nalanda ---
    DatasetConfig(
        repo_id="Nalandadata/NalandaJEENEETBench",
        relative_path="benchmarks/nalanda",
        category="benchmarks",
        description="Nalanda JEE / NEET Comprehensive Benchmark",
    ),
    # --- Benchmarks: JEEBench ---
    DatasetConfig(
        repo_id="daman1209arora/jeebench",
        relative_path="benchmarks/jeebench",
        category="benchmarks",
        description="JEEBench Standardized Evaluation Suite",
    ),
    # --- Benchmarks: Indic JEEBench ---
    DatasetConfig(
        repo_id="anushakamathofficial/indic_jee_bench",
        relative_path="benchmarks/indic-jeebench",
        category="benchmarks",
        description="Indic Languages JEE Benchmark Suite",
    ),
]


def format_size(size_bytes: int) -> str:
    """Format bytes into human-readable size string."""
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"


def get_dir_size(path: Path) -> int:
    """Calculate total size of files inside a directory."""
    if not path.exists():
        return 0
    total = 0
    for p in path.rglob("*"):
        if p.is_file():
            total += p.stat().st_size
    return total


def download_single_dataset(
    cfg: DatasetConfig,
    base_output_dir: Path,
    token: Optional[str] = None,
    max_retries: int = 3,
    export_jsonl: bool = False,
    export_parquet: bool = False,
) -> Tuple[bool, str, Dict[str, int]]:
    """Download a single dataset with retry logic and optional format export.

    Returns:
        (success, message, split_counts)
    """
    target_dir = base_output_dir / cfg.relative_path
    target_dir.mkdir(parents=True, exist_ok=True)

    logger.info("=" * 60)
    logger.info(f"Downloading [{cfg.category.upper()}]: {cfg.repo_id}")
    logger.info(f"Description: {cfg.description}")
    logger.info(f"Target Directory: {target_dir}")
    logger.info("=" * 60)

    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            kwargs = {}
            if token:
                kwargs["token"] = token
            if cfg.subset:
                kwargs["name"] = cfg.subset
            if cfg.trust_remote_code:
                kwargs["trust_remote_code"] = True

            logger.info(f"Attempt {attempt}/{max_retries}: Fetching from HF Hub...")
            ds = load_dataset(cfg.repo_id, **kwargs)

            # Summarize splits
            split_counts = {}
            if isinstance(ds, DatasetDict):
                for split_name, split_ds in ds.items():
                    split_counts[split_name] = len(split_ds)
            elif isinstance(ds, Dataset):
                split_counts["train"] = len(ds)
            else:
                split_counts["data"] = -1

            # Save dataset to disk (Arrow format)
            logger.info(f"Saving Hugging Face dataset to disk: {target_dir}")
            ds.save_to_disk(str(target_dir))

            # Export to JSONL if requested
            if export_jsonl:
                jsonl_dir = target_dir / "jsonl"
                jsonl_dir.mkdir(parents=True, exist_ok=True)
                if isinstance(ds, DatasetDict):
                    for split_name, split_ds in ds.items():
                        out_file = jsonl_dir / f"{split_name}.jsonl"
                        split_ds.to_json(str(out_file))
                        logger.info(f"Exported JSONL: {out_file}")
                elif isinstance(ds, Dataset):
                    out_file = jsonl_dir / "train.jsonl"
                    ds.to_json(str(out_file))

            # Export to Parquet if requested
            if export_parquet:
                parquet_dir = target_dir / "parquet"
                parquet_dir.mkdir(parents=True, exist_ok=True)
                if isinstance(ds, DatasetDict):
                    for split_name, split_ds in ds.items():
                        out_file = parquet_dir / f"{split_name}.parquet"
                        split_ds.to_parquet(str(out_file))
                        logger.info(f"Exported Parquet: {out_file}")
                elif isinstance(ds, Dataset):
                    out_file = parquet_dir / "train.parquet"
                    ds.to_parquet(str(out_file))

            logger.info(f"SUCCESS: {cfg.repo_id} saved to {target_dir} ({split_counts})")
            return True, "OK", split_counts

        except Exception as e:
            last_err = e
            logger.warning(
                f"Attempt {attempt} failed for {cfg.repo_id}: {type(e).__name__} - {e}"
            )
            if attempt < max_retries:
                sleep_time = 2**attempt
                logger.info(f"Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)

    err_msg = f"Failed after {max_retries} attempts: {last_err}"
    logger.error(f"ERROR: {cfg.repo_id} -> {err_msg}")
    return False, str(last_err), {}


def main():
    parser = argparse.ArgumentParser(
        description="Download JEE, NEET, NCERT, and Benchmark datasets for server training/evaluation."
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        type=str,
        default="dataset",
        help="Base directory to store downloaded datasets (default: 'dataset')",
    )
    parser.add_argument(
        "--category",
        "-c",
        nargs="+",
        choices=[
            "all",
            "jee",
            "neet",
            "ncert",
            "science",
            "multimodal",
            "benchmarks",
            "student_questions",
        ],
        default=["all"],
        help="Categories of datasets to download (default: all)",
    )
    parser.add_argument(
        "--token",
        "-t",
        type=str,
        default=os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN"),
        help="Hugging Face API token for gated or private datasets (or set HF_TOKEN env var)",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=3,
        help="Maximum download retry attempts per dataset (default: 3)",
    )
    parser.add_argument(
        "--export-jsonl",
        action="store_true",
        help="Also export splits to newline-delimited JSON (.jsonl)",
    )
    parser.add_argument(
        "--export-parquet",
        action="store_true",
        help="Also export splits to Apache Parquet (.parquet)",
    )
    parser.add_argument(
        "--list-only",
        action="store_true",
        help="List cataloged datasets without downloading",
    )

    args = parser.parse_args()

    base_dir = Path(args.output_dir).resolve()

    # Filter by category
    selected_categories = set(args.category)
    if "all" in selected_categories:
        datasets_to_download = DATASET_CATALOG
    else:
        datasets_to_download = [
            d for d in DATASET_CATALOG if d.category in selected_categories
        ]

    if args.list_only:
        print("\n================ DATASET CATALOG ================")
        for d in datasets_to_download:
            print(f"[{d.category.upper():16}] {d.repo_id:40} -> {d.relative_path}")
            print(f"                     Desc: {d.description}")
        print("=================================================\n")
        return

    logger.info("=" * 70)
    logger.info("JEE / NEET / STEM SERVER DATASET DOWNLOAD PIPELINE")
    logger.info(f"Target Base Directory: {base_dir}")
    logger.info(f"Total Datasets to Process: {len(datasets_to_download)}")
    logger.info("=" * 70)

    base_dir.mkdir(parents=True, exist_ok=True)

    results = []
    start_time = time.time()

    for idx, cfg in enumerate(datasets_to_download, 1):
        logger.info(f"\n[{idx}/{len(datasets_to_download)}] Processing {cfg.repo_id}...")
        success, msg, splits = download_single_dataset(
            cfg=cfg,
            base_output_dir=base_dir,
            token=args.token,
            max_retries=args.max_retries,
            export_jsonl=args.export_jsonl,
            export_parquet=args.export_parquet,
        )
        dir_path = base_dir / cfg.relative_path
        size_bytes = get_dir_size(dir_path) if success else 0
        results.append(
            {
                "repo_id": cfg.repo_id,
                "category": cfg.category,
                "path": str(cfg.relative_path),
                "success": success,
                "message": msg,
                "splits": splits,
                "size_formatted": format_size(size_bytes),
                "size_bytes": size_bytes,
            }
        )

    elapsed_time = time.time() - start_time

    # Summary table
    logger.info("\n" + "=" * 80)
    logger.info("DOWNLOAD SUMMARY REPORT")
    logger.info("=" * 80)
    logger.info(
        f"{'Status':<8} {'Category':<15} {'Repository':<35} {'Size':<12} {'Splits / Counts'}"
    )
    logger.info("-" * 80)

    total_downloaded_size = 0
    successful_count = 0

    for r in results:
        status_str = "SUCCESS" if r["success"] else "FAILED"
        split_summary = ", ".join(f"{k}:{v}" for k, v in r["splits"].items()) if r["splits"] else r["message"]
        if r["success"]:
            successful_count += 1
            total_downloaded_size += r["size_bytes"]
        logger.info(
            f"{status_str:<8} {r['category']:<15} {r['repo_id']:<35} {r['size_formatted']:<12} {split_summary}"
        )

    total_size_str = format_size(total_downloaded_size)
    logger.info("=" * 80)
    logger.info(
        f"Completed: {successful_count}/{len(datasets_to_download)} datasets downloaded successfully in {elapsed_time:.1f}s."
    )
    logger.info(f"Total Disk Usage in '{base_dir}': {total_size_str}")
    logger.info("=" * 80)

    if successful_count < len(datasets_to_download):
        logger.warning(
            "Some datasets failed to download. Check network connection or Hugging Face access permissions."
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
