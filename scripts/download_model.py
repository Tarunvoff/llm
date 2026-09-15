#!/usr/bin/env python3
"""
Model Downloader Script
Downloads the complete original Hugging Face model repository without GGUF quantization.
"""

import argparse
import os
import sys
from pathlib import Path
import yaml
from huggingface_hub import snapshot_download


def load_config(config_path: str = "configs/model.yaml") -> dict:
    path = Path(config_path)
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def download_model(
    model_id: str,
    local_dir: str,
    hf_token: str = None,
    ignore_patterns: list = None
):
    print("=" * 70)
    print(f"Initiating Model Download from Hugging Face Hub")
    print(f"Repository ID : {model_id}")
    print(f"Destination   : {os.path.abspath(local_dir)}")
    print("=" * 70)

    if ignore_patterns is None:
        ignore_patterns = ["*.gguf"]

    local_path = Path(local_dir)
    local_path.mkdir(parents=True, exist_ok=True)

    try:
        downloaded_path = snapshot_download(
            repo_id=model_id,
            local_dir=str(local_path),
            token=hf_token or os.environ.get("HF_TOKEN"),
            ignore_patterns=ignore_patterns,
            local_dir_use_symlinks=False,
            resume_download=True
        )
        print("\n" + "=" * 70)
        print("Model download completed successfully!")
        print(f"Files stored at: {downloaded_path}")
        print("=" * 70)
        return downloaded_path
    except Exception as e:
        print(f"\n[ERROR] Failed to download model: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Download model weights from Hugging Face Hub.")
    parser.add_argument(
        "--config",
        type=str,
        default="configs/model.yaml",
        help="Path to model configuration YAML file."
    )
    parser.add_argument(
        "--model-id",
        type=str,
        default=None,
        help="Hugging Face model repository ID."
    )
    parser.add_argument(
        "--local-dir",
        type=str,
        default=None,
        help="Local directory path to store model files."
    )
    parser.add_argument(
        "--token",
        type=str,
        default=None,
        help="Hugging Face authentication token (optional)."
    )
    args = parser.parse_args()

    config = load_config(args.config)
    model_cfg = config.get("model", {})
    download_cfg = config.get("download", {})

    model_id = args.model_id or download_cfg.get("repo_id") or model_cfg.get("model_id", "PhysicsWallahAI/Aryabhata-2.0")
    local_dir = args.local_dir or download_cfg.get("local_dir") or model_cfg.get("local_dir", "model/aryabhata-2.0")
    ignore_patterns = download_cfg.get("ignore_patterns", ["*.gguf"])

    download_model(
        model_id=model_id,
        local_dir=local_dir,
        hf_token=args.token,
        ignore_patterns=ignore_patterns
    )


if __name__ == "__main__":
    main()
