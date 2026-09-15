"""Unit tests for integrated end-to-end Pedagogical Tutor Pipeline."""

import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from tutor.pipeline import PedagogicalTutorPipeline


def test_pipeline_step_turn():
    pipeline = PedagogicalTutorPipeline()

    student_id = "student_integration_01"
    concept = "Newton's Second Law"
    utterance = "Can you give me a hint on how to connect force and acceleration?"

    res = pipeline.step(
        student_id=student_id,
        student_utterance=utterance,
        target_concept=concept,
        subject="Physics",
    )

    assert res.student_id == student_id
    assert res.target_concept == concept
    assert res.detected_intent in ["request_hint", "conceptual_question", "partial_understanding"]
    assert res.strategy_used in ["provide_hint", "socratic_scaffolding"]
    assert isinstance(res.tutor_response, str)
    assert len(res.tutor_response) > 0
    assert res.mastery_after >= 0.0


def test_pipeline_consecutive_failure_escalation():
    pipeline = PedagogicalTutorPipeline()
    student_id = "student_struggling_02"
    concept = "Stoichiometry"

    # Simulate 3 consecutive confused / failure interactions
    for _ in range(3):
        res = pipeline.step(
            student_id=student_id,
            student_utterance="I don't understand, I am completely lost.",
            target_concept=concept,
            subject="Chemistry",
        )

    # 4th turn: Requesting answer after 3 consecutive failures should escalate to answer_reveal
    res_final = pipeline.step(
        student_id=student_id,
        student_utterance="Just tell me the answer please.",
        target_concept=concept,
        subject="Chemistry",
    )

    assert res_final.strategy_used == "answer_reveal"
