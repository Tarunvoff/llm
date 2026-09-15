# Environment Setup and Deployment Guide

This guide details local development setup and deployment workflows for building, testing, benchmarking, and serving the AI Tutor system.

---

## 1. Local Development Setup (Windows / Workstation)

Local development focuses on code authoring, unit testing, schema validation, and pipeline mocking without requiring multi-gigabyte GPU models.

### 1.1 Prerequisites
- Python 3.10+ (Python 3.11/3.14 verified)
- Git

### 1.2 Installation
```bash
# Clone the repository
git clone https://github.com/Tarunvoff/llm.git
cd llm

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -e .
```

### 1.3 Running Local Unit Tests
All unit tests execute locally without requiring external GPUs:
```bash
pytest tests/ -v
```

---

## 2. Remote GPU Server Workflow

All code development occurs locally in Antigravity IDE, pushed to GitHub, and pulled on the target execution server.

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

## 3. PDF RAG Pipeline Usage

```bash
# Build/Update persistent hybrid vector index from raw PDFs
python -c "from tutor.rag.pipeline import RAGPipeline; rag = RAGPipeline(); rag.build()"

# Query RAG pipeline from Python
python -c "from tutor.rag.pipeline import RAGPipeline; rag = RAGPipeline(); print(rag.retrieve('Newton second law', top_k=3))"
```

---

## 4. Starting FastAPI & Chat Interface

Launch the FastAPI backend serving both API endpoints and the chat UI:

```bash
uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port 8000
```

Access points:
- **Web UI**: `http://<server-ip>:8000/`
- **Health Check**: `http://<server-ip>:8000/health`
- **Interactive API Docs**: `http://<server-ip>:8000/docs`

---

## 5. Shared Server Safety Guidelines

1. **GPU Allocation**: Always respect `CUDA_VISIBLE_DEVICES`. Do not hard-code specific GPU device indices.
2. **Process Safety**: Never terminate or interfere with processes belonging to other users.
3. **Hardware Config**: Do not modify MIG profiles, CUDA drivers, or root system settings.
