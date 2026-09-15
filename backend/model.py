"""
Model Manager Singleton
Loads the model once at startup, handles GPU/CPU devices, applies chat templates,
and provides multi-turn inference with precise token metrics.
"""

import os
import sys
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import yaml
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM


class ModelEngine:
    _instance: Optional["ModelEngine"] = None

    def __init__(self, config_path: str = "configs/model.yaml"):
        self.config_path = config_path
        self.config = self._load_config()
        self.model = None
        self.tokenizer = None
        self.is_loaded = False
        self.device = "cpu"
        self.model_path = ""
        self.system_prompt = self.config.get("system_prompt", "")

    @classmethod
    def get_instance(cls, config_path: str = "configs/model.yaml") -> "ModelEngine":
        if cls._instance is None:
            cls._instance = cls(config_path)
        return cls._instance

    def _load_config(self) -> Dict[str, Any]:
        path = Path(self.config_path)
        if not path.exists():
            return {}
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def _get_torch_dtype(self, dtype_str: str) -> torch.dtype:
        dtype_str = (dtype_str or "").lower()
        if dtype_str in ["bfloat16", "bf16"] and torch.cuda.is_bf16_supported():
            return torch.bfloat16
        elif dtype_str in ["float16", "fp16"] and torch.cuda.is_available():
            return torch.float16
        elif dtype_str in ["bfloat16", "bf16"]:
            return torch.bfloat16
        return torch.float32

    def load_model(self):
        if self.is_loaded:
            return

        model_cfg = self.config.get("model", {})
        self.model_path = model_cfg.get("local_dir", "model/aryabhata-2.0")
        target_path = Path(self.model_path)

        if not target_path.exists():
            print(f"[WARNING] Model directory '{self.model_path}' does not exist locally.")
            print("Server running in pending-download state. Run 'python scripts/download_model.py' to download weights.")
            return

        dtype_str = model_cfg.get("torch_dtype", "bfloat16")
        device_map = model_cfg.get("device_map", "auto")
        trust_remote_code = model_cfg.get("trust_remote_code", True)
        torch_dtype = self._get_torch_dtype(dtype_str)

        print(f"[INFO] Initializing tokenizer from: {self.model_path}")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_path,
                trust_remote_code=trust_remote_code
            )

            print(f"[INFO] Initializing model from: {self.model_path} (dtype: {torch_dtype})")
            if not torch.cuda.is_available():
                device_map = None
                torch_dtype = torch.float32

            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_path,
                torch_dtype=torch_dtype,
                device_map=device_map,
                trust_remote_code=trust_remote_code
            )

            if not torch.cuda.is_available():
                self.model = self.model.to("cpu")
                self.device = "cpu"
            else:
                self.device = str(self.model.device) if hasattr(self.model, "device") else "cuda"

            self.is_loaded = True
            print(f"[INFO] Model successfully loaded on device: {self.device}")
        except Exception as e:
            print(f"[ERROR] Failed to load model weights: {e}", file=sys.stderr)
            self.is_loaded = False

    def generate(
        self,
        messages: List[Dict[str, str]],
        max_new_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        if not self.is_loaded or self.model is None or self.tokenizer is None:
            # Check if model directory is ready to load
            if Path(self.model_path or "model/aryabhata-2.0").exists():
                self.load_model()

        if not self.is_loaded or self.model is None or self.tokenizer is None:
            return {
                "response": "Model weights are not currently loaded on this server. Please download the weights with 'python scripts/download_model.py'.",
                "input_tokens": 0,
                "output_tokens": 0,
                "generation_time": 0.0,
                "tokens_per_sec": 0.0,
                "error": "Model not loaded"
            }

        gen_cfg = self.config.get("generation", {})
        max_tokens = max_new_tokens or gen_cfg.get("max_new_tokens", 4096)
        temp = temperature if temperature is not None else gen_cfg.get("temperature", 1.0)
        do_sample = gen_cfg.get("do_sample", False)

        # Prepend system prompt if not explicitly present
        formatted_messages = []
        has_system = any(m.get("role") == "system" for m in messages)
        if not has_system and self.system_prompt:
            formatted_messages.append({"role": "system", "content": self.system_prompt})
        formatted_messages.extend(messages)

        # Apply chat template
        if hasattr(self.tokenizer, "apply_chat_template"):
            input_ids = self.tokenizer.apply_chat_template(
                formatted_messages,
                add_generation_prompt=True,
                return_tensors="pt"
            )
        else:
            text = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in formatted_messages]) + "\nAssistant:"
            input_ids = self.tokenizer(text, return_tensors="pt")["input_ids"]

        device = self.model.device if hasattr(self.model, "device") else ("cuda" if torch.cuda.is_available() else "cpu")
        input_ids = input_ids.to(device)
        input_token_count = input_ids.shape[-1]

        start_time = time.perf_counter()
        with torch.no_grad():
            gen_kwargs = {
                "max_new_tokens": max_tokens,
                "pad_token_id": self.tokenizer.eos_token_id if self.tokenizer.eos_token_id is not None else 0
            }
            if do_sample and temp > 0:
                gen_kwargs["do_sample"] = True
                gen_kwargs["temperature"] = temp
            else:
                gen_kwargs["do_sample"] = False

            outputs = self.model.generate(input_ids, **gen_kwargs)
        end_time = time.perf_counter()

        generation_time = max(end_time - start_time, 1e-6)
        generated_tokens = outputs[0][input_token_count:]
        output_token_count = len(generated_tokens)
        tokens_per_sec = output_token_count / generation_time

        response_text = self.tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

        return {
            "response": response_text,
            "input_tokens": input_token_count,
            "output_tokens": output_token_count,
            "generation_time": generation_time,
            "tokens_per_sec": tokens_per_sec
        }
