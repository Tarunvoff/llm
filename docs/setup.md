# Environment Setup and Server Execution Guide

This guide outlines the local development setup and the copy-pasteable execution procedures on the shared Linux GPU server (equipped with NVIDIA B200 GPUs).

---

## 1. Local Development Setup (Windows / Workstation)

Local development focuses on code authoring, unit testing, schema validation, and pipeline mocking without requiring multi-gigabyte GPU models.

### 1.1 Prerequisites
- Python 3.10+ (Python 3.12/3.14 verified)
- Git

### 1.2 Installation
```bash
# Clone the repository
git clone https://github.com/Tarunvoff/llm.git
cd llm

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -e .
```

### 1.3 Running Local Unit Tests
All unit tests are designed to execute locally in < 30 seconds without accessing large GPU checkpoints:
```bash
pytest tests/ -v
```

---

## 2. Remote GPU Server Workflow (NVIDIA B200 Cluster)

### 2.1 Server Environment Context
- **GPUs**: 8x NVIDIA B200 (183 GB physical VRAM per GPU).
- **Environment**: Shared virtualenv at `/opt/llm-training`.
- **Target Working Directory**: `~/llm`

### 2.2 Safety & Multi-Tenant Rules
1. **Never modify system configuration**: Do not edit `/opt/llm-training`, driver settings, MIG configs, or files belonging to other users.
2. **Never kill other users' processes**: Verify GPU status before launching.
3. **Respect GPU Allocation**: Always use `CUDA_VISIBLE_DEVICES` to bind to assigned GPU partitions (e.g. 90GB partition for Qwen3-4B and Qwen3.8-27B).

---

## 3. Step-by-Step Server Execution Commands

### Step 1: Clone or Pull Repository
```bash
cd ~
if [ -d "llm" ]; then
    cd llm
    git pull origin main
else
    git clone https://github.com/Tarunvoff/llm.git
    cd llm
fi
```

### Step 2: Activate Shared Environment & Verify Hardware
```bash
source /opt/llm-training/bin/activate

# Check Python and PyTorch CUDA linkage
python -c "import torch; print(f'PyTorch: {torch.__version__}, CUDA available: {torch.cuda.is_available()}, Devices: {torch.cuda.device_count()}')"

# Inspect GPU status
nvidia-smi
```

### Step 3: Run Environment Verification & Model Smoke Test
Run the non-destructive smoke test to verify tokenizer, model loading, and basic generation:
```bash
# Set specific visible GPU (e.g., GPU 0)
export CUDA_VISIBLE_DEVICES=0

# Run lightweight model smoke test
python scripts/inference/generate.py --smoke-test
```

### Step 4: Dataset Preparation & Validation
```bash
# Validate SFT and DPO dataset schemas and check for train/test leakage
python scripts/data/validate_dataset.py \
    --train-file data/sft/train.jsonl \
    --val-file data/sft/validation.jsonl \
    --test-file data/sft/test.jsonl

# Validate DPO preference pairs
python scripts/data/validate_dataset.py \
    --dpo-file data/dpo/train_dpo.jsonl
```

### Step 5: Build RAG Vector Index
```bash
# Ingest and index curriculum documents
python -m tutor.rag.pipeline \
    --raw-dir data/raw/curriculum \
    --index-dir data/processed/rag_index \
    --chunk-size 512 \
    --chunk-overlap 64
```

### Step 6: Train Stage 1 — QLoRA SFT
```bash
# Train Small Model (Qwen3-4B)
CUDA_VISIBLE_DEVICES=0 python scripts/training/train_sft.py \
    --config configs/qwen3_4b_sft.yaml

# Train Large Model (Qwen3.8-27B)
CUDA_VISIBLE_DEVICES=0 python scripts/training/train_sft.py \
    --config configs/qwen3_27b_sft.yaml
```

### Step 7: Train Stage 2 — QLoRA DPO
```bash
# Train DPO on top of SFT adapter
CUDA_VISIBLE_DEVICES=0 python scripts/training/train_dpo.py \
    --config configs/qwen3_4b_dpo.yaml

# Train DPO for 27B model
CUDA_VISIBLE_DEVICES=0 python scripts/training/train_dpo.py \
    --config configs/qwen3_27b_dpo.yaml
```

### Step 8: Run Full Evaluation Harness
```bash
# Single-turn pedagogical compliance evaluation
CUDA_VISIBLE_DEVICES=0 python scripts/evaluation/evaluate_model.py \
    --model-path outputs/qwen3-4b-dpo \
    --eval-dataset evaluation/benchmarks/stem_eval_500.jsonl \
    --output-dir evaluation/results/qwen3_4b_dpo

# Multi-turn scaffolding collapse evaluation
CUDA_VISIBLE_DEVICES=0 python scripts/evaluation/evaluate_conversations.py \
    --model-path outputs/qwen3-4b-dpo \
    --scenarios evaluation/benchmarks/scaffolding_scenarios.jsonl \
    --output-dir evaluation/results/scaffolding_stability
```

### Step 9: Launch vLLM Serving & FastAPI Gateway
```bash
# Start FastAPI server (which invokes the fine-tuned model via vLLM or HuggingFace pipeline)
CUDA_VISIBLE_DEVICES=0 python -m uvicorn src.tutor.api.app:app --host 0.0.0.0 --port 8000
```
