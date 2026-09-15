# Environment Setup and Deployment Guide

This guide details the complete server deployment workflow for downloading, verifying, benchmarking, and serving the model.

---

## 1. Remote Server Workflow

All code development occurs in Antigravity, pushed to GitHub, and pulled on the target execution server.

```bash
# Navigate to repository directory
cd ~/llm

# Pull latest source code from GitHub
git pull

# Activate target server Python virtual environment
source /opt/llm-training/bin/activate

# Ensure default visibility without overriding system allocations
unset CUDA_VISIBLE_DEVICES
```

---

## 2. Model Download

Download the original unquantized Hugging Face weights directly into `model/aryabhata-2.0/`:

```bash
python scripts/download_model.py
```

*Note: Model weights are configured via `configs/model.yaml` and are never committed to Git.*

---

## 3. Model Verification

Validate the presence and integrity of all checkpoint shards, configuration files, and tokenizers:

```bash
python scripts/verify_model.py
```

Expected output:
- Model path check
- Total checkpoint files and sizes
- Tokenizer and config presence
- Verification status (`PASSED` with exit code `0`)

---

## 4. Model Inference

Run local inference on test STEM queries using Transformers:

```bash
python scripts/run_model.py \
    --prompt "Solve the quadratic equation x^2 - 5x + 6 = 0"
```

The runner prints:
- Generated response (with step-by-step reasoning and boxed answers)
- Input token count
- Output token count
- Generation latency (seconds)
- Generation speed (tokens/sec)

---

## 5. Benchmarking

### Official Benchmarks
Official model card results are pre-packaged in the application and accessible via the API/Frontend:
- **In-Distribution**: JEE Advanced 2025 (86.51%), NEET 2025 (84.66%), JEE Main 2025 (87.80%), JEE Main 2026 (92.99%)
- **Out-of-Distribution**: AIME (86.67%), HMMT (78.96%), GPQA (74.86%), MMLU-Pro (88.49%), MMLU-Redux 2.0 (92.92%)

### Local Evaluation
To execute evaluations against local evaluation datasets:

```bash
python scripts/run_benchmark.py --dataset path/to/eval_dataset.jsonl --benchmark-name "custom_stem_test"
```

If no dataset is provided:
```bash
python scripts/run_benchmark.py
# Output: "No local benchmark dataset supplied."
```

---

## 6. Starting FastAPI & Chat Interface

Launch the FastAPI backend serving both API endpoints and the static chat UI:

```bash
uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port 8000
```

Access the web interface at:
- **Web UI**: `http://<server-ip>:8000/`
- **Health Check**: `http://<server-ip>:8000/health`
- **Benchmarks Endpoint**: `http://<server-ip>:8000/benchmarks`
- **Interactive API Docs**: `http://<server-ip>:8000/docs`

---

## 7. Shared Server Safety Guidelines

1. **GPU Allocation**: Always respect `CUDA_VISIBLE_DEVICES`. Do not hard-code specific GPU device indices.
2. **Process Safety**: Never terminate or interfere with processes belonging to other users.
3. **Hardware Config**: Do not modify MIG (Multi-Instance GPU) profiles, CUDA drivers, or root system settings.
4. **Model Loading**: The backend singleton loads the model only once at startup into available VRAM.
