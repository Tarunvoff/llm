#!/usr/bin/env bash
# ==============================================================================
# JEE / NEET / STEM Server Dataset Download Script
#
# Downloads all essential fine-tuning, instruction, pre-training, and benchmark
# datasets directly to the server under the designated dataset directory.
#
# Usage:
#   bash scripts/download_datasets.sh [TARGET_DIR]
#   bash scripts/download_datasets.sh dataset
#   DATASET_DIR=/data/storage/dataset bash scripts/download_datasets.sh
#
# Background run on remote server:
#   nohup bash scripts/download_datasets.sh dataset > download.log 2>&1 &
# ==============================================================================

set -Eeuo pipefail

# Configuration
DATASET_DIR="${1:-${DATASET_DIR:-dataset}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors for terminal output
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}==============================================================================${NC}"
echo -e "${BOLD}${GREEN} JEE / NEET / STEM SERVER DATASET DOWNLOADER${NC}"
echo -e "${BOLD}${BLUE}==============================================================================${NC}"
echo -e "Project Root : ${PROJECT_ROOT}"
echo -e "Target Dir   : ${DATASET_DIR}"
echo -e "Date/Time    : $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${BOLD}${BLUE}==============================================================================${NC}"

# Ensure python and datasets library are present
PYTHON_CMD="python3"
if ! command -v python3 &>/dev/null; then
    if command -v python &>/dev/null; then
        PYTHON_CMD="python"
    else
        echo -e "${RED}ERROR: Python is not installed or not in PATH.${NC}" >&2
        exit 1
    fi
fi

# Verify 'datasets' library
if ! "$PYTHON_CMD" -c "import datasets" &>/dev/null; then
    echo -e "${YELLOW}Warning: 'datasets' package not found. Attempting installation...${NC}"
    "$PYTHON_CMD" -m pip install --upgrade datasets huggingface_hub pyarrow
fi

# Create target directories under dataset folder
mkdir -p "${DATASET_DIR}/raw"
mkdir -p "${DATASET_DIR}/raw/jee"
mkdir -p "${DATASET_DIR}/raw/neet"
mkdir -p "${DATASET_DIR}/raw/ncert"
mkdir -p "${DATASET_DIR}/raw/science"
mkdir -p "${DATASET_DIR}/raw/multimodal"
mkdir -p "${DATASET_DIR}/benchmarks"

# Check if the Python orchestrator script exists
PY_ORCHESTRATOR="${PROJECT_ROOT}/scripts/data/download_hf_datasets.py"

if [ -f "$PY_ORCHESTRATOR" ]; then
    echo -e "\n${GREEN}Running Python Dataset Orchestrator (with retry handling & disk stats)...${NC}\n"
    "$PYTHON_CMD" "$PY_ORCHESTRATOR" --output-dir "$DATASET_DIR" "$@"
else
    # Fallback to inline python runner
    echo -e "\n${YELLOW}Python orchestrator not found at $PY_ORCHESTRATOR. Running inline downloader...${NC}\n"

    download_dataset () {
        local REPO="$1"
        local REL_OUT="$2"
        local FULL_OUT="${DATASET_DIR}/${REL_OUT}"

        echo ""
        echo -e "${BLUE}------------------------------------------------------------------------------${NC}"
        echo -e "Downloading : ${BOLD}${REPO}${NC}"
        echo -e "Output Path : ${FULL_OUT}"
        echo -e "${BLUE}------------------------------------------------------------------------------${NC}"

        mkdir -p "$FULL_OUT"

        "$PYTHON_CMD" - "$REPO" "$FULL_OUT" <<'PY'
import sys
import os
from datasets import load_dataset

repo = sys.argv[1]
output = sys.argv[2]
token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")

print(f"Loading {repo} from Hugging Face Hub...")
kwargs = {}
if token:
    kwargs["token"] = token

try:
    ds = load_dataset(repo, **kwargs)
    print(ds)
    print(f"Saving to disk: {output}")
    ds.save_to_disk(output)
    print(f"✓ Saved successfully to {output}")
except Exception as e:
    print(f"✗ Failed to download {repo}: {e}", file=sys.stderr)
    sys.exit(1)
PY
    }

    # Student Questions
    download_dataset "SetFit/student-question-categories" "raw/student_questions"

    # JEE Main
    download_dataset "eQOURSE/jee-main-questions" "raw/jee/jee-main"

    # JEE Advanced
    download_dataset "Grass-G/jee-advanced-questions" "raw/jee/jee-advanced"

    # JEE SFT
    download_dataset "farhananis005/jee-sft-v1" "raw/jee/jee-sft-v1"

    # JEE GRPO
    download_dataset "farhananis005/jee-grpo-v1" "raw/jee/jee-grpo-v1"

    # NEET
    download_dataset "Kshitij-PES/NEET_Dataset" "raw/neet/neet-dataset"

    # NEET Tutor / Instruction
    download_dataset "catchshubham/neet-dataset" "raw/neet/neet-tutor"

    # NCERT
    download_dataset "theshivam7/ncert-dataset" "raw/ncert/ncert-dataset"

    # General Science
    download_dataset "169Pi/Science-QnA" "raw/science/science-qna"

    # Multimodal JEE / NEET
    download_dataset "RJTR001/jee-neet-benchmark" "raw/multimodal/rjtr001"
    download_dataset "Vyshnavi93920/jee-neet-benchmark" "raw/multimodal/vyshnavi"

    # Nalanda Benchmark
    download_dataset "Nalandadata/NalandaJEENEETBench" "benchmarks/nalanda"

    # JEEBench
    download_dataset "daman1209arora/jeebench" "benchmarks/jeebench"

    # Indic JEEBench
    download_dataset "anushakamathofficial/indic_jee_bench" "benchmarks/indic-jeebench"
fi

echo ""
echo -e "${BOLD}${GREEN}==============================================================================${NC}"
echo -e "${BOLD}${GREEN} ALL DATASETS DOWNLOADED SUCCESSFULLY IN '${DATASET_DIR}'${NC}"
echo -e "${BOLD}${GREEN}==============================================================================${NC}"

echo -e "\n${BOLD}Directory summary:${NC}"
if command -v du &>/dev/null; then
    echo -e "\nRaw Data:"
    du -sh "${DATASET_DIR}/raw"/* 2>/dev/null || true
    echo -e "\nBenchmarks:"
    du -sh "${DATASET_DIR}/benchmarks"/* 2>/dev/null || true
    echo -e "\nTotal Storage:"
    du -sh "${DATASET_DIR}" 2>/dev/null || true
fi
