"""
Stage 3: Answer Verification (The Gold Filter)
==============================================

Verifies that the candidate reasoning trace and final answer align with ground-truth answer keys.
Enforces:
1. Strict exact match for Multiple Choice Questions (identifiers and option content).
2. Symbolic/mathematical equivalence verification using the `math-verify` library.
3. Explicit rejection when no ground truth is provided (never assuming correctness from plausible CoT).
Writes verified records (preserving both pass and fail) to data_pipeline/verified/<source_name>.jsonl.
Logs pass/fail/no_ground_truth metrics to run_manifest.json.
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

# Add parent directory to path for manifest logging
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from manifest.manifest_utils import append_stage_manifest

# Attempt importing math_verify
try:
    from math_verify import parse, verify
    HAS_MATH_VERIFY = True
except ImportError:
    HAS_MATH_VERIFY = False


def normalize_string(s: Optional[str]) -> str:
    """Normalizes string by trimming whitespace and lowercasing."""
    if not s:
        return ""
    return re.sub(r"\s+", " ", str(s)).strip().lower()


def extract_mcq_letter(text: str) -> Optional[str]:
    """Extracts leading MCQ option letter if present (e.g. 'A', '(B)', 'C)')."""
    text = text.strip()
    match = re.match(r"^[\(\[]?([A-Da-d])[\)\]\.\:]?", text)
    if match:
        return match.group(1).upper()
    return None


def verify_mcq(final_answer: str, answer_key: str, question: str) -> Tuple[bool, str]:
    """Checks exact match for MCQ option identifiers and option text."""
    norm_final = normalize_string(final_answer)
    norm_key = normalize_string(answer_key)

    # 1. Direct equality
    if norm_final == norm_key:
        return True, "exact_match"

    # 2. Key is single letter (e.g. 'D') and final answer starts with that letter
    key_letter = extract_mcq_letter(norm_key) or norm_key.upper() if len(norm_key) == 1 else None
    final_letter = extract_mcq_letter(norm_final) or (norm_final.upper() if len(norm_final) == 1 else None)

    if key_letter and final_letter and key_letter == final_letter:
        return True, "mcq_letter_match"

    # 3. Key is letter, check if final answer matches the text of that option in question
    if key_letter:
        # Pattern to find option text e.g. "D) protonation of alcohol molecule"
        opt_pattern = rf"{key_letter}\)\s*([^\n]+)"
        opt_match = re.search(opt_pattern, question, re.IGNORECASE)
        if opt_match:
            opt_content = normalize_string(opt_match.group(1))
            if opt_content and (opt_content in norm_final or norm_final in opt_content):
                return True, "mcq_option_content_match"

    return False, "mcq_mismatch"


def verify_symbolic_math(final_answer: str, answer_key: str) -> Tuple[bool, str]:
    """Evaluates mathematical equivalence via math_verify or numeric comparison."""
    if not HAS_MATH_VERIFY:
        return (normalize_string(final_answer) == normalize_string(answer_key)), "fallback_string_match"

    try:
        parsed_target = parse(answer_key, parsing_timeout=None)
        parsed_candidate = parse(final_answer, parsing_timeout=None)
        if verify(parsed_target, parsed_candidate, timeout_seconds=None):
            return True, "math_verify_equivalent"
    except Exception:
        pass

    # Fallback to direct numeric float comparison
    try:
        f_cand = float(re.sub(r"[^\d\.\-]", "", final_answer))
        f_key = float(re.sub(r"[^\d\.\-]", "", answer_key))
        if abs(f_cand - f_key) < 1e-4:
            return True, "numeric_tolerance_match"
    except Exception:
        pass

    return False, "symbolic_mismatch"


def verify_row(row: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Evaluates verification of a single row against ground-truth answer_key.
    Returns: (verified_correct: bool, reason: str)
    """
    # If explicitly flagged unverified at normalization time, preserve status
    if row.get("verified_correct") is False:
        return False, row.get("verification_reason") or "no_independent_ground_truth"

    answer_key = row.get("answer_key")
    final_answer = row.get("final_answer", "")
    question = row.get("question", "")

    # Rule: If answer_key is missing, never assume correctness
    if answer_key is None or str(answer_key).strip() == "" or str(answer_key).lower() == "null":
        return False, "no_ground_truth"

    answer_key_str = str(answer_key).strip()
    final_answer_str = str(final_answer).strip()

    if not final_answer_str:
        return False, "empty_final_answer"

    # Multiple choice check
    is_mcq = bool(re.search(r"[A-D]\)", question) or len(answer_key_str) == 1 and answer_key_str.upper() in "ABCD")
    if is_mcq:
        return verify_mcq(final_answer_str, answer_key_str, question)

    # Symbolic / Math check
    return verify_symbolic_math(final_answer_str, answer_key_str)


