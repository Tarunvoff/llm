"""Lightweight Intent and Error-Type Classifier.

Classifies student input into tutoring states:
- correct_understanding
- partial_understanding
- misconception
- missing_prerequisite
- confused
- request_hint
- request_direct_answer
- conceptual_question
- procedural_question

Designed as a modular, lightweight component independent of the main generation LLM.
"""

from dataclasses import dataclass
import logging
import re
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class ClassificationResult:
    """Structured output of the lightweight classifier."""

    intent: str
    confidence: float
    is_correct: Optional[bool]
    detected_misconception: Optional[str] = None
    suggested_strategy: str = "socratic_scaffolding"
    explanation: str = ""


class IntentClassifier:
    """Rule-based and pattern-matching lightweight pedagogical intent classifier."""

    DIRECT_ANSWER_PATTERNS = [
        r"\b(just tell me|give me the answer|what is the answer|what's the answer|solve it for me|write it down|tell me the roots|don't make me calculate)\b",
        r"\b(can you solve|solve this for me|give me the final answer)\b",
    ]

    HINT_PATTERNS = [
        r"\b(hint|clue|give me a hint|guide me|how do i start|i need help|where do i begin)\b",
    ]

    CONFUSION_PATTERNS = [
        r"\b(i am confused|i don't understand|i don't get it|lost|makes no sense|idk|i don't know)\b",
    ]

    def __init__(self):
        self._compiled_direct = [re.compile(p, re.IGNORECASE) for p in self.DIRECT_ANSWER_PATTERNS]
        self._compiled_hint = [re.compile(p, re.IGNORECASE) for p in self.HINT_PATTERNS]
        self._compiled_confusion = [re.compile(p, re.IGNORECASE) for p in self.CONFUSION_PATTERNS]

    def classify(
        self,
        utterance: str,
        context_history: Optional[List[Dict[str, str]]] = None,
        target_concept: Optional[str] = None,
    ) -> ClassificationResult:
        """Classifies a student utterance into pedagogical state and correctness signal."""
        text = utterance.strip()

        # 1. Direct answer request check
        for pattern in self._compiled_direct:
            if pattern.search(text):
                return ClassificationResult(
                    intent="request_direct_answer",
                    confidence=0.95,
                    is_correct=None,
                    suggested_strategy="socratic_scaffolding",
                    explanation="Student explicitly requested direct solution; pedagogical withholding required.",
                )

        # 2. Hint request check
        for pattern in self._compiled_hint:
            if pattern.search(text):
                return ClassificationResult(
                    intent="request_hint",
                    confidence=0.90,
                    is_correct=None,
                    suggested_strategy="provide_hint",
                    explanation="Student requested a hint or starting point.",
                )

        # 3. Confusion check
        for pattern in self._compiled_confusion:
            if pattern.search(text):
                return ClassificationResult(
                    intent="confused",
                    confidence=0.85,
                    is_correct=False,
                    suggested_strategy="diagnose_prerequisite",
                    explanation="Student expressed confusion; check prerequisite knowledge.",
                )

        # 4. Math / Science statement classification
        lower_text = text.lower()
        if "?" in text and len(text.split()) > 4:
            return ClassificationResult(
                intent="conceptual_question",
                confidence=0.80,
                is_correct=None,
                suggested_strategy="socratic_scaffolding",
                explanation="Student asked a conceptual question.",
            )

        # Default heuristic classification
        return ClassificationResult(
            intent="partial_understanding",
            confidence=0.70,
            is_correct=None,
            suggested_strategy="socratic_scaffolding",
            explanation="General student dialogue turn.",
        )
