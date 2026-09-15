# Training Infrastructure & Architecture Blueprint

This document specifies the training architecture, configuration schema, and future extension points.

---

## ⚠️ Important Deployment Notice

> **Training is intentionally disabled for this deployment.**
> No fine-tuning, SFT, DPO, LoRA, or pretraining steps are initiated during this stage. The training modules are configured purely as an architectural blueprint.

---

## Architecture Components

### 1. Configuration (`configs/training.yaml`)
Contains full hyperparameters structured for future supervised fine-tuning and reinforcement learning:
- **Base Model Path**: `model/aryabhata-2.0`
- **Sequence Length**: 4096 tokens
- **Batch Size & Accumulation**: Batch size 2 with 8 gradient accumulation steps (effective batch size 16 per device)
- **Precision**: BF16 (where supported)
- **LoRA Hyperparameters**:
  - Rank ($r$): 64
  - Alpha ($\alpha$): 128
  - Target Modules: `q_proj`, `k_proj`, `v_proj`, `o_proj`, `embed_tokens`
  - Trainable parameters fraction: ~0.15%

### 2. Dataset Pipeline (`training/dataset.py`)
- **`STEMInstructionDataset`**: PyTorch `Dataset` parsing JSON/JSONL problem-solution pairs, applying chat templates and masking prompt tokens from loss computation.
- **`DataCollatorForCausalLM`**: Dynamic padding collator aligning batches to multiples of 8 for Tensor Core efficiency.

### 3. Trainer Module (`training/trainer.py`)
- **`ModelTrainer`**: Modular interface containing LoRA configuration generator and training lifecycle hooks.

### 4. Checkpoint Management (`training/checkpoints/`)
- Checkpoints are saved locally under `training/checkpoints/` and excluded from Git via `.gitignore`.

### 5. CLI Entrypoint (`scripts/train.py`)
- Executing `python scripts/train.py` prints the architectural blueprint summary and safely exits with the notice that training execution is disabled.

---

## Future Training Activation Checklist

When future training is authorized:
1. Populate `training/data/train.jsonl` with verified problem-solution pairs.
2. In `configs/training.yaml`, set `status.training_enabled: true`.
3. Connect `training/trainer.py` to target training backend (HuggingFace Trainer, TRL, or custom GRPO loop).
4. Run `python scripts/train.py --config configs/training.yaml`.
