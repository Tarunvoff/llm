"""Unit tests for lightweight intent and error classifier."""

import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from tutor.classifier.intent_classifier import IntentClassifier


def test_classify_direct_answer_request():
    classifier = IntentClassifier()
    res = classifier.classify("Can you just tell me the answer directly?")
    assert res.intent == "request_direct_answer"
    assert res.suggested_strategy == "socratic_scaffolding"


def test_classify_hint_request():
    classifier = IntentClassifier()
    res = classifier.classify("I need a hint to get started.")
    assert res.intent == "request_hint"
    assert res.suggested_strategy == "provide_hint"


def test_classify_confusion():
    classifier = IntentClassifier()
    res = classifier.classify("I don't understand this step at all, I'm completely lost.")
    assert res.intent == "confused"
    assert res.is_correct is False
