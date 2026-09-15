#!/usr/bin/env python3
"""Stage 2: QLoRA Direct Preference Optimization (DPO) Training Script.

Aligns the fine-tuned SFT tutor model with pedagogical preference pairs
(Socratic scaffolding vs. premature direct answer dumping).

Designed to be executed on the Linux GPU server (B200 cluster).

Usage:
    python scripts/training/train_dpo.py --config configs/qwen3_4b_dpo.yaml
    python scripts/training/train_dpo.py --config configs/qwen3_27b_dpo.yaml
"""

import argparse
import json
import logging
import os
import subprocess
import sys
from typing import Any, Dict

import torch
import yaml
from datasets import load_dataset
from peft import PeftModel
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from trl import DPOTrainer

# Ensure src is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src")))

from tutor.model.loader import get_torch_dtype

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def get_git_revision_hash() -> str:
    """Retrieves current git commit hash."""
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"]).decode("ascii").strip()
    except Exception:
        return "unknown"


def train_dpo(config_path: str):
    """Executes QLoRA DPO training based on YAML configuration."""
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    logger.info("=" * 60)
    logger.info("Starting DPO Training: %s", cfg.get("experiment", {}).get("name", "dpo_run"))
    logger.info("Config file: %s", config_path)
    logger.info("=" * 60)

    git_hash = get_git_revision_hash()
    logger.info("Git Commit Hash: %s", git_hash)

    model_cfg = cfg["model"]
    data_cfg = cfg["data"]
    dpo_cfg = cfg.get("dpo", {})
    train_cfg = cfg["training"]

    output_dir = train_cfg["output_dir"]
    os.makedirs(output_dir, exist_ok=True)

    metadata = {
        "git_commit": git_hash,
        "config": cfg,
        "pytorch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
    }
    with open(os.path.join(output_dir, "run_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # 1. Tokenizer Loading
    tokenizer = AutoTokenizer.from_pretrained(
        model_cfg["name"],
        trust_remote_code=True,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 2. Base Model + SFT Adapter Loading
    torch_dtype = get_torch_dtype(model_cfg.get("torch_dtype", "bfloat16"))
    use_4bit = model_cfg.get("use_4bit", True)

    bnb_config = None
    if use_4bit and torch.cuda.is_available():
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type=model_cfg.get("bnb_4bit_quant_type", "nf4"),
            bnb_4bit_compute_dtype=torch_dtype,
        )

    logger.info("Loading base model: %s", model_cfg["name"])
    base_model = AutoModelForCausalLM.from_pretrained(
        model_cfg["name"],
        quantization_config=bnb_config,
        device_map="auto" if torch.cuda.is_available() else None,
        torch_dtype=torch_dtype,
        trust_remote_code=True,
    )

    sft_adapter_path = model_cfg.get("sft_adapter_path")
    if sft_adapter_path and os.path.exists(sft_adapter_path):
        logger.info("Attaching SFT adapter from: %s", sft_adapter_path)
        model = PeftModel.from_pretrained(base_model, sft_adapter_path, is_trainable=True)
    else:
        logger.warning("No SFT adapter found at %s. Initializing from base model.", sft_adapter_path)
        model = base_model

    # 3. Load DPO Preference Dataset
    train_file = data_cfg["train_file"]
    val_file = data_cfg.get("validation_file")

    if not os.path.exists(train_file):
        raise FileNotFoundError(f"DPO dataset not found: {train_file}")

    data_files = {"train": train_file}
    if val_file and os.path.exists(val_file):
        data_files["validation"] = val_file

    dataset = load_dataset("json", data_files=data_files)

    # 4. Training Arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=train_cfg.get("num_train_epochs", 2),
        per_device_train_batch_size=train_cfg.get("per_device_train_batch_size", 1),
        per_device_eval_batch_size=train_cfg.get("per_device_eval_batch_size", 1),
        gradient_accumulation_steps=train_cfg.get("gradient_accumulation_steps", 16),
        learning_rate=float(train_cfg.get("learning_rate", 5e-6)),
        lr_scheduler_type=train_cfg.get("lr_scheduler_type", "cosine"),
        warmup_ratio=train_cfg.get("warmup_ratio", 0.05),
        gradient_checkpointing=train_cfg.get("gradient_checkpointing", True),
        logging_steps=train_cfg.get("logging_steps", 10),
        eval_strategy=train_cfg.get("eval_strategy", "steps") if "validation" in dataset else "no",
        eval_steps=train_cfg.get("eval_steps", 50),
        save_strategy=train_cfg.get("save_strategy", "steps"),
        save_steps=train_cfg.get("save_steps", 50),
        save_total_limit=train_cfg.get("save_total_limit", 2),
        bf16=train_cfg.get("bf16", torch.cuda.is_bf16_supported() if torch.cuda.is_available() else False),
        fp16=train_cfg.get("fp16", False),
        report_to="none",
    )

    # 5. DPO Trainer
    dpo_trainer = DPOTrainer(
        model=model,
        ref_model=None,  # Handled automatically with PEFT adapters
        args=training_args,
        beta=dpo_cfg.get("beta", 0.1),
        train_dataset=dataset["train"],
        eval_dataset=dataset.get("validation"),
        tokenizer=tokenizer,
        max_length=data_cfg.get("max_length", 2048),
        max_prompt_length=data_cfg.get("max_prompt_length", 1024),
    )

    logger.info("Starting DPO training loop...")
    dpo_trainer.train()

    # 6. Save Final DPO Checkpoint
    final_dpo_dir = os.path.join(output_dir, "final_dpo_adapter")
    dpo_trainer.model.save_pretrained(final_dpo_dir)
    tokenizer.save_pretrained(final_dpo_dir)
    logger.info("DPO Training complete. Final adapter saved to: %s", final_dpo_dir)


def main():
    parser = argparse.ArgumentParser(description="Train DPO pedagogical preference alignment.")
    parser.add_argument("--config", type=str, required=True, help="Path to YAML configuration file")
    args = parser.parse_args()

    train_dpo(args.config)


if __name__ == "__main__":
    main()
