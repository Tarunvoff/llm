"""
Stage 1 (Expanded): Comprehensive Source Ingestion
==================================================

Ingests all specified sources according to exact pipeline specifications:
1. nvidia/OpenMathReasoning: 20-shard spread across 144 shards (cot), 2,500 rows/shard -> 50,000 rows (seed=42).
2. openlifescienceai/medmcqa: Full train split (194k rows).
3. PRIME-RL/Eurus-2-SFT-Data: Parquet dataset (train split).
4. camel-ai (physics, chemistry, math, biology): Zip downloads & JSON conversation extraction.
5. 169Pi/exambench: JSON competitive exam reasoning dataset.

Outputs written to data_pipeline/raw/<safe_id>/.
Logs row counts and metadata to data_pipeline/run_manifest.json.
"""

import json
import random
import sys
import zipfile
from pathlib import Path
from typing import Any, Dict, List

import pyarrow.parquet as pq
from datasets import load_dataset
from huggingface_hub import hf_hub_download

# Add parent directory for manifest utilities
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from manifest.manifest_utils import append_stage_manifest


def ingest_openmath_reasoning(target_dir: Path, total_target: int = 50000, seed: int = 42) -> Dict[str, Any]:
    """Downloads a 20-shard spread across 144 cot shards and samples 50,000 rows."""
    out_dir = target_dir / "nvidia__OpenMathReasoning"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "train.jsonl"
    meta_file = out_dir / "meta.json"

    if out_file.exists() and meta_file.exists():
        print(f"[INFO] nvidia/OpenMathReasoning already ingested at {out_file}. Skipping.")
        with open(meta_file, "r", encoding="utf-8") as f:
            return json.load(f)

    # 20 equidistant shard indices across 144 shards
    shard_indices = [int(round(i * (143 / 19))) for i in range(20)]
    per_shard_target = total_target // len(shard_indices)
    print(f"[INFO] Ingesting nvidia/OpenMathReasoning: 20 shards ({shard_indices}), {per_shard_target} rows/shard (Target: {total_target:,})...")

    random.seed(seed)
    total_written = 0

    with open(out_file, "w", encoding="utf-8") as out_f:
        for idx in shard_indices:
            shard_name = f"data/cot-{idx:05d}-of-00144.parquet"
            print(f"  -> Fetching shard {shard_name}...")
            try:
                local_path = hf_hub_download(
                    repo_id="nvidia/OpenMathReasoning",
                    filename=shard_name,
                    repo_type="dataset"
                )
                pf = pq.ParquetFile(local_path)
                table = pf.read()
                df = table.to_pandas()
                rows = df.to_dict(orient="records")
                random.shuffle(rows)
                selected = rows[:per_shard_target]

                for r in selected:
                    out_f.write(json.dumps(r, default=str) + "\n")
                    total_written += 1
                print(f"     Extracted {len(selected):,} rows from shard {idx} (Cumulative: {total_written:,})")
            except Exception as e:
                print(f"     [ERROR] Failed to process shard {idx}: {e}")

    summary = {
        "hf_id": "nvidia/OpenMathReasoning",
        "safe_id": "nvidia__OpenMathReasoning",
        "subject": "math",
        "role": "train",
        "status": "success",
        "total_rows": total_written,
        "splits": {"train": total_written},
        "storage_path": str(out_dir),
        "sampling_strategy": "20-shard equidistant spread across 144 cot shards, seed=42"
    }
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    return summary


def ingest_medmcqa(target_dir: Path) -> Dict[str, Any]:
    """Ingests openlifescienceai/medmcqa dataset."""
    out_dir = target_dir / "openlifescienceai__medmcqa"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "train.jsonl"
    meta_file = out_dir / "meta.json"

    if out_file.exists() and meta_file.exists():
        print(f"[INFO] openlifescienceai/medmcqa already ingested at {out_file}. Skipping.")
        with open(meta_file, "r", encoding="utf-8") as f:
            return json.load(f)

    print("[INFO] Ingesting openlifescienceai/medmcqa...")
    p = hf_hub_download(
        repo_id="openlifescienceai/medmcqa",
        filename="data/train-00000-of-00001.parquet",
        repo_type="dataset"
    )
    table = pq.read_table(p)
    df = table.to_pandas()
    rows = df.to_dict(orient="records")

    with open(out_file, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, default=str) + "\n")

    summary = {
        "hf_id": "openlifescienceai/medmcqa",
        "safe_id": "openlifescienceai__medmcqa",
        "subject": "biology",
        "role": "train",
        "status": "success",
        "total_rows": len(rows),
        "splits": {"train": len(rows)},
        "storage_path": str(out_dir)
    }
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"  -> Ingested {len(rows):,} rows for medmcqa.")
    return summary


