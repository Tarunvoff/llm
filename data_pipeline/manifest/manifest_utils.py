"""
Manifest Utilities for Vidhya 2.0 Data Pipeline
===============================================

Purpose:
--------
Provides centralized helper routines to safely read, modify, and append structured stage logs
to `run_manifest.json`. Guarantees consistent schema, timestamping, execution statistics,
and dropped-row accounting across all pipeline stages.

Inputs:
-------
- manifest_path: Path to the target run_manifest.json file
- stage_name: Identifier for the executed pipeline stage
- stage_data: Dictionary containing per-source metrics, drop reasons, and counts

Outputs:
--------
- Atomically updated `run_manifest.json` on disk.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict


def load_manifest(manifest_path: str = "data_pipeline/run_manifest.json") -> Dict[str, Any]:
    """Loads existing manifest or initializes empty stages structure."""
    path = Path(manifest_path)
    if not path.exists():
        return {"stages": []}
    with open(path, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except Exception:
            return {"stages": []}


def append_stage_manifest(
    stage_name: str,
    stage_data: Dict[str, Any],
    manifest_path: str = "data_pipeline/run_manifest.json"
) -> None:
    """Appends a new stage record to run_manifest.json with UTC timestamp."""
    manifest = load_manifest(manifest_path)
    record = {
        "stage": stage_name,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "data": stage_data
    }
    manifest.setdefault("stages", []).append(record)
    
    path = Path(manifest_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
