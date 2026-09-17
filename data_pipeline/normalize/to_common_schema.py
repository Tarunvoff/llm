"""
Stage 2: Schema Normalization
=============================

Transforms heterogeneous raw datasets under data_pipeline/raw/ into a unified JSONL format.
Applies source-specific mapping functions tailored to native dataset schemas.
Writes standardized JSONL files to data_pipeline/normalized/<source_name>.jsonl.
Enforces ground-truth provenance rules:
- Unverified sources (camel-ai, exambench) are explicitly tagged verified_correct=false.
- Eurus-2 action tags ([ASSESS], [ADVANCE], etc.) are stripped from reasoning traces.
- OpenMathReasoning and MedMCQA are parsed with their native ground-truth answers.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional

# Add parent directory to path for manifest logging
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from manifest.manifest_utils import append_stage_manifest


def format_mcq_options(options_raw: Any) -> str:
    """Formats options field (list of dicts or JSON string) into readable choices."""
    if not options_raw:
        return ""
    if isinstance(options_raw, str):
        try:
            options_raw = json.loads(options_raw)
        except Exception:
            return f"\nOptions: {options_raw}"
    
    if isinstance(options_raw, list):
        formatted = []
        for opt in options_raw:
            if isinstance(opt, dict):
                ident = opt.get("identifier") or opt.get("id") or opt.get("label", "")
                text = opt.get("content") or opt.get("text", "")
                formatted.append(f"{ident}) {text}".strip())
            else:
                formatted.append(str(opt))
        return "\n" + "\n".join(formatted)
    return ""


def clean_correct_option(val: Any) -> Optional[str]:
    """Cleans JSON-encoded or raw correct option field into a clean string (e.g. 'D')."""
    if val is None:
        return None
    if isinstance(val, str):
        val_strip = val.strip()
        if val_strip.startswith("[") and val_strip.endswith("]"):
            try:
                parsed = json.loads(val_strip)
                if isinstance(parsed, list) and parsed:
                    return str(parsed[0]).strip()
            except Exception:
                pass
        return val_strip
    if isinstance(val, list) and val:
        return str(val[0]).strip()
    return str(val).strip()


# =========================================================================
# Source-Specific Normalization Mappers
# =========================================================================

def map_jee_chemistry_cot(row: Dict[str, Any], idx: int, safe_id: str) -> Optional[Dict[str, Any]]:
    """Mapper for Abc8264/Jee-Chemistry-dataset-with-COT."""
    question_text = (row.get("question") or "").strip()
    if not question_text:
        return None

    options_text = format_mcq_options(row.get("options"))
    full_question = question_text + options_text
    
    solution = (row.get("solution") or "").strip()
    correct_opt = clean_correct_option(row.get("correct_option"))
    
    final_ans = correct_opt or ""
    if "Final Answer:" in solution:
        final_ans = solution.split("Final Answer:")[-1].strip()
    
    difficulty = "jee_main"
    paper_id = str(row.get("paper_id", "")).lower()
    if "adv" in paper_id:
        difficulty = "jee_advanced"

    return {
        "example_id": f"src_{safe_id}_{idx}",
        "subject": "chemistry",
        "source_dataset": "Abc8264/Jee-Chemistry-dataset-with-COT",
        "question": full_question,
        "reasoning_trace": solution,
        "final_answer": final_ans,
        "answer_key": correct_opt,
        "verified_correct": None,
        "difficulty": difficulty,
        "license": "unknown"
    }


def map_eqourse_jee_main(row: Dict[str, Any], idx: int, safe_id: str) -> Optional[Dict[str, Any]]:
    """Mapper for eQOURSE/jee-main-questions."""
    question_text = (row.get("question") or row.get("problem") or "").strip()
    if not question_text:
        return None

    subject = (row.get("subject") or "mixed").lower()
    if subject in ["mathematics", "maths"]:
        subject = "math"

    correct_opt = clean_correct_option(row.get("answer") or row.get("correct_option"))
    solution = (row.get("solution") or row.get("explanation") or "").strip()

    return {
        "example_id": f"src_{safe_id}_{idx}",
        "subject": subject,
        "source_dataset": "eQOURSE/jee-main-questions",
        "question": question_text,
        "reasoning_trace": solution,
        "final_answer": correct_opt or "",
        "answer_key": correct_opt,
        "verified_correct": None,
        "difficulty": "jee_main",
        "license": "unknown"
    }


def map_medical_o1_sft(row: Dict[str, Any], idx: int, safe_id: str) -> Optional[Dict[str, Any]]:
    """Mapper for FreedomIntelligence/medical-o1-reasoning-SFT."""
    question_text = (row.get("Question") or row.get("question") or "").strip()
    if not question_text:
        return None

    reasoning = (row.get("Complex_CoT") or row.get("complex_cot") or row.get("explanation") or "").strip()
    response = (row.get("Response") or row.get("response") or "").strip()
    
    return {
        "example_id": f"src_{safe_id}_{idx}",
        "subject": "biology",
        "source_dataset": "FreedomIntelligence/medical-o1-reasoning-SFT",
        "question": question_text,
        "reasoning_trace": reasoning,
        "final_answer": response,
        "answer_key": response if response else None,
        "verified_correct": None,
        "difficulty": "neet",
        "license": "apache-2.0"
    }


def map_openmath_reasoning(row: Dict[str, Any], idx: int, safe_id: str) -> Optional[Dict[str, Any]]:
    """Mapper for nvidia/OpenMathReasoning (cot split)."""
    question_text = (row.get("problem") or "").strip()
    if not question_text:
        return None

    solution = (row.get("generated_solution") or "").strip()
    expected_ans = (row.get("expected_answer") or "").strip()

    return {
        "example_id": f"src_{safe_id}_{idx}",
        "subject": "math",
        "source_dataset": "nvidia/OpenMathReasoning",
        "question": question_text,
        "reasoning_trace": solution,
        "final_answer": expected_ans,
        "answer_key": expected_ans if expected_ans else None,
        "verified_correct": None,
        "difficulty": "olympiad",
        "license": "cc-by-4.0"
    }


def map_medmcqa(row: Dict[str, Any], idx: int, safe_id: str) -> Optional[Dict[str, Any]]:
    """Mapper for openlifescienceai/medmcqa."""
    q_val = row.get("question")
    question_text = str(q_val).strip() if q_val and str(q_val).lower() != "nan" else ""
    if not question_text:
        return None

    def safe_str(v: Any) -> str:
        if v is None or (isinstance(v, float) and v != v):
            return ""
        return str(v).strip()

    options = [
        {"identifier": "A", "content": safe_str(row.get("opa"))},
        {"identifier": "B", "content": safe_str(row.get("opb"))},
        {"identifier": "C", "content": safe_str(row.get("opc"))},
        {"identifier": "D", "content": safe_str(row.get("opd"))}
    ]
    full_question = question_text + format_mcq_options(options)

    cop = row.get("cop")
    cop_map = {0: "A", 1: "B", 2: "C", 3: "D", "0": "A", "1": "B", "2": "C", "3": "D", "A": "A", "B": "B", "C": "C", "D": "D"}
    correct_opt = cop_map.get(cop)

    explanation = safe_str(row.get("exp"))

    return {
        "example_id": f"src_{safe_id}_{idx}",
        "subject": "biology",
        "source_dataset": "openlifescienceai/medmcqa",
        "question": full_question,
        "reasoning_trace": explanation,
        "final_answer": correct_opt or "",
        "answer_key": correct_opt,
        "verified_correct": None,
        "difficulty": "neet",
        "license": "unknown"
    }


def map_eurus2(row: Dict[str, Any], idx: int, safe_id: str) -> Optional[Dict[str, Any]]:
    """Mapper for PRIME-RL/Eurus-2-SFT-Data (action tags stripped)."""
    convs = row.get("conversations")
    if isinstance(convs, str):
        try:
            convs = json.loads(convs)
        except Exception:
            return None
    if not isinstance(convs, list) or len(convs) < 2:
        return None

    c0 = convs[0]
    c1 = convs[1]
    if isinstance(c0, str):
        try:
            c0 = json.loads(c0)
        except Exception:
            pass
    if isinstance(c1, str):
        try:
            c1 = json.loads(c1)
        except Exception:
            pass

    q_text = (c0.get("value") if isinstance(c0, dict) else str(c0)).strip()
    gpt_text = (c1.get("value") if isinstance(c1, dict) else str(c1)).strip()
    if not q_text or not gpt_text:
        return None

    output_idx = gpt_text.rfind("[OUTPUT]")
    if output_idx != -1:
        reasoning_raw = gpt_text[:output_idx]
        output_raw = gpt_text[output_idx + len("[OUTPUT]"):]
    else:
        reasoning_raw = gpt_text
        output_raw = gpt_text

    # Strip action tags
    clean_reasoning = re.sub(r'\[(ASSESS|ADVANCE|VERIFY|SIMPLIFY|SYNTHESIZE|PIVOT|OUTPUT)\]', '', reasoning_raw).strip()

    # Extract boxed answer from OUTPUT section
    match = re.findall(r'\\boxed\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}', output_raw)
    if not match:
        match = re.findall(r'boxed\{([^{}]*)\}', output_raw)
    
    final_ans = match[-1].strip() if match else output_raw.strip()

    task = str(row.get("task") or "math").lower()
    subject = "math"

    return {
        "example_id": f"src_{safe_id}_{idx}",
        "subject": subject,
        "source_dataset": "PRIME-RL/Eurus-2-SFT-Data",
        "question": q_text,
        "reasoning_trace": clean_reasoning,
        "final_answer": final_ans,
        "answer_key": final_ans if final_ans else None,
        "verified_correct": None,
        "difficulty": "jee_advanced",
        "license": "mit"
    }


def map_camel_ai_dataset(row: Dict[str, Any], idx: int, safe_id: str) -> Optional[Dict[str, Any]]:
    """Mapper for camel-ai datasets (unverified, no independent ground truth)."""
    msg1 = (row.get("message_1") or "").strip()
    msg2 = (row.get("message_2") or "").strip()
    if not msg1 or not msg2:
        return None

    q_clean = re.sub(r'^(Question:\s*)+', '', msg1).strip()
    subject = safe_id.split("__")[-1].lower()
    if subject not in ["physics", "chemistry", "math", "biology"]:
        subject = "physics"

    return {
        "example_id": f"src_{safe_id}_{idx}",
        "subject": subject,
        "source_dataset": f"camel-ai/{subject}",
        "question": q_clean,
        "reasoning_trace": msg2,
        "final_answer": msg2,
        "answer_key": None,
        "verified_correct": False,
        "verification_reason": "no_independent_ground_truth",
        "difficulty": "jee_main",
        "license": "cc-by-nc-4.0"
    }


def map_exambench(row: Dict[str, Any], idx: int, safe_id: str) -> Optional[Dict[str, Any]]:
    """Mapper for 169Pi/exambench (unverified conceptual QA)."""
    prompt = (row.get("prompt") or "").strip()
    if not prompt:
        return None

    complex_cot = (row.get("complex_cot") or "").strip()
    response = (row.get("response") or "").strip()

    return {
        "example_id": f"src_{safe_id}_{idx}",
        "subject": "mixed",
        "source_dataset": "169Pi/exambench",
        "question": prompt,
        "reasoning_trace": complex_cot,
        "final_answer": response,
        "answer_key": None,
        "verified_correct": False,
        "verification_reason": "no_ground_truth_key",
        "difficulty": "jee_main",
        "license": "apache-2.0"
    }


MAPPER_REGISTRY = {
    "Abc8264__Jee-Chemistry-dataset-with-COT": map_jee_chemistry_cot,
    "eQOURSE__jee-main-questions": map_eqourse_jee_main,
    "FreedomIntelligence__medical-o1-reasoning-SFT": map_medical_o1_sft,
    "nvidia__OpenMathReasoning": map_openmath_reasoning,
    "openlifescienceai__medmcqa": map_medmcqa,
    "PRIME-RL__Eurus-2-SFT-Data": map_eurus2,
    "camel-ai__physics": map_camel_ai_dataset,
    "camel-ai__chemistry": map_camel_ai_dataset,
    "camel-ai__math": map_camel_ai_dataset,
    "camel-ai__biology": map_camel_ai_dataset,
    "169Pi__exambench": map_exambench,
}


def normalize_source_directory(
    source_dir: Path,
    output_dir: Path,
    max_samples: Optional[int] = None
) -> Dict[str, Any]:
    """Reads all jsonl files in a raw source directory and normalizes them."""
    safe_id = source_dir.name
    mapper = MAPPER_REGISTRY.get(safe_id)
    if not mapper:
        print(f"[WARNING] No dedicated mapper found for {safe_id}. Skipping.")
        return {"source": safe_id, "status": "no_mapper", "normalized": 0, "dropped": 0}

    output_file = output_dir / f"{safe_id}.jsonl"
    print(f"[INFO] Normalizing {safe_id} -> {output_file.name}")

    total_read = 0
    total_normalized = 0
    total_dropped = 0
    samples_preview = []

    with open(output_file, "w", encoding="utf-8") as out_f:
        for jsonl_path in sorted(source_dir.glob("*.jsonl")):
            with open(jsonl_path, "r", encoding="utf-8") as in_f:
                for line in in_f:
                    if not line.strip():
                        continue
                    total_read += 1
                    try:
                        raw_row = json.loads(line)
                    except Exception:
                        total_dropped += 1
                        continue

                    mapped = mapper(raw_row, total_normalized, safe_id)
                    if mapped is None:
                        total_dropped += 1
                        continue

                    out_f.write(json.dumps(mapped, ensure_ascii=False) + "\n")
                    total_normalized += 1

                    if len(samples_preview) < 2:
                        samples_preview.append(mapped)

                    if max_samples and total_normalized >= max_samples:
                        break
            if max_samples and total_normalized >= max_samples:
                break

    print(f"  -> Total Read: {total_read} | Normalized: {total_normalized} | Dropped: {total_dropped}")
    return {
        "source": safe_id,
        "status": "success",
        "total_read": total_read,
        "normalized": total_normalized,
        "dropped": total_dropped,
        "output_file": str(output_file),
        "samples_preview": samples_preview
    }


def main():
    parser = argparse.ArgumentParser(description="Stage 2: Normalize raw datasets to common schema.")
    parser.add_argument("--raw-dir", type=str, default="data_pipeline/raw", help="Directory containing raw datasets")
    parser.add_argument("--output-dir", type=str, default="data_pipeline/normalized", help="Output directory for normalized JSONL")
    parser.add_argument("--manifest", type=str, default="data_pipeline/run_manifest.json", help="Path to run_manifest.json")
    parser.add_argument("--source", type=str, default=None, help="Process only a single source by directory name")
    parser.add_argument("--max-samples", type=int, default=None, help="Limit rows for testing")

    args = parser.parse_args()

    raw_path = Path(args.raw_dir).resolve()
    output_path = Path(args.output_dir).resolve()
    output_path.mkdir(parents=True, exist_ok=True)

    sources_to_run = []
    if args.source:
        source_dir = raw_path / args.source
        if not source_dir.exists():
            print(f"[ERROR] Source directory does not exist: {source_dir}")
            sys.exit(1)
        sources_to_run.append(source_dir)
    else:
        sources_to_run = [d for d in sorted(raw_path.iterdir()) if d.is_dir()]

    print(f"[INFO] Found {len(sources_to_run)} source(s) to normalize.")
    results = []

    for s_dir in sources_to_run:
        res = normalize_source_directory(s_dir, output_path, args.max_samples)
        results.append(res)

    append_stage_manifest(
        stage_name="normalize",
        stage_data={
            "sources_processed": len(results),
            "summary": [
                {
                    "source": r["source"],
                    "normalized": r.get("normalized", 0),
                    "dropped": r.get("dropped", 0),
                    "status": r.get("status")
                }
                for r in results
            ]
        },
        manifest_path=args.manifest
    )

    print(f"\n[SUCCESS] Normalization complete. Logged to {args.manifest}")


if __name__ == "__main__":
    main()
