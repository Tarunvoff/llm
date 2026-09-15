# Evaluation Guide: Single-Turn Benchmark & Multi-Turn Scaffolding Collapse

This document specifies the evaluation methodology, metric definitions, and execution commands.

---

## 1. Metric Definitions

| Metric | Formal Definition | Target Direction |
|---|---|---|
| **Direct-Answer Overuse Rate** | Fraction of student turns where the tutor reveals the numerical/algebraic solution prematurely in early/mid dialogue turns. | **Minimize (-> 0.0)** |
| **Pedagogical Compliance Score** | Rubric score (1.0 to 5.0) measuring adherence to Socratic questioning, hint gradation, and empathy. | **Maximize (-> 5.0)** |
| **Scaffolding Collapse Rate** | Percentage of extended (5–10 turn) simulated student conversations where the tutor succumbs to repeated student answer requests and abandons scaffolding. | **Minimize (-> 0.0)** |
| **RAG Faithfulness** | Proportion of factual claims that have verifiable retrieval grounding from NCERT / State Board curriculum texts. | **Maximize (-> 1.0)** |
| **Prerequisite Awareness** | Rate at which diagnosed prerequisite gaps trigger immediate review rather than skipping ahead. | **Maximize (-> 1.0)** |

---

## 2. Evaluation Commands

### Single-Turn Benchmark Evaluation (500 Scenarios)
```bash
python scripts/evaluation/evaluate_model.py \
    --eval-dataset evaluation/benchmarks/stem_eval_500.jsonl \
    --output-dir evaluation/results/qwen3_4b_dpo
```

### Multi-Turn Scaffolding Collapse Evaluation
```bash
python scripts/evaluation/evaluate_conversations.py \
    --scenarios evaluation/benchmarks/scaffolding_scenarios.jsonl \
    --output-dir evaluation/results/qwen3_4b_dpo
```

### Automated Ablation Comparison Generator
```bash
python scripts/evaluation/compare_models.py \
    --results-dir evaluation/results \
    --report-file evaluation/reports/experiment_comparison.md
```
