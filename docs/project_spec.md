# Project Specification: Pedagogically Aligned Personalized AI Education Tutor

**Date**: September 2026  
**Source of Truth**: `Project_Report.pdf` (Technical Report: Problem Statement, Architecture, and Implementation Roadmap)  
**Category**: Group Academic / Research Project — Applied NLP, Educational AI, MLOps  
**Target Repository**: `https://github.com/Tarunvoff/llm`

---

## 1. Problem Statement & Research Motivation

General-purpose large language models are optimized for helpfulness and direct answer generation. When asked a question, their default behavior is to provide the answer directly. In contrast, effective human pedagogy requires:
1. Withholding the final answer.
2. Diagnosing underlying student misconceptions.
3. Reviewing missing prerequisite concepts.
4. Guiding the student toward the answer through Socratic questioning and structured scaffolding.

Existing tutoring LLM systems suffer from two primary flaws:
- **Prompt-only brittleness**: Relying purely on system prompts is fragile and prone to "scaffolding collapse" over multi-turn dialogues (reverting to answer dumping).
- **Lack of persistent learner modeling**: Systems lack an inspectable, stateful representation of student mastery, preventing principled decisions about curriculum pacing, review, or difficulty.

### Research Question
> *"For open-weight instruction-tuned language models used as personalized tutors, does separating retrieval (curriculum knowledge), behavioral alignment (SFT / SFT+DPO for Socratic scaffolding), and learner modeling (BKT-driven curriculum progression) into distinct components improve pedagogical quality and reduce scaffolding collapse over multi-turn interactions, compared to an end-to-end prompted baseline — and does this benefit hold consistently across a small and a larger model from the same model family?"*

### Hypotheses
- **H1**: SFT and SFT+DPO tutoring models grounded in RAG+BKT will show higher pedagogical compliance and lower direct-answer-overuse scores than a prompted baseline of the same base model, at both scales tested.
- **H2**: The relative gain from SFT+DPO over SFT-alone will be larger when RAG+BKT grounding is present, because grounding reduces the model's need to fabricate curriculum content, letting alignment training act more purely on pedagogical behavior.
- **H3 (Exploratory)**: Scaffolding-collapse rate over multi-turn dialogues will be lower for the RAG+BKT-grounded system than for prompting-only or ungrounded-SFT baselines.

---

## 2. Core Architectural Separation of Responsibilities

The system strictly divides tutoring responsibilities across three decoupled layers:

| Layer | Responsibility | Implementation Mechanism | Invariant |
|---|---|---|---|
| **WHAT** | Curriculum & textbook domain knowledge | Hybrid RAG (BM25 + dense embeddings + cross-encoder reranker) | Retrieved context provides authoritative facts; model weights are not relied upon for static facts. |
| **HOW** | Pedagogical behavior: Socratic scaffolding, misconception handling, hint-giving, tone, answer restraint | Fine-tuned Qwen3-series (QLoRA SFT & SFT+DPO) | Fine-tuning instills pedagogical restraint and scaffolding disposition. |
| **WHEN / WHAT NEXT** | Mastery tracking, prerequisite remediation, curriculum progression | Deterministic Bayesian Knowledge Tracing (BKT) + Prerequisite DAG + Lightweight Intent Classifier | **CRITICAL**: The LLM must NEVER directly mutate or write learner mastery state. |

---

## 3. Positioning & Research Contribution

- **Already Established (Not the contribution)**:
  - Institutional Indian-curriculum RAG + fine-tuning (e.g., Bodhan AI / AI4Bharat, GurukulAI).
  - SFT improving Socratic behavior over pure prompting (SocraticLM, MathDial).
  - DPO improving pedagogical preference alignment over SFT alone (Sonkar et al., 2024).
- **Actual Distinctive Contribution**:
  - **Scale-Controlled Alignment Transfer**: Same-family, two-scale (small dense vs. 27B dense Qwen3 lineage) comparison of SFT / SFT+DPO effects.
  - **Architecture Ablation**: Controlled evaluation of isolating RAG vs. BKT vs. Fine-tuned LLM on hallucination, premature answering, and prerequisite blindness.
  - **Scaffolding Collapse under Full Grounding**: First systematic measurement of multi-turn degradation within a fully grounded RAG+BKT pipeline.

---

## 4. Model Strategy

To prevent cross-vendor confounds (different tokenizers, architectures, pretraining corpora):
- **Small-scale arm**: Current small Qwen3-family dense instruct model (e.g., `Qwen/Qwen3-4B-Instruct-2507` or closest available dense instruct checkpoint).
- **Large-scale arm**: `Qwen/Qwen3.8-27B` (dense Apache-2.0 model, 262K context, natively vision-language capable, ~17GB at Q4 quantization).
- **Control condition**: Corresponding base instruct checkpoints for each scale, unmodified and prompted with full pedagogical instructions.
- **Excluded**: SmolLM2-1.7B (cross-vendor confound) and Qwen2.5-3B (two generations outdated).

