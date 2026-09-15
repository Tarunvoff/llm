# Training Guide: QLoRA SFT and DPO Pipelines

This document provides exact, reproducible instructions for running Parameter-Efficient Fine-Tuning (QLoRA) for both SFT and DPO stages on the GPU server.

---

## 1. Hardware & Environment Requirements
- **Server**: Linux GPU server with NVIDIA B200 GPUs (183 GB physical VRAM per GPU).
- **Environment**: Shared virtualenv at `/opt/llm-training` (`source /opt/llm-training/bin/activate`).
- **GPU Partition**: Single 90–96GB partition per training run.
- **Configurable Device Selection**: `export CUDA_VISIBLE_DEVICES=<GPU_ID>`.

---

## 2. Stage 1: Supervised Fine-Tuning (QLoRA SFT)

### Objective
Aligns base instruct models (`Qwen3-4B-Instruct-2507` and `Qwen3.8-27B`) to follow Socratic tutoring dialogues, misconception diagnosis, and scaffolding progressions.

### Small Model (Qwen3-4B) SFT
```bash
export CUDA_VISIBLE_DEVICES=0

python scripts/training/train_sft.py \
    --config configs/qwen3_4b_sft.yaml
```
- **Output Artifacts**: `outputs/qwen3_4b_sft/final_adapter/`
- **Expected Duration**: ~2–3 hours on 90GB partition.

### Large Model (Qwen3.8-27B) SFT
```bash
export CUDA_VISIBLE_DEVICES=0

python scripts/training/train_sft.py \
    --config configs/qwen3_27b_sft.yaml
```
- **Output Artifacts**: `outputs/qwen3_27b_sft/final_adapter/`
- **Expected Duration**: ~18–24 hours on 90GB partition with gradient checkpointing.

---

## 3. Stage 2: Direct Preference Optimization (QLoRA DPO)

### Objective
Aligns the SFT adapter against pedagogical preference pairs to suppress premature solution disclosure, direct-answer dumping, and syllabus hallucinations.

### Small Model (Qwen3-4B) DPO
```bash
export CUDA_VISIBLE_DEVICES=0

python scripts/training/train_dpo.py \
    --config configs/qwen3_4b_dpo.yaml
```
- **Input Adapter**: `outputs/qwen3_4b_sft/final_adapter`
- **Output Artifacts**: `outputs/qwen3_4b_dpo/final_dpo_adapter/`

### Large Model (Qwen3.8-27B) DPO
```bash
export CUDA_VISIBLE_DEVICES=0

python scripts/training/train_dpo.py \
    --config configs/qwen3_27b_dpo.yaml
```
- **Input Adapter**: `outputs/qwen3_27b_sft/final_adapter`
- **Output Artifacts**: `outputs/qwen3_27b_dpo/final_dpo_adapter/`
