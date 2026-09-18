#!/usr/bin/env python3
"""
Evaluate Vidhya 2.0 LoRA adapter on the held-out test dataset.

This script:
1. Loads Aryabhata 2.0 base model
2. Loads the trained Vidhya 2.0 LoRA adapter
3. Loads the tokenized test dataset
4. Reconstructs the user question from the original dataset
5. Generates an answer for every test example
6. Stops generation at <|end|>
7. Saves predictions to JSONL
8. Reports basic generation statistics

Usage:

python scripts/evaluation/evaluate_test.py
"""

import os
import sys
import json
import time
import argparse

import torch
from datasets import load_from_disk

# ---------------------------------------------------------
# PROJECT PATH
# ---------------------------------------------------------

PROJECT_ROOT = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../.."
    )
)

SRC_PATH = os.path.join(PROJECT_ROOT, "src")

sys.path.insert(0, SRC_PATH)

from tutor.model.loader import load_model_and_tokenizer


# ---------------------------------------------------------
# DEFAULT CONFIG
# ---------------------------------------------------------

DEFAULT_MODEL = "PhysicsWallahAI/Aryabhata-2.0"

DEFAULT_ADAPTER = (
    "outputs/vidhya2_reasoning_sft/final_adapter"
)

DEFAULT_TEST_DATA = (
    "data/sft/v2_reasoning_boost/tokenized/test"
)

DEFAULT_OUTPUT = (
    "outputs/vidhya2_evaluation/test_predictions.jsonl"
)


# ---------------------------------------------------------
# LOAD ORIGINAL DATA
# ---------------------------------------------------------

def load_original_test_data():

    # The tokenized dataset contains the final model inputs,
    # but for evaluation we need the original question and
    # reference answer.
    #
    # Change this path if your original test dataset is stored
    # somewhere else.

    possible_paths = [

        "data/sft/v2_reasoning_boost/test",

        "data/sft/v2_reasoning_boost/raw/test",

        "data/sft/v2_reasoning_boost",

    ]

    for path in possible_paths:

        if os.path.exists(path):

            try:

                dataset = load_from_disk(path)

                print(
                    f"Original test dataset found at: {path}"
                )

                return dataset

            except Exception:
                pass

    return None


# ---------------------------------------------------------
# EXTRACT QUESTION / ANSWER
# ---------------------------------------------------------

def extract_question(example):

    """
    Try to find the question field in different possible
    dataset formats.
    """

    possible_fields = [
        "question",
        "prompt",
        "instruction",
        "input",
        "problem",
    ]

    for field in possible_fields:

        if field in example:

            value = example[field]

            if value is not None:

                return str(value).strip()

    # Some instruction datasets may have messages.

    if "messages" in example:

        messages = example["messages"]

        if messages:

            for message in messages:

                if message.get("role") == "user":

                    return str(
                        message.get("content", "")
                    ).strip()

    raise ValueError(
        "Could not find question field in dataset example."
    )


def extract_reference_answer(example):

    """
    Try to find the reference/final answer field.
    """

    possible_fields = [
        "final_answer",
        "answer",
        "output",
        "response",
        "solution",
        "target",
    ]

    for field in possible_fields:

        if field in example:

            value = example[field]

            if value is not None:

                return str(value).strip()

    # Messages format

    if "messages" in example:

        messages = example["messages"]

        if messages:

            for message in reversed(messages):

                if message.get("role") == "assistant":

                    content = message.get(
                        "content",
                        ""
                    )

                    return str(content).strip()

    return ""


# ---------------------------------------------------------
# BUILD CHAT INPUT
# ---------------------------------------------------------

def build_prompt(tokenizer, question):

    messages = [
        {
            "role": "user",
            "content": question,
        }
    ]

    if hasattr(
        tokenizer,
        "apply_chat_template"
    ):

        inputs = tokenizer.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt",
        )

    else:

        inputs = tokenizer(
            question,
            return_tensors="pt",
        )

    return inputs


# ---------------------------------------------------------
# MAIN
# ---------------------------------------------------------

