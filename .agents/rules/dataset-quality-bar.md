# Rule: dataset-quality-bar

All dataset-preparation code you write for this project must follow these
non-negotiable constraints:

1. Every training example must carry a `verified_correct` boolean field.
   Never mark an example verified_correct=true without an explicit
   answer-matching check against a ground-truth key (exact match for MCQ,
   tolerance/symbolic match for numeric). Never infer correctness from
   the presence of a plausible-looking reasoning trace alone.

2. Never write a script that silently drops rows without logging WHY
   (dedup, decontamination, verification-failure, malformed schema) and
   WITHOUT incrementing a counter in a run manifest.

3. Every script must be idempotent and take its input/output paths as
   CLI arguments — no hardcoded paths.

4. Every processing stage writes its output as a versioned file
   (e.g. `sft_pool_v1.jsonl`, `sft_pool_v2.jsonl`), never overwrites
   the previous stage's output in place.

5. Never fabricate or synthesize example data yourself to "fill in" a
   dataset gap — if a source dataset is missing, ambiguous, or
   inaccessible, stop and report it instead of inventing rows.

6. All code goes under `data_pipeline/` in this repo, with one script
   per pipeline stage, plus a `run_manifest.json` updated by every
   stage.

7. Before finishing any task, run the script on a small sample
   (first 50-100 rows) and show me real output, not just "it should work."
