# Model Storage Directory

This directory houses locally downloaded model weights and configurations.

## Target Model
- **Model ID**: `PhysicsWallahAI/Aryabhata-2.0`
- **Hugging Face**: https://huggingface.co/PhysicsWallahAI/Aryabhata-2.0
- **Local Destination**: `model/aryabhata-2.0/`

## Git Policy
Model weights (`*.safetensors`, `*.bin`, `*.pt`, `*.ckpt`) are ignored by `.gitignore` and **must never be committed to Git**.

## Downloading Weights
On the target server or local environment:
```bash
python scripts/download_model.py
```

## Verifying Weights
To ensure all configuration files, tokenizers, and checkpoint shards are intact:
```bash
python scripts/verify_model.py
```
