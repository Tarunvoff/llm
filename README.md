# Pedagogically Aligned Personalized AI Education & STEM Tutor

A research and production-grade tutoring system designed for pedagogical alignment, multi-modal PDF retrieval, Socratic dialogue, and controlled ablation studies across open-weight LLMs.

---

## 1. Research Overview

Standard LLMs behave as **answer engines**—providing solutions directly. In educational pedagogy, effective tutors withhold direct answers, diagnose misconceptions, address prerequisite gaps, and guide students through Socratic scaffolding.

This repository implements and evaluates the **3-Layer Separation of Responsibilities**:
- **WHAT (Domain Knowledge)**: Hybrid RAG (`BM25` + dense embeddings + visual PixelRAG + cross-encoder reranker) grounded in STEM educational PDFs.
- **HOW (Pedagogical Behavior)**: Fine-tuned `Qwen3` (QLoRA SFT + SFT+DPO) trained for Socratic dialogue, hint progression, and restraint from premature answer disclosure.
- **WHEN / WHAT NEXT (Curriculum Progression)**: Deterministic Bayesian Knowledge Tracing (`BKT`), Prerequisite Knowledge DAG, and lightweight intent/error-type classification.

> [!IMPORTANT]
> **Core Invariant**: The language model NEVER writes or modifies student mastery state directly. BKT updates are computed deterministically after interaction.

---

## 2. Repository Structure

```
llm/
├── README.md                          # Project overview & quickstart
├── pyproject.toml                     # Python package metadata
├── requirements.txt                   # Dependency specifications
├── .gitignore                         # Exclusion rules for weights, checkpoints, data
│
├── configs/                           # Experiment & pipeline configurations
│   ├── rag.yaml                       # Production PDF RAG pipeline configuration
│   ├── qwen3_4b_sft.yaml              # Small model SFT configuration
│   ├── qwen3_4b_dpo.yaml              # Small model DPO configuration
│   ├── qwen3_27b_sft.yaml             # Large model (27B) SFT configuration
│   ├── qwen3_27b_dpo.yaml             # Large model (27B) DPO configuration
│   ├── bkt_config.yaml                # BKT priors & threshold configuration
│   └── eval_config.yaml               # Evaluation benchmarks & metrics
│
├── src/tutor/                         # Core Python package
│   ├── model/                         # Model loading, quantization & inference
│   ├── rag/                           # PDF extractor, cleaner, chunker, BM25, FAISS, PixelRAG, RRF & Reranker
│   ├── bkt/                           # BKT math, learner state & prerequisite DAG
│   ├── classifier/                    # Lightweight intent & error classifier
│   ├── pedagogy/                      # Pedagogical prompt constructor & templates
│   ├── api/                           # FastAPI endpoints & gateway
│   └── pipeline.py                    # End-to-end runtime orchestrator
│
├── backend/                           # Fast API serving endpoints
├── frontend/                          # Interactive web application interface
│
├── scripts/                           # Runnable CLI scripts
│   ├── data/                          # Data preparation, validation & splitting
│   ├── training/                      # QLoRA SFT and DPO training entrypoints
│   ├── evaluation/                    # Automated evaluation & comparison harnesses
│   └── utils/                         # Environment & hardware audit tools
│
├── docs/                              # Project documentation
│   ├── project_spec.md                # Full system specification
│   ├── architecture.md                # System architecture & component dataflows
│   ├── setup.md                       # Setup and deployment guide
│   └── training.md                    # Training specifications
│
└── tests/                             # Comprehensive unit & pipeline tests
```

---

## 3. Quickstart & Testing

### Local Unit Tests
```bash
pytest tests/ -v
```

### Environment Check
```bash
python scripts/utils/check_env.py
```