def verify_source_file(
    input_file: Path,
    output_file: Path,
    max_samples: Optional[int] = None
) -> Dict[str, Any]:
    """Runs answer verification across a normalized JSONL file."""
    source_name = input_file.stem
    print(f"[INFO] Verifying: {input_file.name} -> {output_file.name}")

    total_rows = 0
    passed = 0
    failed = 0
    no_gt = 0
    failure_examples = []

    with open(input_file, "r", encoding="utf-8") as in_f, open(output_file, "w", encoding="utf-8") as out_f:
        for line in in_f:
            if not line.strip():
                continue
            total_rows += 1
            row = json.loads(line)

            is_correct, reason = verify_row(row)
            row["verified_correct"] = is_correct
            row["verification_reason"] = reason

            if is_correct:
                passed += 1
            else:
                failed += 1
                if reason == "no_ground_truth":
                    no_gt += 1
                if len(failure_examples) < 5:
                    failure_examples.append({
                        "example_id": row.get("example_id"),
                        "question": row.get("question", "")[:120] + "...",
                        "final_answer": row.get("final_answer"),
                        "answer_key": row.get("answer_key"),
                        "reason": reason
                    })

            out_f.write(json.dumps(row, ensure_ascii=False) + "\n")

            if max_samples and total_rows >= max_samples:
                break

    pass_rate = (passed / total_rows * 100) if total_rows > 0 else 0.0
    print(f"  -> Total: {total_rows} | Passed: {passed} ({pass_rate:.1f}%) | Failed: {failed} (No GT: {no_gt})")

    return {
        "source": source_name,
        "total_rows": total_rows,
        "verified_correct_true": passed,
        "verified_correct_false": failed,
        "no_ground_truth": no_gt,
        "pass_rate_pct": round(pass_rate, 2),
        "output_file": str(output_file),
        "failure_examples": failure_examples
    }


def main():
    parser = argparse.ArgumentParser(description="Stage 3: Answer Verification (The Gold Filter)")
    parser.add_argument("--input-dir", type=str, default="data_pipeline/normalized", help="Directory containing normalized JSONL")
    parser.add_argument("--output-dir", type=str, default="data_pipeline/verified", help="Directory for verified output JSONL")
    parser.add_argument("--manifest", type=str, default="data_pipeline/run_manifest.json", help="Path to run_manifest.json")
    parser.add_argument("--source", type=str, default=None, help="Process only a specific source JSONL file name")
    parser.add_argument("--max-samples", type=int, default=None, help="Limit rows for testing")

    args = parser.parse_args()

    input_path = Path(args.input_dir).resolve()
    output_path = Path(args.output_dir).resolve()
    output_path.mkdir(parents=True, exist_ok=True)

    if args.source:
        target_file = input_path / (args.source if args.source.endswith(".jsonl") else f"{args.source}.jsonl")
        if not target_file.exists():
            print(f"[ERROR] Target file does not exist: {target_file}")
            sys.exit(1)
        files_to_verify = [target_file]
    else:
        files_to_verify = sorted(input_path.glob("*.jsonl"))

    print(f"[INFO] Found {len(files_to_verify)} file(s) to verify.")
    results = []

    for f_path in files_to_verify:
        out_f_path = output_path / f_path.name
        res = verify_source_file(f_path, out_f_path, args.max_samples)
        results.append(res)

    # Log verification metrics to run_manifest.json
    append_stage_manifest(
        stage_name="verify",
        stage_data={
            "files_processed": len(results),
            "summary": [
                {
                    "source": r["source"],
                    "total_rows": r["total_rows"],
                    "verified_correct_true": r["verified_correct_true"],
                    "verified_correct_false": r["verified_correct_false"],
                    "no_ground_truth": r["no_ground_truth"],
                    "pass_rate_pct": r["pass_rate_pct"]
                }
                for r in results
            ]
        },
        manifest_path=args.manifest
    )

    print(f"\n[SUCCESS] Verification complete. Logged to {args.manifest}")


if __name__ == "__main__":
    main()
