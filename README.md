# Pedagogically Aligned Personalized AI Education Tutor

A research and production-grade tutoring system designed for controlled ablation studies of scale, alignment methods, and architectural separation across open-weight LLMs (Qwen3 family).

---

## 1. Research Overview

Standard LLMs behave as **answer engines**—providing solutions directly. In educational pedagogy, effective tutors withhold direct answers, diagnose misconceptions, address prerequisite gaps, and guide students through Socratic scaffolding.

This repository implements and evaluates the **3-Layer Separation of Responsibilities**:
- **WHAT (Domain Knowledge)**: Hybrid RAG (`BM25` + dense embeddings + cross-encoder reranker) grounded in NCERT & Samacheer Kalvi STEM curricula.
- **HOW (Pedagogical Behavior)**: Fine-tuned `Qwen3` (QLoRA SFT + SFT+DPO) trained for Socratic dialogue, hint progression, and restraint from premature answer disclosure.
- **WHEN / WHAT NEXT (Curriculum Progression)**: Deterministic Bayesian Knowledge Tracing (`BKT`), Prerequisite Knowledge DAG, and lightweight intent/error-type classification.

> [!IMPORTANT]
> **Core Invariant**: The language model NEVER writes or modifies student mastery state directly. BKT updates are computed deterministically after interaction.

---

## 2. Experimental Design

| Experiment | Independent Variable | Controlled Conditions | Primary Metrics |
|---|---|---|---|
| **Exp 1: Alignment Method** | `{Prompted Baseline, QLoRA SFT, QLoRA SFT+DPO}` | Identical RAG + BKT scaffold | Pedagogical compliance, direct-answer overuse rate, factual accuracy |
| **Exp 2: Scale Ablation** | `{Qwen3-4B-Instruct, Qwen3.8-27B}` | Same alignment methods & data | Quality vs. training compute per quality point |
| **Exp 3: Architecture Ablation** | `{LLM-only, LLM+RAG, LLM+RAG+BKT}` | Best-performing model | Hallucination rate, prerequisite blindness, difficulty adaptation |
| **Exp 4: Multi-Turn Scaffolding** | 5–10 turn simulated student trajectories | All architecture variants | **Scaffolding-collapse rate** (reversion to answer dumping) |

---

## 3. Repository Structure

```
llm/
├── README.md                          # Project overview & quickstart
├── pyproject.toml                     # Python package metadata
├── requirements.txt                   # Dependency specifications
├── .gitignore                         # Strict exclusion of weights & data
│
├── configs/                           # Experiment & pipeline configurations
│   ├── qwen3_4b_sft.yaml              # Small model SFT configuration
│   ├── qwen3_4b_dpo.yaml              # Small model DPO configuration
│   ├── qwen3_27b_sft.yaml             # Large model (27B) SFT configuration
│   ├── qwen3_27b_dpo.yaml             # Large model (27B) DPO configuration
│   ├── rag_config.yaml                # Hybrid RAG & reranker configuration
│   ├── bkt_config.yaml                # BKT priors & threshold configuration
│   └── eval_config.yaml               # Evaluation benchmarks & metrics
│
├── src/tutor/                         # Core Python package
│   ├── model/                         # Model loading, quantization & inference
│   ├── rag/                           # Indexing, hybrid retrieval & reranking
│   ├── bkt/                           # BKT math, learner state & prerequisite DAG
│   ├── classifier/                    # Lightweight intent & error classifier
│   ├── pedagogy/                      # Pedagogical prompt constructor & templates
│   ├── api/                           # FastAPI endpoints & gateway
│   └── pipeline.py                    # End-to-end runtime orchestrator
│
├── scripts/                           # Runnable CLI scripts
│   ├── data/                          # Data preparation, validation & splitting
│   ├── training/                      # QLoRA SFT and DPO training entrypoints
│   ├── evaluation/                    # Automated evaluation & comparison harnesses
│   ├── inference/                     # Interactive and batch generation CLI
│   └── utils/                         # Environment & hardware audit tools
│
├── docs/                              # Project documentation
│   ├── project_spec.md                # Full spec extracted from Project_Report.pdf
│   ├── architecture.md                # System architecture & component dataflows
│   └── setup.md                       # Local setup & copy-paste server commands
│
└── tests/                             # Comprehensive unit & smoke tests
```

---

## 4. Quickstart

### Local Unit Tests
```bash
pytest tests/ -v
```

### Environment Check
```bash
python scripts/utils/check_env.py
```

### Remote GPU Server Execution (B200 Cluster)
See [docs/setup.md](file:///c:/Users/ANUMITHA/OneDrive/Desktop/LLM-scratch/llm/docs/setup.md) for full commands for data validation, SFT, DPO, evaluation, and vLLM serving.
