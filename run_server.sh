#!/bin/bash
# Startup script for Vidhya LLM Inference Server on NVIDIA DGX
set -e

# Target clean GPU 7 with 140 GB free VRAM
export CUDA_VISIBLE_DEVICES=${CUDA_VISIBLE_DEVICES:-7}
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True

# Use port 5208 by default (or custom port)
PORT=${PORT:-5208}

echo "=========================================================="
echo " Starting Vidhya LLM Server on GPU: $CUDA_VISIBLE_DEVICES (Port: $PORT)"
echo "=========================================================="

cd "$(dirname "$0")"

# Execute with the exact Python path installed on DGX or active environment
PYTHON_BIN="python3"
if [ -f "/opt/llm-training/bin/python" ]; then
    PYTHON_BIN="/opt/llm-training/bin/python"
elif [ -f ".venv/bin/python" ]; then
    PYTHON_BIN=".venv/bin/python"
fi

"$PYTHON_BIN" -m uvicorn backend.main:app --host 0.0.0.0 --port "$PORT"
