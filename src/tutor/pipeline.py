"""End-to-End Pedagogically Aligned AI Tutor Pipeline.

Coordinates:
Student -> Intent Classifier -> BKT & Prerequisite Lookup -> RAG Retrieval ->
Prompt Constructor -> Qwen Model -> Tutor Response -> Evaluation -> BKT Update.
"""

from dataclasses import dataclass, field
import logging
from typing import Any, Dict, List, Optional

from tutor.bkt.learner_state import LearnerStateManager
from tutor.bkt.model import BKTModel
from tutor.bkt.prerequisite_graph import PrerequisiteGraph
from tutor.classifier.intent_classifier import IntentClassifier
from tutor.model.inference import TutorGenerationConfig, TutorGenerator
from tutor.pedagogy.prompt_builder import PedagogicalPromptBuilder
from tutor.rag.pipeline import CurriculumRAG
from tutor.rag.retriever import RetrievedChunk

logger = logging.getLogger(__name__)


@dataclass
class TutorTurnResult:
    """Structured output returned by the tutoring pipeline for every student turn."""

    student_id: str
    target_concept: str
    student_utterance: str
    detected_intent: str
    strategy_used: str
    tutor_response: str
    mastery_before: float
    mastery_after: float
    is_mastered: bool
    retrieved_sources: List[Dict[str, Any]] = field(default_factory=list)
    active_remediation: Optional[str] = None
    evaluation_metadata: Dict[str, Any] = field(default_factory=dict)


class PedagogicalTutorPipeline:
    """Integrated tutoring runtime managing all three decoupled responsibility layers."""

    def __init__(
        self,
        rag_pipeline: Optional[CurriculumRAG] = None,
        learner_manager: Optional[LearnerStateManager] = None,
        classifier: Optional[IntentClassifier] = None,
        prompt_builder: Optional[PedagogicalPromptBuilder] = None,
        generator: Optional[TutorGenerator] = None,
    ):
        self.rag = rag_pipeline or CurriculumRAG()
        self.learner_manager = learner_manager or LearnerStateManager()
        self.classifier = classifier or IntentClassifier()
        self.prompt_builder = prompt_builder or PedagogicalPromptBuilder()
        self.generator = generator

    def step(
        self,
        student_id: str,
        student_utterance: str,
        target_concept: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        gen_config: Optional[TutorGenerationConfig] = None,
        subject: Optional[str] = None,
    ) -> TutorTurnResult:
        """Executes a complete single-turn interaction cycle.

        1. Intent & Error Classification
        2. Learner Mastery State & Prerequisite Lookup
        3. Curriculum Grounding (RAG)
        4. Strategy Selection
        5. Pedagogical Prompt Construction
        6. Language Model Generation
        7. Deterministic BKT State Update
        """
        # Step 1: Lightweight Intent / Error Classification
        class_res = self.classifier.classify(
            utterance=student_utterance,
            context_history=conversation_history,
            target_concept=target_concept,
        )

        # Step 2: Retrieve current learner state
        learner_summary = self.learner_manager.get_summary(student_id, target_concept)
        mastery_before = learner_summary["current_mastery"]
        failures = learner_summary["consecutive_failures"]

        # Step 3: Determine Pedagogical Strategy
        if failures >= 3 and class_res.intent in ["confused", "request_direct_answer"]:
            strategy = "answer_reveal"
        elif learner_summary["active_remediation"] is not None:
            strategy = "diagnose_prerequisite"
        elif class_res.suggested_strategy:
            strategy = class_res.suggested_strategy
        else:
            strategy = "socratic_scaffolding"

        # Step 4: Curriculum Retrieval Grounding (WHAT layer)
        query_text = f"{target_concept} {student_utterance}"
        retrieved_chunks = self.rag.query(query_text, top_k=2, subject_filter=subject)

        # Step 5: Pedagogical Prompt Construction
        messages = self.prompt_builder.build_prompt(
            student_question=student_utterance,
            conversation_history=conversation_history,
            learner_state=learner_summary,
            retrieved_chunks=retrieved_chunks,
            strategy=strategy,
            detected_intent=class_res.intent,
        )

        # Step 6: Model Generation (HOW layer)
        if self.generator is not None:
            tutor_response = self.generator.generate_chat(messages, config=gen_config)
        else:
            # Deterministic fallback response template for testing without full LLM weights
            if strategy == "provide_hint":
                tutor_response = f"Here is a hint for {target_concept}: remember the core relationship between the terms before calculating."
            elif strategy == "diagnose_prerequisite":
                remed = learner_summary.get("active_remediation", "the basics")
                tutor_response = f"Before we solve this, let's check prerequisite knowledge on {remed}. What do you recall about it?"
            elif strategy == "answer_reveal":
                tutor_response = f"Since we've worked through several attempts, let's review the complete solution step-by-step for {target_concept}."
            else:
                tutor_response = f"Let's work through {target_concept} step-by-step. What is your first intuition on how to approach this?"

        # Step 7: Deterministic BKT State Update (WHEN / WHAT NEXT layer)
        mastery_after = self.learner_manager.record_interaction_and_update(
            student_id=student_id,
            concept_id=target_concept,
            student_utterance=student_utterance,
            detected_intent=class_res.intent,
            is_correct=class_res.is_correct,
            strategy_used=strategy,
            tutor_response=tutor_response,
        )

        sources_info = [
            {
                "chunk_id": c.chunk_id,
                "source": c.source,
                "subject": c.subject,
                "grade": c.grade,
                "topic": c.topic,
                "citation": c.to_citation_text(),
            }
            for c in retrieved_chunks
        ]

        return TutorTurnResult(
            student_id=student_id,
            target_concept=target_concept,
            student_utterance=student_utterance,
            detected_intent=class_res.intent,
            strategy_used=strategy,
            tutor_response=tutor_response,
            mastery_before=mastery_before,
            mastery_after=mastery_after,
            is_mastered=self.learner_manager.bkt.is_mastered(mastery_after, target_concept),
            retrieved_sources=sources_info,
            active_remediation=learner_summary.get("active_remediation"),
            evaluation_metadata={
                "intent_confidence": class_res.confidence,
                "explanation": class_res.explanation,
            },
        )
