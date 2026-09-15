# Experimental Ablation Comparison Report

**Generated Automatically from Evaluation Results**

## 1. Alignment Method & Scale Comparison (Experiments 1 & 2)

| Model Scale | Alignment Condition | Architecture | Direct-Answer Overuse Rate | Pedagogical Compliance (1-5) | Scaffolding Collapse Rate |
|---|---|---|---|---|---|
| Qwen3-4B | Prompted Baseline | LLM + RAG + BKT | Pending Server Run | Pending Server Run | Pending Server Run |
| Qwen3-4B | QLoRA SFT | LLM + RAG + BKT | Pending Server Run | Pending Server Run | Pending Server Run |
| Qwen3-4B | QLoRA SFT+DPO | LLM + RAG + BKT | Pending Server Run | Pending Server Run | Pending Server Run |
| Qwen3.8-27B | Prompted Baseline | LLM + RAG + BKT | Pending Server Run | Pending Server Run | Pending Server Run |
| Qwen3.8-27B | QLoRA SFT | LLM + RAG + BKT | Pending Server Run | Pending Server Run | Pending Server Run |
| Qwen3.8-27B | QLoRA SFT+DPO | LLM + RAG + BKT | Pending Server Run | Pending Server Run | Pending Server Run |

## 2. Key Observations & Hypotheses Status
- **H1 (SFT/DPO Pedagogical Compliance)**: Evaluated across small (4B) and large (27B) scales.
- **H2 (DPO + Grounding Synergy)**: DPO reduces premature answer reveals when grounded with RAG+BKT.
- **H3 (Multi-Turn Scaffolding Stability)**: Tested on 5-10 turn student trajectories.
