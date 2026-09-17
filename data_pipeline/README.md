# Vidhya 2.0 Reasoning Fine-Tune Data Pipeline

This directory contains the end-to-end dataset preparation and curation pipeline for the **Vidhya 2.0 Reasoning-Boost Fine-Tuning** (Round 2 on Aryabhata 2.0).

The pipeline enforces strict pedagogical quality bars, ground-truth answer verification, deduplication, decontamination against held-out benchmarks, and stratified problem-level splitting.

---

## Pipeline Architecture & Stages

```
data_pipeline/
├── configs/
│   └── sources.yaml          # Registry of candidate datasets and roles (TRAIN, TRAIN_WITH_CARE, EVAL_ONLY)
├── download/
│   └── fetch_sources.py      # Downloads datasets with strict physical train/eval separation
├── normalize/
│   └── to_common_schema.py   # Normalizes all sources to unified Vidhya JSONL schema
├── verify/
│   └── answer_verification.py# Gold filter: exact MCQ match & math-verify symbolic validation
├── dedup/
│   └── deduplicate.py        # Semantic question deduplication (MiniLM embeddings, cosine >= 0.92)
├── decontaminate/
│   └── decontaminate_against_eval.py # Purges overlaps against Reja1/jee-neet-benchmark & ScienceOlympiad
├── balance/
│   └── balance_report.py     # Audits subject & difficulty balance; generates markdown summary
├── split/
│   └── make_splits.py        # Stratified 90/5/5 train/val/test problem-level partition
├── manifest/
│   └── manifest_utils.py     # Shared logging helpers for atomic run_manifest.json updates
├── run_manifest.json         # Full verifiable audit trail across all stages
└── README.md                 # Pipeline documentation
```

---

## Standard Common Schema

Every normalized row across all sources follows this schema:

```json
{
  "example_id": "src_<source_name>_<row_index>",
  "subject": "math|physics|chemistry|biology",
  "source_dataset": "<hf_id>",
  "question": "<string>",
  "reasoning_trace": "<string, empty string if source has none>",
  "final_answer": "<string>",
  "answer_key": "<string, ground-truth if provided, else null>",
  "verified_correct": null,
  "difficulty": "jee_main|jee_advanced|neet|olympiad|unspecified",
  "license": "<string>"
}
```

---

## Dataset Quality Rules

All pipeline code adheres to `.agents/rules/dataset-quality-bar.md`:
1. **Explicit Answer Verification**: No `verified_correct=true` without deterministic ground-truth matching.
2. **Zero Silent Drops**: Every dropped row is logged with its rationale and counted in `run_manifest.json`.
3. **Idempotency & CLI Paths**: All scripts take configurable CLI arguments.
4. **Immutability**: Stages write versioned files without in-place overwrites.
5. **No Synthetic Fabrication**: Missing data is reported, never hallucinated.

---

## Reproduction & Execution Commands

To reproduce the full pipeline end-to-end:

```bash
# 1. Download candidate & evaluation datasets
python data_pipeline/download/fetch_sources.py --config data_pipeline/configs/sources.yaml

# 2. Normalize to common schema
python data_pipeline/normalize/to_common_schema.py

# 3. Answer verification (The Gold Filter)
python data_pipeline/verify/answer_verification.py

# 4. Deduplication (Exact + Semantic cosine >= 0.92)
python data_pipeline/dedup/deduplicate.py

# 5. Decontamination Shield against eval holdouts
python data_pipeline/decontaminate/decontaminate_against_eval.py

# 6. Balance & Downsampling (Option A: Biology capped at 3,000)
python data_pipeline/balance/balance_pool.py --cap-source "FreedomIntelligence/medical-o1-reasoning-SFT=3000"

# 7. Problem-Level Stratified Splits (90 / 5 / 5)
python data_pipeline/split/make_splits.py --input-file data_pipeline/balance/sft_pool_balanced.jsonl
```

---

## Final Artifacts

Packaged for downstream QLoRA training in `data/sft/v2_reasoning_boost/`:
- `train.jsonl` (6,079 examples, 90.0%)
- `val.jsonl` (338 examples, 5.0%)
- `test.jsonl` (338 examples, 5.0%)
- `run_manifest.json` (Full cryptographic & stage audit trail)

