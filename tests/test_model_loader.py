"""Unit tests for model loading and inference configuration."""

import sys
import os
import torch
import pytest

# Ensure src is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from tutor.model.loader import get_optimal_device, get_torch_dtype, get_quantization_config
from tutor.model.inference import TutorGenerationConfig


def test_device_detection():
    device = get_optimal_device()
    assert device in ["cuda", "mps", "cpu"]


def test_dtype_mapping():
    assert get_torch_dtype("bfloat16") == torch.bfloat16
    assert get_torch_dtype("float16") == torch.float16
    assert get_torch_dtype("float32") == torch.float32
    assert get_torch_dtype("bf16") == torch.bfloat16
    assert get_torch_dtype("fp16") == torch.float16
    assert get_torch_dtype("unknown") == torch.float32


def test_generation_config_defaults():
    cfg = TutorGenerationConfig()
    assert cfg.max_new_tokens == 512
    assert cfg.temperature == 0.7
    assert cfg.do_sample is True
    assert "<|im_end|>" in cfg.stop_strings


def test_quantization_fallback_on_cpu():
    # If on CPU, quantization config should return None safely
    if not torch.cuda.is_available():
        quant_cfg = get_quantization_config(use_4bit=True)
        assert quant_cfg is None
