"""
Stage 6: Domain & Difficulty Distribution Reporting
===================================================

Audits the clean, decontaminated training pool (data_pipeline/decontaminate/sft_pool_clean.jsonl).
Generates human-readable markdown tables:
1. Cross-tabulation: Subject (Math, Physics, Chemistry, Biology, Medicine) x Difficulty.
2. Source dataset representation breakdown.
3. Subject-level source composition (shows exact per-subject dataset mix).
4. Deduplication & Decontamination impact breakdown per source.
5. Flags underrepresented subjects (<5%) and dominant sources (>60%).
Outputs report to data_pipeline/balance/balance_report.md.
Logs distribution metrics to run_manifest.json.
"""

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add parent directory for manifest utilities
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from manifest.manifest_utils import append_stage_manifest


def generate_balance_report(input_file: Path, output_md: Path, manifest_path: str) -> Dict[str, Any]:
    """Generates distribution tables and audit flags for clean dataset."""
    if not input_file.exists():
        raise FileNotFoundError(f"Clean pool file not found: {input_file}")

    rows: List[Dict[str, Any]] = []
    with open(input_file, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))

    total_count = len(rows)
    print(f"[INFO] Analyzing distribution across {total_count:,} clean examples...")

    if total_count == 0:
        print("[WARNING] Dataset pool is empty.")
        return {}

    # Load run_manifest to inspect dedup and decontamination metrics if available
    manifest_data: Dict[str, Any] = {}
    dedup_stage: Dict[str, Any] = {}
    decontam_stage: Dict[str, Any] = {}
    if Path(manifest_path).exists():
        try:
            with open(manifest_path, "r", encoding="utf-8") as mf:
                manifest_data = json.load(mf)
                stages = manifest_data.get("stages", [])
                if isinstance(stages, list):
                    for st in stages:
                        if st.get("stage") == "dedup":
                            dedup_stage = st.get("data", {})
                        elif st.get("stage") == "decontaminate":
                            decontam_stage = st.get("data", {})
                elif isinstance(stages, dict):
                    dedup_stage = stages.get("dedup", {})
                    decontam_stage = stages.get("decontaminate", {})
        except Exception:
            pass

    # 1. Subject x Difficulty Matrix
    matrix: Dict[str, Counter] = defaultdict(Counter)
    subject_counts: Counter = Counter()
    difficulty_counts: Counter = Counter()
    source_counts: Counter = Counter()

    for r in rows:
        subj = (r.get("subject") or "unspecified").lower()
        diff = (r.get("difficulty") or "unspecified").lower()
        src = r.get("source_dataset") or "unknown"

        matrix[subj][diff] += 1
        subject_counts[subj] += 1
        difficulty_counts[diff] += 1
        source_counts[src] += 1

    all_difficulties = sorted(difficulty_counts.keys())
    all_subjects = sorted(subject_counts.keys())

    # Flags
    underrepresented_subjects = []
    for s, c in subject_counts.items():
        pct = (c / total_count) * 100
        if pct < 5.0:
            underrepresented_subjects.append({"subject": s, "count": c, "percentage": round(pct, 2)})

    dominant_sources = []
    for src, c in source_counts.items():
        pct = (c / total_count) * 100
        if pct > 60.0:
            dominant_sources.append({"source": src, "count": c, "percentage": round(pct, 2)})

    # Build Markdown Content
    lines = [
        "# Vidhya 2.0 SFT Dataset Balance & Distribution Report",
        f"\n**Total Clean Decontaminated Examples Audited**: `{total_count:,}`\n",
        "---",
        "## 1. Subject × Difficulty Distribution Matrix\n",
        "| Subject | " + " | ".join(d.upper() for d in all_difficulties) + " | **Total** | **% of Pool** |",
        "| :--- | " + " | ".join([":---:"] * len(all_difficulties)) + " | :---: | :---: |"
    ]

    for subj in all_subjects:
        row_str = f"| **{subj.capitalize()}** | "
        for diff in all_difficulties:
            cnt = matrix[subj][diff]
            row_str += f"{cnt:,} | "
        total_s = subject_counts[subj]
        pct_s = (total_s / total_count) * 100
        row_str += f"**{total_s:,}** | **{pct_s:.1f}%** |"
        lines.append(row_str)

    # Total Row
    total_row_str = "| **TOTAL** | "
    for diff in all_difficulties:
        total_row_str += f"**{difficulty_counts[diff]:,}** | "
    total_row_str += f"**{total_count:,}** | **100.0%** |"
    lines.append(total_row_str)

    # Table 2: Source Breakdown
    lines.extend([
        "\n---",
        "## 2. Overall Source Dataset Representation\n",
        "| Source Dataset | Clean Rows | % of Pool | Subject Coverage | Primary Reasoning Format |",
        "| :--- | :---: | :---: | :--- | :--- |"
    ])

    for src, cnt in source_counts.most_common():
        pct = (cnt / total_count) * 100
        src_subjs = sorted(list({r.get("subject", "") for r in rows if r.get("source_dataset") == src}))
        subjs_str = ", ".join(s.capitalize() for s in src_subjs if s)
        
        reasoning_fmt = "Full CoT Chain"
        if "medmcqa" in src.lower():
            reasoning_fmt = "MCQ + Concise Explanation"
        elif "medical-o1" in src.lower():
            reasoning_fmt = "Clinical Multi-Turn CoT"
        elif "openmath" in src.lower():
            reasoning_fmt = "Formal Competition Proof CoT"
        elif "eurus" in src.lower():
            reasoning_fmt = "Multi-tag Structured CoT"

        lines.append(f"| `{src}` | {cnt:,} | {pct:.1f}% | {subjs_str} | {reasoning_fmt} |")

    # Table 3: Subject-Level Source Composition
    lines.extend([
        "\n---",
        "## 3. Subject-Level Source Composition\n",
        "| Subject | Source Dataset | Rows | % of Subject | Reasoning Depth / Style |",
        "| :--- | :--- | :---: | :---: | :--- |"
    ])

    subject_source_map: Dict[str, Counter] = defaultdict(Counter)
    for r in rows:
        s = (r.get("subject") or "unspecified").lower()
        src = r.get("source_dataset") or "unknown"
        subject_source_map[s][src] += 1

    for s in sorted(subject_source_map.keys()):
        s_total = subject_counts[s]
        for src, cnt in subject_source_map[s].most_common():
            pct_in_s = (cnt / s_total) * 100
            
            style_desc = "Standard CoT"
            if "medmcqa" in src.lower():
                style_desc = "Concise MCQ Explanations"
            elif "medical-o1" in src.lower():
                style_desc = "Deep Multi-step Medical CoT"
            elif "openmath" in src.lower():
                style_desc = "Rigorous Olympiad/AIME Proofs"
            elif "eurus" in src.lower():
                style_desc = "Multi-step Reasoning Chains"
            elif "jee-chemistry" in src.lower() or "jee-main" in src.lower():
                style_desc = "Curated Indian Exam CoT"

            lines.append(f"| **{s.capitalize()}** | `{src}` | {cnt:,} | {pct_in_s:.1f}% | {style_desc} |")

    # Table 4: Deduplication & Retention Impact per Source
    source_retention = dedup_stage.get("source_retention_summary", {})
    if source_retention:
        lines.extend([
            "\n---",
            "## 4. Source Retention & Deduplication Impact\n",
            "| Source Dataset | Verified In | Exact Dropped | Semantic Dropped | Total Purged | Clean Kept | Retention Rate |",
            "| :--- | :---: | :---: | :---: | :---: | :---: | :---: |"
        ])
        for src, r_data in sorted(source_retention.items(), key=lambda x: x[1].get("verified_in", 0), reverse=True):
            v_in = r_data.get("verified_in", 0)
            ex_d = r_data.get("exact_dropped", 0)
            sem_d = r_data.get("semantic_dropped", 0)
            tot_d = r_data.get("total_dropped", 0)
            k_cnt = r_data.get("final_kept", 0)
            ret_pct = r_data.get("retention_pct", 0.0)
            lines.append(f"| `{src}` | {v_in:,} | {ex_d:,} | {sem_d:,} | {tot_d:,} | **{k_cnt:,}** | **{ret_pct:.1f}%** |")

    # Table 5: Quality Flags & Balance Warnings
    lines.extend([
        "\n---",
        "## 5. Distribution Quality & Representation Warnings\n"
    ])

    if underrepresented_subjects:
        lines.append("### ⚠️ Underrepresented Subjects (<5% of pool):")
        for u in underrepresented_subjects:
            lines.append(f"- **{u['subject'].capitalize()}**: `{u['count']:,}` rows ({u['percentage']}%) — *Recommendation: Subject cap or upweighting required to avoid domain atrophy.*")
    else:
        lines.append("✅ **No underrepresented subjects detected** (all subjects >= 5% representation).")

    lines.append("")

    if dominant_sources:
        lines.append("### ⚠️ Dominant Sources (>60% of pool):")
        for d in dominant_sources:
            lines.append(f"- **`{d['source']}`**: `{d['count']:,}` rows ({d['percentage']}%) — *Risk: High volume of single-source formatting bias.*")
    else:
        lines.append("✅ **No single source dominates > 60% of the dataset**.")

    lines.append("\n---\n*Report generated automatically by Vidhya 2.0 Dataset Pipeline.*")

    output_md.parent.mkdir(parents=True, exist_ok=True)
    with open(output_md, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    stats = {
        "total_clean_rows": total_count,
        "subject_distribution": dict(subject_counts),
        "difficulty_distribution": dict(difficulty_counts),
        "source_distribution": dict(source_counts),
        "underrepresented_subjects": underrepresented_subjects,
        "dominant_sources": dominant_sources
    }

    append_stage_manifest(
        stage_name="balance_analysis",
        stage_data=stats,
        manifest_path=manifest_path
    )

    print(f"\n[SUCCESS] Balance report generated at: {output_md}")
    return stats


def main():
    parser = argparse.ArgumentParser(description="Stage 6: Dataset Balance and Distribution Report.")
    parser.add_argument("--input-file", type=str, default="data_pipeline/decontaminate/sft_pool_clean.jsonl", help="Clean dataset path")
    parser.add_argument("--output-report", type=str, default="data_pipeline/balance/balance_report.md", help="Target markdown report")
    parser.add_argument("--manifest", type=str, default="data_pipeline/run_manifest.json", help="Path to run_manifest.json")

    args = parser.parse_args()
    generate_balance_report(
        input_file=Path(args.input_file).resolve(),
        output_md=Path(args.output_report).resolve(),
        manifest_path=args.manifest
    )


if __name__ == "__main__":
    main()