---

## 5. Dataset Strategy

### 5.1 Curriculum Corpus (RAG - "WHAT")
- **Sources**: NCERT, Tamil Nadu State Board (Samacheer Kalvi) STEM textbooks (Grades 6–12 Mathematics, Physics, Chemistry, Biology).
- **Volume**: 50–60 GB raw sourced text filtered down to 5–15 GB clean text after license audit, deduplication, and boilerplate removal.
- **Metadata**: Every chunk must carry `source`, `subject`, `grade`, `chapter`, `topic`, `license`, and `chunk_id`.

### 5.2 SFT Dataset ("HOW")
- **Seed**: Hand-authored 100 gold pedagogical multi-turn examples adhering to strict Socratic scaffolding rubrics.
- **Synthetic Expansion & Filtering**: Frontier LLM expansion filtered against the 100 gold calibration set, followed by human verification.
- **Target Size**: 3,000–8,000 verified examples in JSONL schema (`messages` + `metadata`).

### 5.3 DPO Preference Dataset
- **Volume**: 500–1,500 validated chosen/rejected pairs.
- **Chosen**: Pedagogically sound scaffolding, hint progression, misconception diagnostic questions.
- **Rejected**: Premature direct answers, answer dumping, ignoring prerequisite gaps, hallucinated curriculum facts.

### 5.4 Data Splits & Leakage Controls
- Conversation-level splitting (never split turns of the same conversation).
- Stratified balance across subjects, grades, and misconception types.
- At least one full STEM subject held out entirely for out-of-domain generalization testing.

---

## 6. Experimental Design & Ablations

### Experiment 1 — Alignment Method Ablation (Per Scale)
- **Independent Variable**: `{Prompted Baseline, QLoRA SFT, QLoRA SFT+DPO}`
- **Constant**: Identical RAG + BKT scaffold.
- **Dependent Variables**: Pedagogical compliance, direct-answer overuse rate, factual/RAG faithfulness.

### Experiment 2 — Scale Ablation
- **Independent Variable**: `{Small (4B), Large (27B)}` crossed with Experiment 1 alignment conditions.
- **Dependent Variables**: Quality metrics + training-compute-per-quality-point.

### Experiment 3 — Architecture Ablation (Distinctive Core Contribution)
- Applied to the best-performing alignment checkpoint:
  1. `No RAG + No BKT` (LLM alone)
  2. `RAG only` (Retrieval grounded, no learner state)
  3. `RAG + BKT` (Fully grounded and stateful)
- **Dependent Variables**: Factual correctness, prerequisite awareness, difficulty adaptation.

### Experiment 4 — Multi-Turn Scaffolding Stability
- 5–10 turn simulated student conversations designed with escalating difficulty, persistent misconceptions, and student begging for direct answers.
- **Metric**: Scaffolding-collapse rate (frequency of tutor giving in and providing full solution).

---

## 7. Evaluation Metrics & Judge Framework

| Metric | Evaluation Method | Target / Criterion |
|---|---|---|
| **Factual / Math Correctness** | Automated check against reference answer keys | Minimize factual errors |
| **RAG Faithfulness / Grounding** | Automated retrieval-trace citation matching | Zero unsupported claims |
| **Direct-Answer Overuse Rate** | Automated rule-based regex and structural inspection | Minimize premature reveals |
| **Scaffolding-Collapse Rate** | Hybrid rule + LLM-judge across 5–10 turn transcripts | Measure multi-turn degradation |
| **Pedagogical Compliance** | LLM-judge (different family, e.g. Llama-3.3 / Claude / GPT) with 10–15% human validation sample | Rubric score 1–5 on Socratic guidance |
| **Prerequisite Awareness** | Automated BKT state review alignment | Timely diagnostic intervention |

---

## 8. MLOps, Compute & Infrastructure Constraints

- **Hardware**: Single 90–96GB GPU partition on shared DGX B200 (183GB VRAM physical).
- **Environment**: Shared Linux environment (`/opt/llm-training`, PyTorch 2.11+, Transformers 5.16+, PEFT 0.20+, vLLM).
- **Serving**: vLLM backend behind FastAPI service (`GET /health`, `POST /chat`, `POST /evaluate`).
- **Tracking**: MLflow experiment tracking (parameters, losses, evaluation metrics, git commit SHA, checkpoint paths).
