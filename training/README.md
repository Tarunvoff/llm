# Training Setup and Infrastructure Blueprint

This directory contains the training architecture and interfaces for future post-training, supervised fine-tuning (SFT), and reinforcement learning (GRPO).

## ⚠️ Important Notice
**Training is disabled for this deployment.**
No training jobs (SFT, DPO, LoRA, QLoRA, pretraining, or fine-tuning) are executed during this stage. The infrastructure exists purely as a structured setup for future adaptation.

## Directory and File Organization
- **`configs/training.yaml`**: Primary configuration containing learning rate, batch size, gradient accumulation, sequence length, LoRA hyperparameters, and training status.
- **`training/dataset.py`**: Dataset loader (`STEMInstructionDataset`) and collator (`DataCollatorForCausalLM`) supporting tokenization, chat formatting, and dynamic sequence padding.
- **`training/trainer.py`**: Trainer orchestration wrapper (`ModelTrainer`) with LoRA adapter configuration.
- **`training/data/`**: Future training and validation datasets (`train.jsonl`, `val.jsonl`).
- **`training/checkpoints/`**: Destination directory for future model checkpoints. Ignored by Git.
- **`scripts/train.py`**: Training CLI entrypoint. Exits with a clear status notice that training is disabled for the current stage.

## How Future Training Would Be Connected
1. Place formatted dataset files in `training/data/train.jsonl`.
2. Configure parameters in `configs/training.yaml`.
3. Set `status.training_enabled: true` in `configs/training.yaml`.
4. Connect the training loop in `training/trainer.py` to the execution pipeline in `scripts/train.py`.
