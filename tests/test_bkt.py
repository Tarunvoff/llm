"""Unit tests for deterministic Bayesian Knowledge Tracing."""

import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from tutor.bkt.model import BKTModel, BKTParameters
from tutor.bkt.learner_state import LearnerStateManager


def test_bkt_parameter_validation():
    params = BKTParameters(p_init=0.2, p_transit=0.1, p_guess=0.2, p_slip=0.1)
    params.validate()

    with pytest.raises(ValueError):
        invalid = BKTParameters(p_init=1.5)
        invalid.validate()


def test_bkt_correct_update_increases_mastery():
    bkt = BKTModel()
    p0 = 0.20
    p1 = bkt.update_mastery(p0, is_correct=True)
    assert p1 > p0, f"Expected mastery to increase on correct answer, got {p1} <= {p0}"


def test_bkt_incorrect_update_decreases_mastery():
    bkt = BKTModel()
    p0 = 0.80
    p1 = bkt.update_mastery(p0, is_correct=False)
    assert p1 < p0, f"Expected mastery to decrease on incorrect answer, got {p1} >= {p0}"


def test_bkt_convergence_to_mastery():
    bkt = BKTModel()
    p = 0.10
    # Simulate a streak of correct answers
    for _ in range(8):
        p = bkt.update_mastery(p, is_correct=True)
    assert bkt.is_mastered(p) is True
    assert p >= 0.85


def test_learner_state_manager_persists_state():
    manager = LearnerStateManager()
    student_id = "student_test_1"
    concept_id = "quad_factoring"

    initial_p = manager.get_concept_mastery(student_id, concept_id)
    assert initial_p == 0.10

    # Record correct turn
    new_p = manager.record_interaction_and_update(
        student_id=student_id,
        concept_id=concept_id,
        student_utterance="x = 2 and x = 3",
        detected_intent="correct_understanding",
        is_correct=True,
        strategy_used="socratic_scaffolding",
        tutor_response="Great job!",
    )
    assert new_p > initial_p
    summary = manager.get_summary(student_id, concept_id)
    assert summary["current_mastery"] == round(new_p, 4)
    assert summary["total_turns"] == 1
