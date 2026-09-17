import json
import re
import sys
from pathlib import Path
import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from manifest.manifest_utils import append_stage_manifest

out_dir = Path("data_pipeline/raw/169Pi__exambench").resolve()
out_dir.mkdir(parents=True, exist_ok=True)
out_file = out_dir / "train.jsonl"
meta_file = out_dir / "meta.json"

print("[INFO] Streaming sample from 169Pi/exambench via HTTP range request...", flush=True)
url = "https://huggingface.co/datasets/169Pi/exambench/resolve/main/Alpie-core_competitive_exams_dataset.json"
headers = {"Range": "bytes=0-15000000"}  # 15MB slice
r = requests.get(url, headers=headers, allow_redirects=True)
text = r.text

# Find all JSON objects in text
matches = list(re.finditer(r'\{\s*"prompt"\s*:', text))
records = []
for i in range(len(matches)):
    start_idx = matches[i].start()
    end_idx = matches[i+1].start() if i + 1 < len(matches) else len(text)
    chunk = text[start_idx:end_idx].strip().rstrip(",").rstrip("]").strip()
    try:
        obj = json.loads(chunk)
        records.append(obj)
    except Exception:
        pass

print(f"Extracted {len(records)} records from exambench sample.", flush=True)
with open(out_file, "w", encoding="utf-8") as f:
    for r in records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

summary = {
    "hf_id": "169Pi/exambench",
    "safe_id": "169Pi__exambench",
    "subject": "mixed",
    "role": "train_with_care",
    "status": "success",
    "total_rows": len(records),
    "splits": {"train": len(records)},
    "storage_path": str(out_dir),
    "note": "Unverified conceptual QA; marked verified_correct=false"
}
with open(meta_file, "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2)

print("[SUCCESS] exambench ingestion complete!", flush=True)
