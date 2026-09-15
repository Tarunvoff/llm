"""Model and Tokenizer Loading Infrastructure.

Provides configurable, robust loading for Qwen-family models,
supporting 4-bit QLoRA quantization, PEFT LoRA adapters,
automatic device mapping, and dtype configurations.
"""

import logging
import os
from typing import Any, Dict, Optional, Tuple

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, PreTrainedModel, PreTrainedTokenizer

logger = logging.getLogger(__name__)


def get_optimal_device() -> str:
    """Detects available acceleration hardware safely respecting environment variables."""
    if torch.cuda.is_available():
        return "cuda"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def get_torch_dtype(dtype_str: str) -> torch.dtype:
    """Maps string representation to PyTorch dtype."""
    dtype_map = {
        "bfloat16": torch.bfloat16,
        "float16": torch.float16,
        "float32": torch.float32,
        "bf16": torch.bfloat16,
        "fp16": torch.float16,
        "fp32": torch.float32,
    }
    return dtype_map.get(dtype_str.lower(), torch.float32)


def get_quantization_config(use_4bit: bool = True, compute_dtype: str = "bfloat16") -> Optional[Any]:
    """Builds BitsAndBytesConfig for 4-bit QLoRA if supported and requested."""
    if not use_4bit or not torch.cuda.is_available():
        return None

    try:
        from transformers import BitsAndBytesConfig

        bnb_dtype = get_torch_dtype(compute_dtype)
        return BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=bnb_dtype,
            bnb_4bit_use_double_quant=True,
        )
    except ImportError:
        logger.warning("bitsandbytes not installed or not available on this platform. Quantization disabled.")
        return None


def load_tokenizer(
    model_name_or_path: str,
    padding_side: str = "right",
    trust_remote_code: bool = True,
) -> PreTrainedTokenizer:
    """Loads tokenizer with appropriate pad token configuration."""
    logger.info("Loading tokenizer from: %s", model_name_or_path)
    tokenizer = AutoTokenizer.from_pretrained(
        model_name_or_path,
        padding_side=padding_side,
        trust_remote_code=trust_remote_code,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    return tokenizer


def load_model(
    model_name_or_path: str,
    torch_dtype: str = "bfloat16",
    use_4bit: bool = False,
    device_map: Optional[str] = "auto",
    adapter_path: Optional[str] = None,
    trust_remote_code: bool = True,
) -> PreTrainedModel:
    """Loads base model with optional 4-bit quantization and optional LoRA adapter.

    Args:
        model_name_or_path: Hugging Face hub ID or local directory path.
        torch_dtype: Desired tensor precision ('bfloat16', 'float16', 'float32').
        use_4bit: Whether to load with 4-bit BitsAndBytes QLoRA quantization.
        device_map: Accelerate device mapping ('auto', None, or explicit dict).
        adapter_path: Optional path to a fine-tuned LoRA adapter checkpoint.
        trust_remote_code: Whether to allow remote code execution.

    Returns:
        Loaded PyTorch PreTrainedModel.
    """
    dtype = get_torch_dtype(torch_dtype)
    quant_config = get_quantization_config(use_4bit=use_4bit, compute_dtype=torch_dtype)

    model_kwargs: Dict[str, Any] = {
        "torch_dtype": dtype,
        "trust_remote_code": trust_remote_code,
    }

    if quant_config is not None:
        model_kwargs["quantization_config"] = quant_config
        model_kwargs["device_map"] = device_map
    elif torch.cuda.is_available() and device_map is not None:
        model_kwargs["device_map"] = device_map

    logger.info("Loading model '%s' with kwargs: %s", model_name_or_path, model_kwargs)
    model = AutoModelForCausalLM.from_pretrained(model_name_or_path, **model_kwargs)

    if adapter_path is not None and os.path.exists(adapter_path):
        logger.info("Attaching LoRA adapter from: %s", adapter_path)
        try:
            from peft import PeftModel

            model = PeftModel.from_pretrained(model, adapter_path)
            logger.info("LoRA adapter successfully attached.")
        except ImportError:
            logger.error("peft package is required to load adapters but not installed.")
            raise

    return model


def load_model_and_tokenizer(
    model_name_or_path: str,
    torch_dtype: str = "bfloat16",
    use_4bit: bool = False,
    adapter_path: Optional[str] = None,
    device_map: Optional[str] = "auto",
) -> Tuple[PreTrainedModel, PreTrainedTokenizer]:
    """Convenience helper to load both tokenizer and model together."""
    tokenizer = load_tokenizer(model_name_or_path)
    model = load_model(
        model_name_or_path=model_name_or_path,
        torch_dtype=torch_dtype,
        use_4bit=use_4bit,
        device_map=device_map,
        adapter_path=adapter_path,
    )
    return model, tokenizer
