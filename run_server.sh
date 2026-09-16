#!/bin/bash
# Startup script for Vidhya LLM Inference Server on NVIDIA DGX
set -e

# Use specific clean GPU (default GPU 0)
export CUDA_VISIBLE_DEVICES=${CUDA_VISIBLE_DEVICES:-0}
export LOAD_IN_4BIT=1

# Use student port 8202 by default to avoid conflicts
PORT=${PORT:-8202}

echo "=========================================================="
echo " Starting Vidhya LLM Server on GPU: $CUDA_VISIBLE_DEVICES (Port: $PORT)"
echo "=========================================================="

cd "$(dirname "$0")"

# Execute with the exact Python path installed on DGX
/opt/llm-training/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port "$PORT"
