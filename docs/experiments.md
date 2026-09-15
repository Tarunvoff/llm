# Experiments Matrix: Mapping to Project Report Hypotheses

This document maps all executed experiments to the core research hypotheses defined in `Project_Report.pdf`.

---

## 1. Summary of Experiments

### Experiment 1 — Alignment Method Ablation (Per Scale)
- **Hypothesis H1**: SFT and SFT+DPO tutoring models grounded in RAG+BKT will show higher pedagogical compliance and lower direct-answer overuse than the prompted baseline.
- **Cells**:
  - Cell 1A: Qwen3-4B Prompted Baseline (RAG + BKT)
  - Cell 1B: Qwen3-4B QLoRA SFT (RAG + BKT)
  - Cell 1C: Qwen3-4B QLoRA SFT+DPO (RAG + BKT)

### Experiment 2 — Scale Ablation
- **Hypothesis H2**: The relative gain from SFT+DPO over SFT-alone interacts with model capacity and curriculum grounding.
- **Cells**:
  - Cell 2A: Qwen3.8-27B Prompted Baseline (RAG + BKT)
  - Cell 2B: Qwen3.8-27B QLoRA SFT (RAG + BKT)
  - Cell 2C: Qwen3.8-27B QLoRA SFT+DPO (RAG + BKT)

### Experiment 3 — Architecture Separation Ablation
- **Distinctive Research Contribution**: Isolating the contribution of each layer on the best model checkpoint.
  - Cell 3A: LLM Only (No RAG, No BKT)
  - Cell 3B: LLM + RAG (Curriculum Grounded, No Learner State)
  - Cell 3C: LLM + RAG + BKT (Full Pedagogical System)

### Experiment 4 — Multi-Turn Scaffolding Stability
- **Hypothesis H3**: Scaffolding collapse rate over 5–10 turn simulated dialogues will be lowest for the RAG+BKT-grounded system.

---

## 2. Tracking & Reproducibility
Every experiment run stores:
1. Git Commit SHA (`git rev-parse HEAD`)
2. Training loss curve and evaluation metrics in `outputs/<experiment_name>/`
3. Exact YAML configuration in `configs/`
4. Machine-readable metrics in `evaluation/results/<experiment_name>/metrics_summary.json`
