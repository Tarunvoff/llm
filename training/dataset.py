"""
Dataset Interfaces for Future Training Blueprint
Defines dataset loaders, tokenization pipelines, and collation functions for STEM Q&A datasets.
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import torch
from torch.utils.data import Dataset


class STEMInstructionDataset(Dataset):
    """
    Dataset loader for STEM question answering and reasoning data.
    Expects JSON or JSONL format with 'prompt'/'messages' and 'response'/'solution' fields.
    """

    def __init__(
        self,
        file_path: str,
        tokenizer: Any,
        max_seq_length: int = 4096,
        system_prompt: Optional[str] = None
    ):
        self.file_path = Path(file_path)
        self.tokenizer = tokenizer
        self.max_seq_length = max_seq_length
        self.system_prompt = system_prompt
        self.samples = self._load_data()

    def _load_data(self) -> List[Dict[str, Any]]:
        if not self.file_path.exists():
            return []
        
        samples = []
        with open(self.file_path, "r", encoding="utf-8") as f:
            if self.file_path.suffix == ".jsonl":
                for line in f:
                    if line.strip():
                        samples.append(json.loads(line))
            else:
                samples = json.load(f)
        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        item = self.samples[idx]
        
        # Extract prompt and response
        messages = item.get("messages", [])
        if not messages:
            prompt = item.get("prompt") or item.get("question", "")
            response = item.get("response") or item.get("solution", "")
            messages = []
            if self.system_prompt:
                messages.append({"role": "system", "content": self.system_prompt})
            messages.append({"role": "user", "content": prompt})
            messages.append({"role": "assistant", "content": response})

        # Apply chat template
        if hasattr(self.tokenizer, "apply_chat_template"):
            input_ids = self.tokenizer.apply_chat_template(
                messages,
                tokenize=True,
                truncation=True,
                max_length=self.max_seq_length,
                return_tensors="pt"
            )[0]
        else:
            text = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
            input_ids = self.tokenizer(
                text,
                truncation=True,
                max_length=self.max_seq_length,
                return_tensors="pt"
            )["input_ids"][0]

        labels = input_ids.clone()

        return {
            "input_ids": input_ids,
            "labels": labels,
            "attention_mask": torch.ones_like(input_ids)
        }


class DataCollatorForCausalLM:
    """Collates and pads variable length sequences for Causal LM training."""

    def __init__(self, tokenizer: Any, pad_to_multiple_of: Optional[int] = 8):
        self.tokenizer = tokenizer
        self.pad_to_multiple_of = pad_to_multiple_of
        self.pad_token_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else 0

    def __call__(self, features: List[Dict[str, torch.Tensor]]) -> Dict[str, torch.Tensor]:
        batch_size = len(features)
        if batch_size == 0:
            return {}

        max_len = max(f["input_ids"].shape[0] for f in features)
        if self.pad_to_multiple_of:
            max_len = ((max_len + self.pad_to_multiple_of - 1) // self.pad_to_multiple_of) * self.pad_to_multiple_of

        batch_input_ids = torch.full((batch_size, max_len), self.pad_token_id, dtype=torch.long)
        batch_labels = torch.full((batch_size, max_len), -100, dtype=torch.long)
        batch_attention_mask = torch.zeros((batch_size, max_len), dtype=torch.long)

        for i, f in enumerate(features):
            seq_len = f["input_ids"].shape[0]
            batch_input_ids[i, :seq_len] = f["input_ids"]
            batch_labels[i, :seq_len] = f["labels"]
            batch_attention_mask[i, :seq_len] = f["attention_mask"]

        return {
            "input_ids": batch_input_ids,
            "labels": batch_labels,
            "attention_mask": batch_attention_mask
        }
