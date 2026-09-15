#!/usr/bin/env python3
"""Stage 1: QLoRA Supervised Fine-Tuning (SFT) Script.

Performs parameter-efficient instruction fine-tuning on Qwen models (4B / 27B)
using Hugging Face Transformers, PEFT, and TRL.

Designed to be executed on the Linux GPU server (B200 cluster).

Usage:
    python scripts/training/train_sft.py --config configs/qwen3_4b_sft.yaml
    python scripts/training/train_sft.py --config configs/qwen3_27b_sft.yaml
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
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from trl import SFTTrainer

# Ensure src is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src")))

from tutor.model.loader import get_torch_dtype

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def get_git_revision_hash() -> str:
    """Retrieves current git commit hash for reproducibility tracking."""
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"]).decode("ascii").strip()
    except Exception:
        return "unknown"


def format_chat_template(example: Dict[str, Any], tokenizer: AutoTokenizer) -> Dict[str, str]:
    """Formats conversation turns into a training text string."""
    messages = example.get("messages", [])
    if hasattr(tokenizer, "apply_chat_template"):
        text = tokenizer.apply_chat_template(messages, tokenize=False)
    else:
        text = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            text += f"<|im_start|>{role}\n{content}<|im_end|>\n"
    return {"text": text}


def train_sft(config_path: str):
    """Executes QLoRA SFT training based on YAML configuration."""
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    logger.info("=" * 60)
    logger.info("Starting SFT Training: %s", cfg.get("experiment", {}).get("name", "sft_run"))
    logger.info("Config file: %s", config_path)
    logger.info("=" * 60)

    # 1. Environment & Reproducibility Setup
    git_hash = get_git_revision_hash()
    logger.info("Git Commit Hash: %s", git_hash)
    logger.info("CUDA Devices Available: %d", torch.cuda.device_count())

    model_cfg = cfg["model"]
    lora_cfg = cfg["lora"]
    data_cfg = cfg["data"]
    train_cfg = cfg["training"]

    output_dir = train_cfg["output_dir"]
    os.makedirs(output_dir, exist_ok=True)

    # Save exact run config and metadata
    metadata = {
        "git_commit": git_hash,
        "config": cfg,
        "pytorch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
    }
    with open(os.path.join(output_dir, "run_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # 2. Tokenizer Loading
    tokenizer = AutoTokenizer.from_pretrained(
        model_cfg["name"],
        revision=model_cfg.get("revision", "main"),
        trust_remote_code=True,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 3. Model Loading with 4-bit Quantization (QLoRA)
    torch_dtype = get_torch_dtype(model_cfg.get("torch_dtype", "bfloat16"))
    use_4bit = model_cfg.get("use_4bit", True)

    bnb_config = None
    if use_4bit and torch.cuda.is_available():
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type=model_cfg.get("bnb_4bit_quant_type", "nf4"),
            bnb_4bit_compute_dtype=torch_dtype,
            bnb_4bit_use_double_quant=model_cfg.get("use_nested_quant", True),
        )

    logger.info("Loading base model: %s", model_cfg["name"])
    model = AutoModelForCausalLM.from_pretrained(
        model_cfg["name"],
        quantization_config=bnb_config,
        device_map=model_cfg.get("device_map", "auto"),
        torch_dtype=torch_dtype,
        trust_remote_code=True,
    )

    if use_4bit and torch.cuda.is_available():
        model = prepare_model_for_kbit_training(model)

    # 4. LoRA Adapter Configuration
    peft_config = LoraConfig(
        r=lora_cfg.get("r", 16),
        lora_alpha=lora_cfg.get("lora_alpha", 32),
        lora_dropout=lora_cfg.get("lora_dropout", 0.05),
        bias=lora_cfg.get("bias", "none"),
        task_type="CAUSAL_LM",
        target_modules=lora_cfg.get(
            "target_modules",
            ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        ),
    )

    # 5. Dataset Loading & Preprocessing
    train_file = data_cfg["train_file"]
    val_file = data_cfg.get("validation_file")

    if not os.path.exists(train_file):
        raise FileNotFoundError(f"Training dataset not found: {train_file}")

    data_files = {"train": train_file}
    if val_file and os.path.exists(val_file):
        data_files["validation"] = val_file

    raw_dataset = load_dataset("json", data_files=data_files)
    formatted_dataset = raw_dataset.map(lambda ex: format_chat_template(ex, tokenizer))

    # 6. Training Arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=train_cfg.get("num_train_epochs", 3),
        per_device_train_batch_size=train_cfg.get("per_device_train_batch_size", 2),
        per_device_eval_batch_size=train_cfg.get("per_device_eval_batch_size", 2),
        gradient_accumulation_steps=train_cfg.get("gradient_accumulation_steps", 8),
        learning_rate=float(train_cfg.get("learning_rate", 2e-4)),
        lr_scheduler_type=train_cfg.get("lr_scheduler_type", "cosine"),
        warmup_ratio=train_cfg.get("warmup_ratio", 0.03),
        weight_decay=train_cfg.get("weight_decay", 0.01),
        gradient_checkpointing=train_cfg.get("gradient_checkpointing", True),
        logging_steps=train_cfg.get("logging_steps", 10),
        eval_strategy=train_cfg.get("eval_strategy", "steps") if "validation" in formatted_dataset else "no",
        eval_steps=train_cfg.get("eval_steps", 50),
        save_strategy=train_cfg.get("save_strategy", "steps"),
        save_steps=train_cfg.get("save_steps", 100),
        save_total_limit=train_cfg.get("save_total_limit", 3),
        bf16=train_cfg.get("bf16", torch.cuda.is_bf16_supported() if torch.cuda.is_available() else False),
        fp16=train_cfg.get("fp16", False),
        report_to="none",
    )

    # 7. SFT Trainer Initialization & Execution
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=formatted_dataset["train"],
        eval_dataset=formatted_dataset.get("validation"),
        peft_config=peft_config,
        dataset_text_field="text",
        max_seq_length=data_cfg.get("max_seq_length", 2048),
        tokenizer=tokenizer,
    )

    logger.info("Starting model training loop...")
    trainer.train()

    # 8. Save Final Model Adapter & Tokenizer
    final_adapter_dir = os.path.join(output_dir, "final_adapter")
    trainer.model.save_pretrained(final_adapter_dir)
    tokenizer.save_pretrained(final_adapter_dir)
    logger.info("Training complete. Adapter saved to: %s", final_adapter_dir)


def main():
    parser = argparse.ArgumentParser(description="Train SFT model with QLoRA.")
    parser.add_argument("--config", type=str, required=True, help="Path to YAML configuration file")
    args = parser.parse_args()

    train_sft(args.config)


if __name__ == "__main__":
    main()
