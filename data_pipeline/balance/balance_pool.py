"""
Stage 6b: Source-Ratio Balanced Pool Construction (Option C)
============================================================

Builds the final balanced SFT pool from clean decontaminated data using explicit source allocations:
1. Math (4,000 rows):
   - nvidia/OpenMathReasoning: 2,200 rows (overweighted for olympiad rigor)
   - PRIME-RL/Eurus-2-SFT-Data: 1,800 rows
2. Biology (4,000 rows):
   - FreedomIntelligence/medical-o1-reasoning-SFT: 2,200 rows (overweighted for clinical CoT depth)
   - openlifescienceai/medmcqa: 1,800 rows
3. Chemistry: 2,828 rows (all clean available)
4. Physics: 516 rows (all clean available)

Outputs: data_pipeline/balance/sft_pool_balanced.jsonl (Total: 11,344 rows)
"""

import argparse
import json
import random
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List

# Add parent directory for manifest utilities
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from manifest.manifest_utils import append_stage_manifest


def balance_pool_option_c(
    input_file: Path,
    output_file: Path,
    manifest_path: str,
    seed: int = 42
) -> Dict[str, Any]:
    random.seed(seed)
    
    if not input_file.exists():
        raise FileNotFoundError(f"Clean pool file not found: {input_file}")

    # Group clean rows by (subject, source_dataset)
    bucketed: Dict[str, Dict[str, List[Dict[str, Any]]]] = defaultdict(lambda: defaultdict(list))
    
    with open(input_file, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                row = json.loads(line)
                subj = (row.get("subject") or "unspecified").lower()
                src = row.get("source_dataset") or "unknown"
                bucketed[subj][src].append(row)

    # Target allocations
    targets = {
        "math": {
            "nvidia/OpenMathReasoning": 2200,
            "PRIME-RL/Eurus-2-SFT-Data": 1800
        },
        "biology": {
            "FreedomIntelligence/medical-o1-reasoning-SFT": 2200,
            "openlifescienceai/medmcqa": 1800
        },
        "chemistry": {
            "Abc8264/Jee-Chemistry-dataset-with-COT": 2339,
            "eQOURSE/jee-main-questions": 489
        },
        "physics": {
            "eQOURSE/jee-main-questions": 516
        }
    }

    balanced_pool: List[Dict[str, Any]] = []
    allocation_summary: Dict[str, Dict[str, int]] = defaultdict(dict)

    for subj, src_targets in targets.items():
        for src, target_cnt in src_targets.items():
            avail_rows = bucketed[subj][src]
            random.shuffle(avail_rows)
            selected = avail_rows[:target_cnt]
            balanced_pool.extend(selected)
            allocation_summary[subj][src] = len(selected)
            print(f"[INFO] {subj.upper()} | {src}: Selected {len(selected):,} / {len(avail_rows):,} rows (Target: {target_cnt:,})")

    random.shuffle(balanced_pool)
    total_balanced = len(balanced_pool)
    print(f"\n[INFO] Final Balanced Pool: {total_balanced:,} examples.")

    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        for r in balanced_pool:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    stats = {
        "strategy": "Option C (Explicit Source Allocation)",
        "total_balanced_rows": total_balanced,
        "subject_distribution": dict(Counter(r.get("subject") for r in balanced_pool)),
        "source_allocation_summary": dict(allocation_summary),
        "seed": seed
    }

    append_stage_manifest(
        stage_name="balance_sampling",
        stage_data=stats,
        manifest_path=manifest_path
    )

    print(f"[SUCCESS] Balanced pool saved to {output_file}")
    return stats


def main():
    parser = argparse.ArgumentParser(description="Stage 6b: Balance pool with Option C allocations.")
    parser.add_argument("--input-file", type=str, default="data_pipeline/decontaminate/sft_pool_clean.jsonl", help="Clean dataset path")
    parser.add_argument("--output-file", type=str, default="data_pipeline/balance/sft_pool_balanced.jsonl", help="Balanced output path")
    parser.add_argument("--manifest", type=str, default="data_pipeline/run_manifest.json", help="Path to run_manifest.json")
    parser.add_argument("--seed", type=int, default=42, help="Sampling seed")

    args = parser.parse_args()
    balance_pool_option_c(
        input_file=Path(args.input_file).resolve(),
        output_file=Path(args.output_file).resolve(),
        manifest_path=args.manifest,
        seed=args.seed
    )


if __name__ == "__main__":
    main()
