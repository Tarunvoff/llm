"""Learner State Management with Bayesian Knowledge Tracing integration.

Tracks per-student concept mastery, interaction timelines, and remediation status.
Enforces the architectural invariant that mastery states are exclusively computed
via deterministic BKT mathematics.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional

from tutor.bkt.model import BKTModel, BKTParameters
from tutor.bkt.prerequisite_graph import PrerequisiteGraph

logger = logging.getLogger(__name__)


@dataclass
class InteractionRecord:
    """Log record of a single student-tutor turn."""

    timestamp: str
    concept_id: str
    student_utterance: str
    detected_intent: str
    is_correct: Optional[bool]
    mastery_before: float
    mastery_after: float
    strategy_used: str
    tutor_response: str


@dataclass
class StudentProfile:
    """Stateful profile of an individual student."""

    student_id: str
    mastery_map: Dict[str, float] = field(default_factory=dict)
    consecutive_failures: Dict[str, int] = field(default_factory=dict)
    history: List[InteractionRecord] = field(default_factory=list)
    active_remediation_target: Optional[str] = None


class LearnerStateManager:
    """Manages student profiles, BKT updates, and curriculum sequencing."""

    def __init__(
        self,
        bkt_model: Optional[BKTModel] = None,
        prereq_graph: Optional[PrerequisiteGraph] = None,
    ):
        self.bkt = bkt_model or BKTModel()
        self.prereq_graph = prereq_graph or PrerequisiteGraph()
        self.profiles: Dict[str, StudentProfile] = {}

    def get_or_create_student(self, student_id: str) -> StudentProfile:
        """Retrieves an existing student profile or initializes a new one."""
        if student_id not in self.profiles:
            self.profiles[student_id] = StudentProfile(student_id=student_id)
        return self.profiles[student_id]

    def get_concept_mastery(self, student_id: str, concept_id: str) -> float:
        """Gets the estimated mastery probability for a specific concept."""
        profile = self.get_or_create_student(student_id)
        if concept_id not in profile.mastery_map:
            params = self.bkt.get_parameters(concept_id)
            profile.mastery_map[concept_id] = params.p_init
        return profile.mastery_map[concept_id]

    def record_interaction_and_update(
        self,
        student_id: str,
        concept_id: str,
        student_utterance: str,
        detected_intent: str,
        is_correct: Optional[bool],
        strategy_used: str,
        tutor_response: str,
    ) -> float:
        """Deterministically updates BKT mastery state and logs the interaction.

        Args:
            student_id: Student identifier.
            concept_id: Active curriculum concept.
            student_utterance: Raw student input text.
            detected_intent: Intent/error category from classifier.
            is_correct: True/False/None (None for pure clarification/greeting).
            strategy_used: Pedagogical strategy applied.
            tutor_response: Generated tutor response.

        Returns:
            Updated mastery probability.
        """
        profile = self.get_or_create_student(student_id)
        p_before = self.get_concept_mastery(student_id, concept_id)

        p_after = p_before
        if is_correct is not None:
            p_after = self.bkt.update_mastery(p_before, is_correct, concept_id)
            profile.mastery_map[concept_id] = p_after

            # Track consecutive failures for scaffolding escalation
            if not is_correct:
                profile.consecutive_failures[concept_id] = (
                    profile.consecutive_failures.get(concept_id, 0) + 1
                )
            else:
                profile.consecutive_failures[concept_id] = 0

        # Check prerequisite gaps if student struggled
        unmastered_prereqs = self.prereq_graph.find_unmastered_prerequisites(
            concept_id, profile.mastery_map
        )
        if unmastered_prereqs and (is_correct is False or self.bkt.needs_remediation(p_after, concept_id)):
            profile.active_remediation_target = unmastered_prereqs[0]
        else:
            profile.active_remediation_target = None

        record = InteractionRecord(
            timestamp=datetime.now(timezone.utc).isoformat(),
            concept_id=concept_id,
            student_utterance=student_utterance,
            detected_intent=detected_intent,
            is_correct=is_correct,
            mastery_before=p_before,
            mastery_after=p_after,
            strategy_used=strategy_used,
            tutor_response=tutor_response,
        )
        profile.history.append(record)
        return p_after

    def get_summary(self, student_id: str, target_concept_id: str) -> Dict[str, Any]:
        """Provides a structured learner state summary for pedagogical prompt construction."""
        profile = self.get_or_create_student(student_id)
        current_mastery = self.get_concept_mastery(student_id, target_concept_id)
        failures = profile.consecutive_failures.get(target_concept_id, 0)
        unmastered_prereqs = self.prereq_graph.find_unmastered_prerequisites(
            target_concept_id, profile.mastery_map
        )

        return {
            "student_id": student_id,
            "target_concept": target_concept_id,
            "current_mastery": round(current_mastery, 4),
            "is_mastered": self.bkt.is_mastered(current_mastery, target_concept_id),
            "consecutive_failures": failures,
            "unmastered_prerequisites": unmastered_prereqs,
            "active_remediation": profile.active_remediation_target,
            "total_turns": len(profile.history),
        }
