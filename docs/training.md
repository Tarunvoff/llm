# Training Guide: Architecture Blueprint & QLoRA Pipelines

This document provides specifications and guidelines for model fine-tuning (SFT & DPO) and architectural extensions.

---

## 1. Architecture Components

### Configuration (`configs/qwen3_4b_sft.yaml`, `configs/qwen3_27b_sft.yaml`, `configs/qwen3_4b_dpo.yaml`)
Contains hyperparameters structured for supervised fine-tuning and direct preference optimization:
- **Sequence Length**: 4096 tokens
- **Precision**: BF16 / FP16 QLoRA
- **Target Modules**: `q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`

---

## 2. Stage 1: Supervised Fine-Tuning (QLoRA SFT)

### Objective
Aligns base models to follow Socratic tutoring dialogues, misconception diagnosis, and scaffolding progressions.

```bash
export CUDA_VISIBLE_DEVICES=0

python scripts/training/train_sft.py \
    --config configs/qwen3_4b_sft.yaml
```

---

## 3. Stage 2: Direct Preference Optimization (QLoRA DPO)

### Objective
Aligns the SFT adapter against pedagogical preference pairs to suppress premature solution disclosure.

```bash
export CUDA_VISIBLE_DEVICES=0

python scripts/training/train_dpo.py \
    --config configs/qwen3_4b_dpo.yaml
```
