"""Unit tests for Pedagogical Prompt Builder."""

import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from tutor.pedagogy.prompt_builder import PedagogicalPromptBuilder
from tutor.rag.retriever import RetrievedChunk


def test_prompt_builder_structure():
    builder = PedagogicalPromptBuilder()

    learner_state = {
        "target_concept": "Quadratic Equations",
        "current_mastery": 0.35,
        "consecutive_failures": 2,
        "unmastered_prerequisites": ["Linear Equations"],
        "active_remediation": "Linear Equations",
    }

    retrieved = [
        RetrievedChunk(
            chunk_id="chk_001",
            text="Quadratic equations are of the form ax^2 + bx + c = 0.",
            source="NCERT Math Class 10",
        )
    ]

    messages = builder.build_prompt(
        student_question="How do I find roots?",
        learner_state=learner_state,
        retrieved_chunks=retrieved,
        strategy="diagnose_prerequisite",
    )

    assert len(messages) >= 2
    assert messages[0]["role"] == "system"
    assert messages[-1]["role"] == "user"
    assert messages[-1]["content"] == "How do I find roots?"

    system_content = messages[0]["content"]
    assert "LEARNER MASTERY STATE" in system_content
    assert "Quadratic Equations" in system_content
    assert "Linear Equations" in system_content
    assert "RETRIEVED CURRICULUM CONTEXT" in system_content
    assert "NCERT Math Class 10" in system_content
