"""Unit tests for dataset schema validation and leakage detection."""

import os
import sys
import pytest

# Ensure scripts and src are accessible
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../scripts")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from data.validate_dataset import (
    validate_sft_example,
    validate_dpo_example,
    check_leakage_and_duplicates,
)


def test_valid_sft_example():
    valid_example = {
        "messages": [
            {"role": "user", "content": "How do I solve 2x = 6?"},
            {"role": "assistant", "content": "What operation is the opposite of multiplying by 2?"},
        ],
        "metadata": {
            "subject": "Mathematics",
            "grade": 8,
            "concept": "Linear Equations",
        },
    }
    is_valid, errors = validate_sft_example(valid_example, 1)
    assert is_valid is True
    assert len(errors) == 0


def test_invalid_sft_missing_messages():
    invalid_example = {
        "metadata": {"subject": "Physics", "grade": 10, "concept": "Force"}
    }
    is_valid, errors = validate_sft_example(invalid_example, 1)
    assert is_valid is False
    assert any("Missing 'messages'" in e for e in errors)


def test_invalid_sft_empty_content():
    invalid_example = {
        "messages": [
            {"role": "user", "content": "   "},
            {"role": "assistant", "content": "Valid response"},
        ],
        "metadata": {"subject": "Physics", "grade": 10, "concept": "Force"},
    }
    is_valid, errors = validate_sft_example(invalid_example, 1)
    assert is_valid is False
    assert any("Content is empty" in e for e in errors)


def test_valid_dpo_example():
    valid_dpo = {
        "prompt": "Student: What is the area of a circle?",
        "chosen": "What formula connects radius r to area?",
        "rejected": "The area is pi * r^2.",
    }
    is_valid, errors = validate_dpo_example(valid_dpo, 1)
    assert is_valid is True
    assert len(errors) == 0


def test_invalid_dpo_identical_chosen_rejected():
    invalid_dpo = {
        "prompt": "Student: What is the formula for force?",
        "chosen": "F = m * a",
        "rejected": "F = m * a",
    }
    is_valid, errors = validate_dpo_example(invalid_dpo, 1)
    assert is_valid is False
    assert any("identical" in e for e in errors)


def test_leakage_detection():
    train_set = [
        {
            "messages": [
                {"role": "user", "content": "Can you solve x + 2 = 5?"},
                {"role": "assistant", "content": "What is 5 minus 2?"},
            ],
            "metadata": {"conversation_id": "conv_001"},
        }
    ]
    val_set = [
        {
            "messages": [
                {"role": "user", "content": "Can you solve x + 2 = 5?"},
                {"role": "assistant", "content": "Subtract 2 from both sides."},
            ],
            "metadata": {"conversation_id": "conv_002"},
        }
    ]

    leak_ok, errors = check_leakage_and_duplicates(train_set, val_set, is_dpo=False)
    assert leak_ok is False
    assert any("Data leakage" in e for e in errors)


def test_conversation_leakage_detection():
    train_set = [
        {
            "messages": [
                {"role": "user", "content": "Turn 1 in train"},
                {"role": "assistant", "content": "Response 1"},
            ],
            "metadata": {"conversation_id": "shared_conv_123"},
        }
    ]
    val_set = [
        {
            "messages": [
                {"role": "user", "content": "Turn 2 in val"},
                {"role": "assistant", "content": "Response 2"},
            ],
            "metadata": {"conversation_id": "shared_conv_123"},
        }
    ]

    leak_ok, errors = check_leakage_and_duplicates(train_set, val_set, is_dpo=False)
    assert leak_ok is False
    assert any("Conversation leakage" in e for e in errors)
