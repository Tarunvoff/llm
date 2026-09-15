"""Unit tests for configuration loading and validation."""

import os
import pytest
import yaml

CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "configs")


def test_configs_exist():
    expected_configs = [
        "qwen3_4b_sft.yaml",
        "qwen3_4b_dpo.yaml",
        "qwen3_27b_sft.yaml",
        "qwen3_27b_dpo.yaml",
        "rag_config.yaml",
        "bkt_config.yaml",
        "eval_config.yaml",
    ]
    for cfg in expected_configs:
        cfg_path = os.path.join(CONFIG_DIR, cfg)
        assert os.path.exists(cfg_path), f"Missing config file: {cfg_path}"


def test_sft_configs_valid():
    for name in ["qwen3_4b_sft.yaml", "qwen3_27b_sft.yaml"]:
        path = os.path.join(CONFIG_DIR, name)
        with open(path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        assert "model" in cfg
        assert "name" in cfg["model"]
        assert "lora" in cfg
        assert "r" in cfg["lora"]
        assert "training" in cfg
        assert cfg["training"]["gradient_checkpointing"] is True


def test_dpo_configs_valid():
    for name in ["qwen3_4b_dpo.yaml", "qwen3_27b_dpo.yaml"]:
        path = os.path.join(CONFIG_DIR, name)
        with open(path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        assert "model" in cfg
        assert "dpo" in cfg
        assert "beta" in cfg["dpo"]
        assert "training" in cfg


def test_rag_and_bkt_configs():
    with open(os.path.join(CONFIG_DIR, "rag_config.yaml"), "r", encoding="utf-8") as f:
        rag_cfg = yaml.safe_load(f)
    assert "rag" in rag_cfg
    assert "top_k_final" in rag_cfg["rag"]

    with open(os.path.join(CONFIG_DIR, "bkt_config.yaml"), "r", encoding="utf-8") as f:
        bkt_cfg = yaml.safe_load(f)
    assert "bkt" in bkt_cfg
    assert "default_p_init" in bkt_cfg["bkt"]
    assert "mastery_threshold" in bkt_cfg["bkt"]