def ingest_eurus2(target_dir: Path) -> Dict[str, Any]:
    """Ingests PRIME-RL/Eurus-2-SFT-Data."""
    out_dir = target_dir / "PRIME-RL__Eurus-2-SFT-Data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "train.jsonl"
    meta_file = out_dir / "meta.json"

    if out_file.exists() and meta_file.exists():
        print(f"[INFO] PRIME-RL/Eurus-2-SFT-Data already ingested at {out_file}. Skipping.")
        with open(meta_file, "r", encoding="utf-8") as f:
            return json.load(f)

    print("[INFO] Ingesting PRIME-RL/Eurus-2-SFT-Data...")
    p = hf_hub_download(
        repo_id="PRIME-RL/Eurus-2-SFT-Data",
        filename="0000.parquet",
        repo_type="dataset"
    )
    table = pq.read_table(p)
    df = table.to_pandas()
    rows = df.to_dict(orient="records")

    with open(out_file, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, default=str) + "\n")

    summary = {
        "hf_id": "PRIME-RL/Eurus-2-SFT-Data",
        "safe_id": "PRIME-RL__Eurus-2-SFT-Data",
        "subject": "math",
        "role": "train_with_care",
        "status": "success",
        "total_rows": len(rows),
        "splits": {"train": len(rows)},
        "storage_path": str(out_dir)
    }
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"  -> Ingested {len(rows):,} rows for Eurus-2.")
    return summary


def ingest_camel_ai_domain(target_dir: Path, subject: str) -> Dict[str, Any]:
    """Downloads zip and extracts JSON conversation files for a camel-ai domain."""
    repo_id = f"camel-ai/{subject}"
    safe_id = f"camel-ai__{subject}"
    out_dir = target_dir / safe_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "train.jsonl"
    meta_file = out_dir / "meta.json"

    if out_file.exists() and meta_file.exists():
        print(f"[INFO] {repo_id} already ingested at {out_file}. Skipping.")
        with open(meta_file, "r", encoding="utf-8") as f:
            return json.load(f)

    print(f"[INFO] Ingesting {repo_id}...")
    zip_path = hf_hub_download(
        repo_id=repo_id,
        filename=f"{subject}.zip",
        repo_type="dataset"
    )

    total_extracted = 0
    with zipfile.ZipFile(zip_path, "r") as z, open(out_file, "w", encoding="utf-8") as out_f:
        for fn in z.namelist():
            if fn.endswith(".json"):
                try:
                    content = z.read(fn).decode("utf-8")
                    data = json.loads(content)
                    data["_file_id"] = fn
                    out_f.write(json.dumps(data, ensure_ascii=False) + "\n")
                    total_extracted += 1
                except Exception:
                    continue

    summary = {
        "hf_id": repo_id,
        "safe_id": safe_id,
        "subject": subject,
        "role": "train_with_care",
        "status": "success",
        "total_rows": total_extracted,
        "splits": {"train": total_extracted},
        "storage_path": str(out_dir)
    }
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"  -> Ingested {total_extracted:,} rows for {repo_id}.")
    return summary


def ingest_exambench(target_dir: Path) -> Dict[str, Any]:
    """Ingests 169Pi/exambench."""
    out_dir = target_dir / "169Pi__exambench"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "train.jsonl"
    meta_file = out_dir / "meta.json"

    if out_file.exists() and meta_file.exists():
        print(f"[INFO] 169Pi/exambench already ingested at {out_file}. Skipping.")
        with open(meta_file, "r", encoding="utf-8") as f:
            return json.load(f)

    print("[INFO] Ingesting 169Pi/exambench...")
    p = hf_hub_download(
        repo_id="169Pi/exambench",
        filename="Alpie-core_competitive_exams_dataset.json",
        repo_type="dataset"
    )

    total_extracted = 0
    with open(p, "r", encoding="utf-8") as in_f, open(out_file, "w", encoding="utf-8") as out_f:
        data = json.load(in_f)
        for row in data:
            out_f.write(json.dumps(row, ensure_ascii=False) + "\n")
            total_extracted += 1

    summary = {
        "hf_id": "169Pi/exambench",
        "safe_id": "169Pi__exambench",
        "subject": "mixed",
        "role": "train_with_care",
        "status": "success",
        "total_rows": total_extracted,
        "splits": {"train": total_extracted},
        "storage_path": str(out_dir)
    }
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"  -> Ingested {total_extracted:,} rows for 169Pi/exambench.")
    return summary


def main():
    target_raw = Path("data_pipeline/raw").resolve()
    target_raw.mkdir(parents=True, exist_ok=True)
    manifest_path = "data_pipeline/run_manifest.json"

    results = []
    
    # 1. OpenMathReasoning
    results.append(ingest_openmath_reasoning(target_raw, total_target=50000, seed=42))
    
    # 2. MedMCQA
    results.append(ingest_medmcqa(target_raw))
    
    # 3. Eurus-2
    results.append(ingest_eurus2(target_raw))
    
    # 4. camel-ai (physics, chemistry, math, biology)
    for subj in ["physics", "chemistry", "math", "biology"]:
        results.append(ingest_camel_ai_domain(target_raw, subj))
        
    # 5. exambench
    results.append(ingest_exambench(target_raw))

    append_stage_manifest(
        stage_name="download",
        stage_data={
            "datasets_processed": len(results),
            "summary": results
        },
        manifest_path=manifest_path
    )
    print("\n[SUCCESS] Ingestion of all sources complete!")


if __name__ == "__main__":
    main()
