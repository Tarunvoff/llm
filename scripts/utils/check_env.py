"""Environment and GPU capability verification script.

Non-destructively audits Python runtime, PyTorch CUDA readiness,
available GPU memory, disk space, and installed ML packages.
"""

import importlib
import os
import shutil
import sys


def log(msg: str):
    print(msg, flush=True)


def check_python():
    log(f"[1/5] Python Version: {sys.version.split()[0]}")
    if sys.version_info < (3, 10):
        log("  WARNING: Python 3.10+ is recommended.")
    else:
        log("  OK: Python version is supported.")


def check_pytorch():
    log("\n[2/5] PyTorch & Accelerator Readiness:")
    try:
        import torch

        log(f"  PyTorch Version: {torch.__version__}")
        cuda_avail = torch.cuda.is_available()
        log(f"  CUDA Available: {cuda_avail}")
        if cuda_avail:
            device_count = torch.cuda.device_count()
            log(f"  Detected GPU Count: {device_count}")
            for i in range(device_count):
                device_name = torch.cuda.get_device_name(i)
                total_mem_gb = (
                    torch.cuda.get_device_properties(i).total_memory
                    / (1024**3)
                )
                log(f"    GPU {i}: {device_name} ({total_mem_gb:.2f} GB VRAM)")
        else:
            log("  NOTE: No CUDA GPU detected locally. Local CPU mode active.")
    except Exception as e:
        log(f"  ERROR checking PyTorch: {e}")


def check_packages():
    log("\n[3/5] Key ML Package Availability:")
    packages = [
        "transformers",
        "peft",
        "datasets",
        "accelerate",
        "rank_bm25",
        "sentence_transformers",
        "pydantic",
        "fastapi",
        "uvicorn",
        "networkx",
        "yaml",
        "pytest",
    ]
    for pkg in packages:
        try:
            mod = importlib.import_module(pkg)
            version = getattr(mod, "__version__", "installed")
            log(f"  [PASS] {pkg:<22} : {version}")
        except Exception as e:
            log(f"  [MISS] {pkg:<22} : {e}")


def check_disk():
    log("\n[4/5] Available Storage Check:")
    usage = shutil.disk_usage(os.getcwd())
    total_gb = usage.total / (1024**3)
    used_gb = usage.used / (1024**3)
    free_gb = usage.free / (1024**3)
    log(f"  Current Drive Total: {total_gb:.2f} GB")
    log(f"  Used Space:         {used_gb:.2f} GB")
    log(f"  Free Space:         {free_gb:.2f} GB")
    if free_gb < 20:
        log("  WARNING: <20 GB free space. Large model checkpoints may need additional storage.")
    else:
        log("  OK: Sufficient disk space for local development.")


def check_cuda_env():
    log("\n[5/5] Environment Variables:")
    cuda_vis = os.environ.get("CUDA_VISIBLE_DEVICES", "Not set (all devices visible)")
    log(f"  CUDA_VISIBLE_DEVICES: {cuda_vis}")
    hf_home = os.environ.get("HF_HOME", "Default (~/.cache/huggingface)")
    log(f"  HF_HOME: {hf_home}")


if __name__ == "__main__":
    log("=" * 60)
    log("   Pedagogical AI Tutor - Environment Audit")
    log("=" * 60)
    check_python()
    check_pytorch()
    check_packages()
    check_disk()
    check_cuda_env()
    log("=" * 60)
