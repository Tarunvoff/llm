#!/usr/bin/env python3
"""
Vidhya 2.0 Reasoning Fine-Tuning Pipeline (Stage 1 SFT on Aryabhata 2.0 Base).

Loads the pre-tokenized, loss-masked Arrow datasets (11,342 STEM examples)
and trains with LoRA / QLoRA using dynamic batch collation and gradient checkpointing.

Usage:
    python training/train_sft_vidhya.py --config configs/vidhya2_sft.yaml
    python training/train_sft_vidhya.py --config configs/vidhya2_sft.yaml --dry-run
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import torch
import yaml
from datasets import load_from_disk
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)

# Setup root logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("Vidhya2-SFT")


class DynamicLossMaskingCollator:
    """
    Collate variable length sequences in a batch by dynamically padding
    to the maximum sequence length in that specific batch (padded to multiple of 8).
    Pads input_ids with pad_token_id, attention_mask with 0, and labels with -100.
    """

    def __init__(self, pad_token_id: int = 0, pad_to_multiple_of: int = 8):
        self.pad_token_id = pad_token_id
        self.pad_to_multiple_of = pad_to_multiple_of

    def __call__(self, features: List[Dict[str, Any]]) -> Dict[str, torch.Tensor]:
        if not features:
            return {}

        batch_size = len(features)
        max_len = max(len(f["input_ids"]) for f in features)

        if self.pad_to_multiple_of and self.pad_to_multiple_of > 0:
            max_len = ((max_len + self.pad_to_multiple_of - 1) // self.pad_to_multiple_of) * self.pad_to_multiple_of

        batch_input_ids = torch.full((batch_size, max_len), self.pad_token_id, dtype=torch.long)
        batch_attention_mask = torch.zeros((batch_size, max_len), dtype=torch.long)
        batch_labels = torch.full((batch_size, max_len), -100, dtype=torch.long)

        for i, f in enumerate(features):
            seq_len = len(f["input_ids"])
            batch_input_ids[i, :seq_len] = torch.tensor(f["input_ids"], dtype=torch.long)
            batch_attention_mask[i, :seq_len] = torch.tensor(f["attention_mask"], dtype=torch.long)
            batch_labels[i, :seq_len] = torch.tensor(f["labels"], dtype=torch.long)

        return {
            "input_ids": batch_input_ids,
            "attention_mask": batch_attention_mask,
            "labels": batch_labels,
        }


def load_yaml_config(config_path: str) -> Dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def train_sft(config_path: str, dry_run: bool = False):
    cfg = load_yaml_config(config_path)

    logger.info("=" * 70)
    logger.info("VIDHYA 2.0 REASONING FINE-TUNING PIPELINE")
    logger.info("=" * 70)
    logger.info(f"Config: {config_path}")
    logger.info(f"Experiment: {cfg.get('experiment', {}).get('name', 'vidhya2_sft')}")
    logger.info(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        logger.info(f"Device Name: {torch.cuda.get_device_name(0)}")
        logger.info(f"Total VRAM: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB")

    model_cfg = cfg["model"]
    lora_cfg = cfg["lora"]
    data_cfg = cfg["data"]
    train_cfg = cfg["training"]

    output_dir = train_cfg.get("output_dir", "outputs/vidhya2_reasoning_sft")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Load Pre-tokenized Arrow Datasets
    train_tokenized_path = data_cfg["train_tokenized"]
    val_tokenized_path = data_cfg.get("val_tokenized")

    if not Path(train_tokenized_path).exists():
        raise FileNotFoundError(
            f"Pre-tokenized train dataset not found at '{train_tokenized_path}'. "
            "Run 'python data_pipeline/tokenize/tokenize_dataset.py' first."
        )

    logger.info(f"Loading pre-tokenized train dataset from '{train_tokenized_path}'...")
    train_dataset = load_from_disk(train_tokenized_path)
    logger.info(f"Loaded train dataset: {len(train_dataset):,} examples")

    val_dataset = None
    if val_tokenized_path and Path(val_tokenized_path).exists():
        logger.info(f"Loading pre-tokenized validation dataset from '{val_tokenized_path}'...")
        val_dataset = load_from_disk(val_tokenized_path)
        logger.info(f"Loaded validation dataset: {len(val_dataset):,} examples")

    # 2. Tokenizer
    tokenizer_path = model_cfg.get("tokenizer_path", model_cfg["name"])
    logger.info(f"Loading tokenizer from '{tokenizer_path}'...")
    tokenizer = AutoTokenizer.from_pretrained(
        tokenizer_path,
        trust_remote_code=model_cfg.get("trust_remote_code", True),
    )
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token_id = tokenizer.eos_token_id if tokenizer.eos_token_id is not None else 0

    collator = DynamicLossMaskingCollator(
        pad_token_id=tokenizer.pad_token_id,
        pad_to_multiple_of=data_cfg.get("pad_to_multiple_of", 8),
    )

    # 3. Model Loading & Quantization
    torch_dtype = torch.bfloat16 if model_cfg.get("torch_dtype") == "bfloat16" and torch.cuda.is_bf16_supported() else (
        torch.float16 if torch.cuda.is_available() else torch.float32
    )

    use_4bit = model_cfg.get("use_4bit", False) and torch.cuda.is_available()
    bnb_config = None
    if use_4bit:
        try:
            from transformers import BitsAndBytesConfig
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type=model_cfg.get("bnb_4bit_quant_type", "nf4"),
                bnb_4bit_compute_dtype=torch_dtype,
                bnb_4bit_use_double_quant=model_cfg.get("use_nested_quant", True),
            )
        except ImportError:
            logger.warning("BitsAndBytesConfig could not be imported; falling back to non-quantized precision.")
            bnb_config = None

    logger.info(f"Loading base model from '{model_cfg['name']}'...")
    model_kwargs = {
        "trust_remote_code": model_cfg.get("trust_remote_code", True),
    }
    if torch.cuda.is_available():
        device_map_cfg = model_cfg.get("device_map")
        if device_map_cfg is not None:
            model_kwargs["device_map"] = device_map_cfg
        if bnb_config is not None:
            model_kwargs["quantization_config"] = bnb_config
        else:
            model_kwargs["torch_dtype"] = torch_dtype
    else:
        model_kwargs["torch_dtype"] = torch.float32

    model = AutoModelForCausalLM.from_pretrained(
        model_cfg["name"],
        **model_kwargs,
    )

    try:
        from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    except ImportError:
        raise ImportError(
            "The 'peft' package is required for LoRA/QLoRA fine-tuning. "
            "Please install it using 'pip install peft bitsandbytes'."
        )

    if use_4bit:
        model = prepare_model_for_kbit_training(model)

    # 4. LoRA Adapter Configuration
    peft_config = LoraConfig(
        r=lora_cfg.get("r", 64),
        lora_alpha=lora_cfg.get("lora_alpha", 128),
        lora_dropout=lora_cfg.get("lora_dropout", 0.05),
        bias=lora_cfg.get("bias", "none"),
        task_type="CAUSAL_LM",
        target_modules=lora_cfg.get("target_modules", [
            "q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"
        ]),
    )

    model = get_peft_model(model, peft_config)
    trainable_params, all_param = model.get_nb_trainable_parameters()
    logger.info(
        f"Trainable params: {trainable_params:,} || All params: {all_param:,} "
        f"|| Trainable ratio: {100 * trainable_params / all_param:.3f}%"
    )

    if dry_run:
        logger.info("=== DRY RUN MODE: Validating Batch Collation & Model Forward/Backward Pass ===")
        sample_batch = [train_dataset[1]]
        batch_out = collator(sample_batch)
        logger.info(f"Batch shape - input_ids: {batch_out['input_ids'].shape}")
        logger.info(f"Batch shape - labels: {batch_out['labels'].shape}")

        if torch.cuda.is_available():
            device = torch.device(f"cuda:{os.environ.get('LOCAL_RANK', 0)}")
            model = model.to(device)
            batch_gpu = {k: v.to(device) for k, v in batch_out.items()}
            outputs = model(**batch_gpu)
            loss = outputs.loss
            logger.info(f"Initial loss: {loss.item():.4f}")
            loss.backward()
            logger.info(f"Backward pass succeeded. Peak VRAM: {torch.cuda.max_memory_allocated() / (1024**3):.2f} GB")
        else:
            logger.info("CPU environment detected — verified collator & model architecture.")
        logger.info("=== DRY RUN PASSED SUCCESSFULLY ===")
        return

    # 5. Training Arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=train_cfg.get("num_train_epochs", 3),
        per_device_train_batch_size=train_cfg.get("per_device_train_batch_size", 1),
        per_device_eval_batch_size=train_cfg.get("per_device_eval_batch_size", 1),
        gradient_accumulation_steps=train_cfg.get("gradient_accumulation_steps", 16),
        learning_rate=float(train_cfg.get("learning_rate", 1.0e-4)),
        lr_scheduler_type=train_cfg.get("lr_scheduler_type", "cosine"),
        warmup_ratio=train_cfg.get("warmup_ratio", 0.03),
        weight_decay=train_cfg.get("weight_decay", 0.01),
        gradient_checkpointing=train_cfg.get("gradient_checkpointing", True),
        logging_steps=train_cfg.get("logging_steps", 10),
        eval_strategy=train_cfg.get("eval_strategy", "steps") if val_dataset is not None else "no",
        eval_steps=train_cfg.get("eval_steps", 100),
        save_strategy=train_cfg.get("save_strategy", "steps"),
        save_steps=train_cfg.get("save_steps", 250),
        save_total_limit=train_cfg.get("save_total_limit", 3),
        bf16=train_cfg.get("bf16", torch.cuda.is_bf16_supported() if torch.cuda.is_available() else False),
        fp16=train_cfg.get("fp16", False),
        dataloader_num_workers=train_cfg.get("dataloader_num_workers", 2),
        report_to="none",
        seed=cfg.get("experiment", {}).get("seed", 42),
    )

    # 6. Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=collator,
    )

    logger.info("Starting Vidhya 2.0 SFT training loop...")
    trainer.train()

    # 7. Save Final LoRA Weights
    final_adapter_dir = os.path.join(output_dir, "final_adapter")
    trainer.model.save_pretrained(final_adapter_dir)
    tokenizer.save_pretrained(final_adapter_dir)
    logger.info(f"SFT Training finished successfully. Adapter weights saved to: '{final_adapter_dir}'")


def main():
    parser = argparse.ArgumentParser(description="Vidhya 2.0 Reasoning SFT Training.")
    parser.add_argument(
        "--config",
        type=str,
        default="configs/vidhya2_sft.yaml",
        help="Path to YAML training configuration.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Perform configuration, dataset loading, and collator validation without launching training.",
    )
    args = parser.parse_args()
    train_sft(args.config, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
