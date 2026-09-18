import argparse
import json
import os
import re
import time
from collections import defaultdict

import torch
from datasets import load_from_disk
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer


# ============================================================
# CONFIG
# ============================================================

BASE_MODEL = "PhysicsWallahAI/Aryabhata-2.0"
ADAPTER_PATH = "outputs/vidhya2_reasoning_sft/final_adapter"

TEST_PATH = "data/sft/v2_reasoning_boost/test.jsonl"
OUTPUT_PATH = "outputs/vidhya2_evaluation/test_predictions.jsonl"

MAX_NEW_TOKENS = 512

# Aryabhata Harmony stop token
STOP_TOKEN = "<|end|>"


# ============================================================
# HARMONY PROMPT
# ============================================================

SYSTEM_PROMPT = (
    "<|start|>system<|message|>"
    "You are Aryabhata, a large language model post trained by PhysicsWallah.\n"
    "Reasoning: auto\n\n"
    "# Valid channels: analysis, commentary, final. "
    "Channel must be included for every message."
    "<|end|>"
)


def build_prompt(question: str) -> str:
    """
    Build the same Harmony-style prompt used during SFT.
    IMPORTANT:
    Only the question is passed.
    Ground-truth reasoning/answer is NEVER included.
    """

    return (
        SYSTEM_PROMPT
        + "<|start|>user<|message|>"
        + question.strip()
        + "<|end|>"
        + "<|start|>assistant<|channel|>analysis<|message|>"
    )


# ============================================================
# LOAD TEST DATA
# ============================================================

def load_test_data(path):
    print(f"Loading test data from: {path}")

    data = []

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()

            if not line:
                continue

            data.append(json.loads(line))

    print(f"Test examples: {len(data)}")

    return data


# ============================================================
# ANSWER EXTRACTION
# ============================================================

def normalize_answer(text):
    """
    Normalize answer text for comparison.
    """

    if text is None:
        return ""

    text = str(text).strip().lower()

    # Remove HTML
    text = re.sub(r"<[^>]+>", " ", text)

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text)

    # Remove common punctuation around answer
    text = text.strip(" .,:;-'\"")

    return text


def extract_final_answer(text):
    """
    Try to extract the final answer from generated text.

    Handles patterns such as:
        Final Answer: B
        Answer: B
        Final answer is B
        Therefore, B
        Ans. is 'b'
    """

    if not text:
        return ""

    # Remove Harmony channel labels
    cleaned = text

    cleaned = re.sub(
        r"<\|channel\|>\s*(analysis|commentary|final)\s*",
        " ",
        cleaned,
        flags=re.IGNORECASE,
    )

    cleaned = re.sub(
        r"\b(analysis|commentary|final)\b(?=\s*(Ans|Answer|Final))",
        " ",
        cleaned,
        flags=re.IGNORECASE,
    )

    # --------------------------------------------------------
    # Explicit answer patterns
    # --------------------------------------------------------

    patterns = [
        # Final Answer: B
        r"final\s+answer\s*[:\-]?\s*\(?([A-Da-d])\)?",

        # Final Answer is B
        r"final\s+answer\s+(?:is|=)\s*\(?([A-Da-d])\)?",

        # Answer: B
        r"\banswer\s*[:\-]\s*\(?([A-Da-d])\)?",

        # Answer is B
        r"\banswer\s+(?:is|=)\s*\(?([A-Da-d])\)?",

        # Ans. is 'b'
        r"\bans\.?\s*(?:is|=)\s*['\"]?\(?([A-Da-d])\)?",

        # Ans: B
        r"\bans\.?\s*[:\-]\s*\(?([A-Da-d])\)?",
    ]

    for pattern in patterns:
        matches = re.findall(pattern, cleaned, flags=re.IGNORECASE)

        if matches:
            return matches[-1].upper()

    # --------------------------------------------------------
    # Look near the end of the answer
    # --------------------------------------------------------

    tail = cleaned[-500:]

    patterns_tail = [
        r"\boption\s*\(?([A-Da-d])\)?",
        r"\bchoice\s*\(?([A-Da-d])\)?",
        r"\btherefore\s*[,:\-]?\s*\(?([A-Da-d])\)?",
        r"\bthus\s*[,:\-]?\s*\(?([A-Da-d])\)?",
    ]

    for pattern in patterns_tail:
        matches = re.findall(pattern, tail, flags=re.IGNORECASE)

        if matches:
            return matches[-1].upper()

    return ""


