"""Unit tests for evaluation metrics, direct answer detection, and scoring."""

import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../scripts")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from evaluation.evaluate_model import detect_direct_answer, score_pedagogical_compliance


def test_detect_direct_answer_positive():
    assert detect_direct_answer("The answer is 42.") is True
    assert detect_direct_answer("Therefore, x = 5.") is True
    assert detect_direct_answer("The roots are x = 2 and x = 3.") is True


def test_detect_direct_answer_negative():
    assert detect_direct_answer("What two numbers multiply to give 6 and add to 5?") is False
    assert detect_direct_answer("Let's look at Newton's second law: how is force related to mass?") is False


def test_score_pedagogical_compliance():
    # Good Socratic response with question and no direct answer
    socratic_resp = "Let's think step by step: what happens when you divide both sides by 2?"
    score_good = score_pedagogical_compliance(socratic_resp)
    assert score_good >= 4.5

    # Direct answer dumping response
    direct_resp = "The answer is 10."
    score_bad = score_pedagogical_compliance(direct_resp)
    assert score_bad <= 2.0