def main():

    parser = argparse.ArgumentParser(
        description=(
            "Evaluate Vidhya 2.0 on the held-out "
            "test dataset."
        )
    )

    parser.add_argument(
        "--model",
        type=str,
        default=DEFAULT_MODEL,
    )

    parser.add_argument(
        "--adapter",
        type=str,
        default=DEFAULT_ADAPTER,
    )

    parser.add_argument(
        "--test-data",
        type=str,
        default=DEFAULT_TEST_DATA,
    )

    parser.add_argument(
        "--output",
        type=str,
        default=DEFAULT_OUTPUT,
    )

    parser.add_argument(
        "--max-new-tokens",
        type=int,
        default=512,
    )

    parser.add_argument(
        "--temperature",
        type=float,
        default=0.0,
    )

    parser.add_argument(
        "--top-p",
        type=float,
        default=1.0,
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Evaluate only first N examples.",
    )

    args = parser.parse_args()

    # -----------------------------------------------------
    # DEVICE
    # -----------------------------------------------------

    print("=" * 70)
    print("Vidhya 2.0 Test Set Evaluation")
    print("=" * 70)

    print(
        f"Model:   {args.model}"
    )

    print(
        f"Adapter: {args.adapter}"
    )

    print(
        f"Test:    {args.test_data}"
    )

    print("=" * 70)

    # -----------------------------------------------------
    # LOAD MODEL
    # -----------------------------------------------------

    print("\nLoading model...")

    load_start = time.time()

    model, tokenizer = load_model_and_tokenizer(
        model_name_or_path=args.model,
        torch_dtype="bfloat16",
        use_4bit=False,
        adapter_path=args.adapter,
    )

    load_time = time.time() - load_start

    print(
        f"Model loaded in {load_time:.2f} seconds."
    )

    # -----------------------------------------------------
    # DEVICE
    # -----------------------------------------------------

    device = next(
        model.parameters()
    ).device

    print(
        f"Model device: {device}"
    )

    # -----------------------------------------------------
    # LOAD TEST DATA
    # -----------------------------------------------------

    print("\nLoading test dataset...")

    test_dataset = load_from_disk(
        args.test_data
    )

    print(
        f"Test examples: {len(test_dataset)}"
    )

    # -----------------------------------------------------
    # ORIGINAL DATASET
    # -----------------------------------------------------

    original_dataset = load_original_test_data()

    if original_dataset is not None:

        print(
            f"Original dataset examples: "
            f"{len(original_dataset)}"
        )

        if len(original_dataset) != len(test_dataset):

            print(
                "WARNING: Original and tokenized "
                "dataset sizes differ."
            )

    else:

        print(
            "\nWARNING:"
        )

        print(
            "Original test dataset was not found."
        )

        print(
            "The script will attempt to recover "
            "questions from the tokenized data."
        )

    # -----------------------------------------------------
    # STOP TOKEN
    # -----------------------------------------------------

    stop_token_id = tokenizer.convert_tokens_to_ids(
        "<|end|>"
    )

    if stop_token_id is None:

        raise RuntimeError(
            "Could not find <|end|> token."
        )

    print(
        f"\nStop token: <|end|> "
        f"(ID={stop_token_id})"
    )

    print(
        f"Tokenizer EOS: "
        f"{tokenizer.eos_token} "
        f"(ID={tokenizer.eos_token_id})"
    )

    # -----------------------------------------------------
    # OUTPUT DIRECTORY
    # -----------------------------------------------------

    output_path = os.path.abspath(
        os.path.join(
            PROJECT_ROOT,
            args.output
        )
    )

    os.makedirs(
        os.path.dirname(output_path),
        exist_ok=True
    )

    print(
        f"\nOutput: {output_path}"
    )

    # -----------------------------------------------------
    # NUMBER OF EXAMPLES
    # -----------------------------------------------------

    total_examples = len(test_dataset)

    if args.limit is not None:

        total_examples = min(
            total_examples,
            args.limit
        )

    print(
        f"\nEvaluating {total_examples} examples..."
    )

    # -----------------------------------------------------
    # STATISTICS
    # -----------------------------------------------------

    total_generation_time = 0.0
    total_generated_tokens = 0

    stopped_count = 0

    # -----------------------------------------------------
    # OPEN OUTPUT
    # -----------------------------------------------------

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as output_file:

        # -------------------------------------------------
        # LOOP
        # -------------------------------------------------

        for index in range(total_examples):

            example = test_dataset[index]

            # ---------------------------------------------
            # QUESTION
            # ---------------------------------------------

            question = ""

            reference_answer = ""

            if original_dataset is not None:

                original_example = (
                    original_dataset[index]
                )

                try:

                    question = extract_question(
                        original_example
                    )

                except Exception:

                    question = ""

                try:

                    reference_answer = (
                        extract_reference_answer(
                            original_example
                        )
                    )

                except Exception:

                    reference_answer = ""

            # ---------------------------------------------
            # FALLBACK: TOKENIZED DATA
            # ---------------------------------------------

            if not question:

                # We can decode the tokenized sequence,
                # but this is only a fallback because it
                # contains Harmony control tokens and
                # training content.

                input_ids = example["input_ids"]

                decoded = tokenizer.decode(
                    input_ids,
                    skip_special_tokens=False
                )

                question = decoded

            # ---------------------------------------------
            # BUILD PROMPT
            # ---------------------------------------------

            inputs = build_prompt(
                tokenizer,
                question
            )

            # ---------------------------------------------
            # MOVE TO GPU
            # ---------------------------------------------

            if isinstance(
                inputs,
                torch.Tensor
            ):

                inputs = {
                    "input_ids": inputs.to(device)
                }

            else:

                inputs = {
                    key: value.to(device)
                    for key, value in inputs.items()
                }

            prompt_len = (
                inputs["input_ids"]
                .shape[1]
            )

            # ---------------------------------------------
            # GENERATE
            # ---------------------------------------------

            generation_start = time.time()

            with torch.no_grad():

                output_ids = model.generate(

                    **inputs,

                    max_new_tokens=(
                        args.max_new_tokens
                    ),

                    temperature=(
                        args.temperature
                    ),

                    top_p=args.top_p,

                    # Greedy generation when
                    # temperature = 0.
                    do_sample=(
                        args.temperature > 0
                    ),

                    pad_token_id=(
                        tokenizer.pad_token_id
                    ),

                    eos_token_id=(
                        stop_token_id
                    ),
                )

            generation_time = (
                time.time()
                - generation_start
            )

            # ---------------------------------------------
            # GENERATED TOKENS
            # ---------------------------------------------

            generated_ids = (
                output_ids[
                    0,
                    prompt_len:
                ]
            )

            generated_token_count = (
                len(generated_ids)
            )

            # ---------------------------------------------
            # CHECK STOP
            # ---------------------------------------------

            stopped = (
                stop_token_id
                in generated_ids.tolist()
            )

            if stopped:

                stopped_count += 1

            # ---------------------------------------------
            # DECODE
            # ---------------------------------------------

            model_answer = tokenizer.decode(
                generated_ids,
                skip_special_tokens=True,
            ).strip()

            # ---------------------------------------------
            # SPEED
            # ---------------------------------------------

            if generation_time > 0:

                tokens_per_second = (
                    generated_token_count
                    / generation_time
                )

            else:

                tokens_per_second = 0.0

            # ---------------------------------------------
            # RESULT
            # ---------------------------------------------

            result = {

                "index": index,

                "question": question,

                "reference_answer": (
                    reference_answer
                ),

                "model_answer": model_answer,

                "generated_tokens": (
                    generated_token_count
                ),

                "generation_time_seconds": (
                    round(
                        generation_time,
                        3
                    )
                ),

                "tokens_per_second": (
                    round(
                        tokens_per_second,
                        2
                    )
                ),

                "stopped_at_end": stopped,

                "stop_token_id": (
                    stop_token_id
                ),
            }

            # ---------------------------------------------
            # WRITE JSONL
            # ---------------------------------------------

            output_file.write(
                json.dumps(
                    result,
                    ensure_ascii=False
                )
                + "\n"
            )

            output_file.flush()

            # ---------------------------------------------
            # PROGRESS
            # ---------------------------------------------

            print(
                f"[{index + 1:4d}/{total_examples}] "
                f"{generation_time:6.2f}s | "
                f"{generated_token_count:4d} tok | "
                f"{tokens_per_second:6.2f} tok/s | "
                f"stop={'YES' if stopped else 'NO'}"
            )

            # ---------------------------------------------
            # PERIODIC SAMPLE
            # ---------------------------------------------

            if (
                index < 3
                or (index + 1) % 50 == 0
            ):

                print(
                    "\nQuestion:"
                )

                print(
                    question[:500]
                )

                print(
                    "\nModel answer:"
                )

                print(
                    model_answer[:1000]
                )

                if reference_answer:

                    print(
                        "\nReference:"
                    )

                    print(
                        reference_answer[:1000]
                    )

                print(
                    "-" * 70
                )

            # ---------------------------------------------
            # UPDATE STATS
            # ---------------------------------------------

            total_generation_time += (
                generation_time
            )

            total_generated_tokens += (
                generated_token_count
            )

    # -----------------------------------------------------
    # FINAL STATISTICS
    # -----------------------------------------------------

    print("\n")
    print("=" * 70)
    print("EVALUATION COMPLETE")
    print("=" * 70)

    print(
        f"Examples evaluated: {total_examples}"
    )

    print(
        f"Stopped at <|end|>: "
        f"{stopped_count}/{total_examples}"
    )

    if total_examples > 0:

        stop_rate = (
            stopped_count
            / total_examples
            * 100
        )

        print(
            f"Stop rate: {stop_rate:.2f}%"
        )

    print(
        f"Total generation time: "
        f"{total_generation_time:.2f} seconds"
    )

    print(
        f"Total generated tokens: "
        f"{total_generated_tokens}"
    )

    if total_generation_time > 0:

        overall_speed = (
            total_generated_tokens
            / total_generation_time
        )

        print(
            f"Overall generation speed: "
            f"{overall_speed:.2f} tokens/sec"
        )

    print(
        f"\nPredictions saved to:"
    )

    print(
        output_path
    )

    print("=" * 70)


if __name__ == "__main__":
    main()