# ============================================================
# MCQ OPTION EXTRACTION
# ============================================================

def extract_options(question):
    """
    Extract A/B/C/D option text from the question.

    Used to compare text-style answers against answer_key.
    """

    options = {}

    pattern = re.compile(
        r"(?:^|\n)\s*([A-Da-d])\)\s*(.+?)(?=\n\s*[A-Da-d]\)|$)",
        flags=re.DOTALL,
    )

    matches = pattern.findall(question)

    for letter, content in matches:
        options[letter.upper()] = normalize_answer(content)

    return options


def evaluate_prediction(generated_text, example):
    """
    Determine whether generated answer matches answer_key.

    Priority:
        1. Explicit A/B/C/D extraction
        2. Match final answer text against option text
    """

    answer_key = str(example.get("answer_key", "")).strip().upper()

    if not answer_key:
        return False, "", "no_answer_key"

    predicted_letter = extract_final_answer(generated_text)

    # Direct MCQ letter match
    if predicted_letter in {"A", "B", "C", "D"}:
        return (
            predicted_letter == answer_key,
            predicted_letter,
            "letter",
        )

    # --------------------------------------------------------
    # Text answer matching
    # --------------------------------------------------------

    final_answer = normalize_answer(example.get("final_answer", ""))

    generated_normalized = normalize_answer(generated_text)

    if final_answer:
        if final_answer in generated_normalized:
            return True, final_answer, "text_match"

    # Compare against option content
    options = extract_options(example.get("question", ""))

    if answer_key in options:
        correct_option_text = options[answer_key]

        if correct_option_text and correct_option_text in generated_normalized:
            return True, correct_option_text, "option_text_match"

    return False, predicted_letter, "unresolved"


# ============================================================
# MODEL LOADING
# ============================================================

def load_model():

    print("\nLoading model & tokenizer...")

    start = time.time()

    tokenizer = AutoTokenizer.from_pretrained(
        BASE_MODEL,
        trust_remote_code=True,
    )

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True,
    )

    model = PeftModel.from_pretrained(
        model,
        ADAPTER_PATH,
    )

    model.eval()

    elapsed = time.time() - start

    device = next(model.parameters()).device

    print(f"Loaded in {elapsed:.2f}s on device: {device}")

    # Find <|end|>
    stop_token_id = tokenizer.convert_tokens_to_ids(STOP_TOKEN)

    print(
        f"Stop token ({STOP_TOKEN}): ID={stop_token_id}"
    )

    print(
        f"Tokenizer EOS token: "
        f"{tokenizer.eos_token} -> {tokenizer.eos_token_id}"
    )

    return tokenizer, model, stop_token_id


# ============================================================
# GENERATION
# ============================================================

@torch.inference_mode()
def generate_answer(
    model,
    tokenizer,
    prompt,
    stop_token_id,
):
    """
    Generate model response.

    Returns:
        generated_text
        generated_tokens
        stopped_at_end
        generation_time
    """

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        add_special_tokens=False,
    )

    inputs = {
        k: v.to(model.device)
        for k, v in inputs.items()
    }

    prompt_length = inputs["input_ids"].shape[1]

    start = time.time()

    outputs = model.generate(
        **inputs,

        max_new_tokens=MAX_NEW_TOKENS,

        do_sample=False,

        eos_token_id=stop_token_id,

        pad_token_id=tokenizer.pad_token_id,
    )

    elapsed = time.time() - start

    generated_ids = outputs[0][prompt_length:]

    generated_tokens = len(generated_ids)

    stopped_at_end = (
        len(generated_ids) > 0
        and generated_ids[-1].item() == stop_token_id
    )

    generated_text = tokenizer.decode(
        generated_ids,
        skip_special_tokens=True,
    )

    return (
        generated_text,
        generated_tokens,
        stopped_at_end,
        elapsed,
    )


