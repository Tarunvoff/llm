# STEM LLM Framework

A production-grade machine learning project structure for STEM reasoning, model download, verification, local inference, benchmarking, and interactive chat serving with future training infrastructure setup.

---

## 📋 Architecture & Features

- **Target Model**: `PhysicsWallahAI/Aryabhata-2.0` (20B MoE, 3.6B active parameters)
- **Model Downloader**: Non-GGUF full Hugging Face snapshot downloader (`scripts/download_model.py`)
- **Model Verifier**: Integrity checker verifying config, tokenizers, and checkpoint shards (`scripts/verify_model.py`)
- **Inference CLI**: Transformers-based inference respecting `CUDA_VISIBLE_DEVICES` with token metrics (`scripts/run_model.py`)
- **Benchmarking**:
  - Official model card results integrated across In-Distribution (JEE/NEET) and Out-of-Distribution (AIME/HMMT/GPQA/MMLU) benchmarks.
  - Local benchmark evaluation runner (`scripts/run_benchmark.py`).
- **FastAPI Serving & UI**: Single-load backend with `/health`, `/chat`, and `/benchmarks` endpoints, serving a modern STEM chat frontend with LaTeX rendering and benchmarking tabs.
- **Training Setup**: Training configurations, dataset loaders, and trainer interfaces configured as a blueprint (**training execution disabled**).

---

## 📁 Project Directory Layout

```
llm/
├── README.md                  # Main repository documentation
├── requirements.txt           # Python dependency specifications
├── .gitignore                 # Exclusion rules for weights, checkpoints, and caches
│
├── configs/
│   ├── model.yaml             # Model download, loading, and inference settings
│   └── training.yaml          # Blueprint training hyperparameters (disabled)
│
├── scripts/
│   ├── download_model.py      # Hugging Face snapshot downloader
│   ├── verify_model.py        # Checkpoint and tokenizer integrity verifier
│   ├── run_model.py           # Local inference CLI with token rate metrics
│   ├── run_benchmark.py       # Local benchmark suite runner
│   └── train.py               # Training entrypoint blueprint (execution disabled)
│
├── model/
│   └── README.md              # Weight storage and verification documentation
│
├── training/
│   ├── README.md              # Training setup specifications
│   ├── dataset.py             # PyTorch dataset & collator interfaces
│   ├── trainer.py             # Model trainer blueprint class
│   └── checkpoints/           # Checkpoints directory (gitignored)
│
├── benchmarks/
│   └── results/               # Local evaluation output storage (gitignored)
│
├── backend/
│   ├── __init__.py            # Backend package init
│   ├── main.py                # FastAPI server and static route mounting
│   ├── model.py               # Singleton model engine & inference manager
│   └── benchmark.py           # Official & local benchmark data provider
│
├── frontend/
│   ├── index.html             # Modern STEM chat & benchmark interface
│   ├── style.css              # Dark STEM theme & responsive styles
│   └── app.js                 # Chat interactions & LaTeX rendering logic
│
└── docs/
    ├── setup.md               # Complete server deployment instructions
    └── training.md            # Training architecture documentation
```

---

## 🚀 Server Execution Workflow

All development occurs in Antigravity. The remote server acts solely as the execution environment.

```bash
# 1. Navigate to project root
cd ~/llm

# 2. Pull latest code from GitHub
git pull

# 3. Activate Python environment
source /opt/llm-training/bin/activate

# 4. Ensure standard device allocation
unset CUDA_VISIBLE_DEVICES

# 5. Download model weights from Hugging Face
python scripts/download_model.py

# 6. Verify model integrity and checkpoints
python scripts/verify_model.py

# 7. Execute sample inference
python scripts/run_model.py \
    --prompt "Solve the quadratic equation x^2 - 5x + 6 = 0"

# 8. Run local benchmark check
python scripts/run_benchmark.py

# 9. Launch FastAPI Backend & Chat Frontend
uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port 8000
```

---

## 📊 Official Model Card Benchmark Results

Official results reported on the Hugging Face model card (Pass@1, 4-sample mean %):

### In-Distribution (Competitive Exams)
| Benchmark | Score |
|---|---|
| **JEE Advanced 2025** | 86.51% |
| **NEET 2025** | 84.66% |
| **JEE Main 2025** | 87.80% |
| **JEE Main 2026** | 92.99% |
| **Average** | **88.95%** |

### Out-of-Distribution (General Reasoning)
| Benchmark | Score |
|---|---|
| **AIME** | 86.67% |
| **HMMT** | 78.96% |
| **GPQA** | 74.86% |
| **MMLU-Pro** | 88.49% |
| **MMLU-Redux 2.0** | 92.92% |
| **Average** | **87.64%** |

### Token Efficiency
- Achieves highest accuracy-per-token ratio among evaluated models.
- Uses up to **64% fewer output tokens** compared to GPT-OSS-20B.
- **In-Distribution Acc./1K Tokens**: 42.31
- **Out-of-Distribution Acc./1K Tokens**: 39.58

---

## ⚙️ Training Infrastructure Notice

Training modules (`configs/training.yaml`, `training/dataset.py`, `training/trainer.py`, `scripts/train.py`) are set up for architectural completeness. **No training is executed during this stage.**

---

## 🛡️ Shared GPU Server Safety Guidelines

- **Respect CUDA_VISIBLE_DEVICES**: Never hard-code GPU indices.
- **Resource Discipline**: Never terminate processes belonging to other users.
- **System Integrity**: Do not alter MIG configurations or root CUDA settings.