# ============================================================
# MAIN EVALUATION
# ============================================================

def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Evaluate only first N examples. Default: all.",
    )

    args = parser.parse_args()

    print("=" * 70)
    print("Vidhya 2.0 Test Set Evaluation")
    print("=" * 70)

    print(f"Model:     {BASE_MODEL}")
    print(f"Adapter:   {ADAPTER_PATH}")
    print(f"Test Data: {TEST_PATH}")
    print(f"Output:    {OUTPUT_PATH}")

    # --------------------------------------------------------
    # Load model
    # --------------------------------------------------------

    tokenizer, model, stop_token_id = load_model()

    # --------------------------------------------------------
    # Load test data
    # --------------------------------------------------------

    test_data = load_test_data(TEST_PATH)

    if args.limit is not None:
        test_data = test_data[:args.limit]

    total = len(test_data)

    print(f"\nEvaluating {total} examples...\n")

    # --------------------------------------------------------
    # Output directory
    # --------------------------------------------------------

    os.makedirs(
        os.path.dirname(OUTPUT_PATH),
        exist_ok=True,
    )

    # --------------------------------------------------------
    # Metrics
    # --------------------------------------------------------

    correct = 0

    stopped_count = 0
    max_token_count = 0

    total_tokens = 0
    total_time = 0

    subject_stats = defaultdict(
        lambda: {"correct": 0, "total": 0}
    )

    difficulty_stats = defaultdict(
        lambda: {"correct": 0, "total": 0}
    )

    results = []

    # --------------------------------------------------------
    # Evaluation loop
    # --------------------------------------------------------

    with open(
        OUTPUT_PATH,
        "w",
        encoding="utf-8",
    ) as output_file:

        for index, example in enumerate(
            test_data,
            start=1,
        ):

            question = example["question"]

            prompt = build_prompt(question)

            (
                generated_text,
                generated_tokens,
                stopped_at_end,
                generation_time,
            ) = generate_answer(
                model,
                tokenizer,
                prompt,
                stop_token_id,
            )

            # --------------------------------------------
            # Evaluate answer
            # --------------------------------------------

            is_correct, predicted_answer, match_type = (
                evaluate_prediction(
                    generated_text,
                    example,
                )
            )

            if is_correct:
                correct += 1

            if stopped_at_end:
                stopped_count += 1
            else:
                max_token_count += 1

            total_tokens += generated_tokens
            total_time += generation_time

            # --------------------------------------------
            # Subject
            # --------------------------------------------

            subject = example.get(
                "subject",
                "unknown",
            )

            subject_stats[subject]["total"] += 1

            if is_correct:
                subject_stats[subject]["correct"] += 1

            # --------------------------------------------
            # Difficulty
            # --------------------------------------------

            difficulty = example.get(
                "difficulty",
                "unknown",
            )

            difficulty_stats[difficulty]["total"] += 1

            if is_correct:
                difficulty_stats[difficulty]["correct"] += 1

            # --------------------------------------------
            # Result object
            # --------------------------------------------

            result = {
                "example_id": example.get("example_id"),
                "subject": subject,
                "difficulty": difficulty,
                "question": question,

                "ground_truth_answer": example.get(
                    "final_answer"
                ),

                "answer_key": example.get(
                    "answer_key"
                ),

                "predicted_answer": predicted_answer,

                "correct": is_correct,

                "match_type": match_type,

                "generated_text": generated_text,

                "generated_tokens": generated_tokens,

                "generation_time_seconds": round(
                    generation_time,
                    3,
                ),

                "tokens_per_second": round(
                    generated_tokens / generation_time,
                    2,
                )
                if generation_time > 0
                else 0,

                "stopped_at_end": stopped_at_end,
            }

            output_file.write(
                json.dumps(
                    result,
                    ensure_ascii=False,
                )
                + "\n"
            )

            output_file.flush()

            results.append(result)

            # --------------------------------------------
            # Progress
            # --------------------------------------------

            speed = (
                generated_tokens / generation_time
                if generation_time > 0
                else 0
            )

            print(
                f"[{index:4d}/{total}] "
                f"{generation_time:6.2f}s | "
                f"{generated_tokens:4d} tok | "
                f"{speed:6.2f} tok/s | "
                f"correct={'YES' if is_correct else 'NO'} | "
                f"stop={'YES' if stopped_at_end else 'NO'}"
            )

            # Print first few examples in detail
            if index <= 3:

                print()
                print("Question:")
                print(question)

                print(
                    f"\nGround Truth: "
                    f"{example.get('final_answer')}"
                )

                print(
                    f"Answer Key: "
                    f"{example.get('answer_key')}"
                )

                print(
                    f"Predicted: "
                    f"{predicted_answer}"
                )

                print(
                    f"Correct: "
                    f"{'YES' if is_correct else 'NO'}"
                )

                print("\nModel Response:")
                print(generated_text[:3000])

                print("-" * 70)

    # ========================================================
    # FINAL METRICS
    # ========================================================

    accuracy = (
        correct / total * 100
        if total > 0
        else 0
    )

    stop_rate = (
        stopped_count / total * 100
        if total > 0
        else 0
    )

    max_token_rate = (
        max_token_count / total * 100
        if total > 0
        else 0
    )

    avg_tokens = (
        total_tokens / total
        if total > 0
        else 0
    )

    avg_time = (
        total_time / total
        if total > 0
        else 0
    )

    overall_speed = (
        total_tokens / total_time
        if total_time > 0
        else 0
    )

    # ========================================================
    # PRINT REPORT
    # ========================================================

    print()
    print("=" * 70)
    print("EVALUATION COMPLETE")
    print("=" * 70)

    print(f"Total Evaluated:        {total}")
    print(
        f"Correct:                {correct}/{total}"
    )
    print(
        f"Accuracy:               {accuracy:.2f}%"
    )

    print()
    print("GENERATION")
    print("-" * 70)

    print(
        f"Average tokens:         {avg_tokens:.2f}"
    )

    print(
        f"Average time/example:   {avg_time:.2f}s"
    )

    print(
        f"Overall generation:     {overall_speed:.2f} tok/s"
    )

    print()
    print("STOP TOKEN")
    print("-" * 70)

    print(
        f"Stopped at <|end|>:     "
        f"{stopped_count}/{total} ({stop_rate:.2f}%)"
    )

    print(
        f"Hit max token limit:    "
        f"{max_token_count}/{total} ({max_token_rate:.2f}%)"
    )

    # ========================================================
    # SUBJECT
    # ========================================================

    print()
    print("SUBJECT-WISE ACCURACY")
    print("-" * 70)

    for subject in sorted(subject_stats):

        stats = subject_stats[subject]

        subject_accuracy = (
            stats["correct"]
            / stats["total"]
            * 100
        )

        print(
            f"{subject:20s} "
            f"{stats['correct']:4d}/"
            f"{stats['total']:4d} "
            f"({subject_accuracy:6.2f}%)"
        )

    # ========================================================
    # DIFFICULTY
    # ========================================================

    print()
    print("DIFFICULTY-WISE ACCURACY")
    print("-" * 70)

    for difficulty in sorted(difficulty_stats):

        stats = difficulty_stats[difficulty]

        difficulty_accuracy = (
            stats["correct"]
            / stats["total"]
            * 100
        )

        print(
            f"{difficulty:20s} "
            f"{stats['correct']:4d}/"
            f"{stats['total']:4d} "
            f"({difficulty_accuracy:6.2f}%)"
        )

    print()
    print("=" * 70)

    print(
        f"Predictions saved to:\n{OUTPUT_PATH}"
    )

    print("=" * 70)


if __name__ == "__main__":
    main()