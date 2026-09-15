"""Pedagogical Prompt Constructor.

Constructs structured prompts with isolated sections:
- SYSTEM & PEDAGOGICAL INSTRUCTIONS
- LEARNER MASTERY STATE
- RETRIEVED CURRICULUM CONTEXT
- CONVERSATION HISTORY & CURRENT QUESTION

Guarantees pedagogical restraint and prevents retrieved curriculum or student inputs
from overriding system instructions.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from tutor.rag.retriever import RetrievedChunk


SYSTEM_BASE_PROMPT = """You are an expert, empathetic Socratic AI STEM Tutor.
Your pedagogical goal is to guide students to discover solutions themselves through structured questioning, hints, and scaffolding.

CORE PEDAGOGICAL INVARIANTS:
1. NEVER reveal the final numerical or symbolic solution in early turns or upon a single request.
2. If the student has a missing prerequisite, guide them to review the prerequisite first.
3. If the student demonstrates a misconception, ask a diagnostic counter-question to help them spot their error.
4. Ground all scientific and mathematical claims strictly in the provided curriculum context.
5. Only provide direct solutions if the student has failed 3+ consecutive attempts after multi-level scaffolding.
"""

STRATEGY_INSTRUCTIONS = {
    "socratic_scaffolding": "STRATEGY: Socratic Scaffolding. Ask a focused guiding question that directs the student's attention to the next immediate step.",
    "provide_hint": "STRATEGY: Hint Giving. Provide a subtle conceptual or procedural hint without giving away the full answer.",
    "diagnose_prerequisite": "STRATEGY: Prerequisite Remediation. The student appears to lack prerequisite knowledge. Ask a foundational question regarding the prerequisite concept.",
    "concept_clarification": "STRATEGY: Concept Clarification. Clarify the core definitions or physical principles involved before proceeding to calculation.",
    "answer_reveal": "STRATEGY: Solution Walkthrough. The student has struggled repeatedly despite scaffolding. Walk through the solution step-by-step with complete pedagogical explanation.",
}


class PedagogicalPromptBuilder:
    """Builds structured, injection-resistant prompts for the tutoring LLM."""

    def __init__(self, system_prompt: str = SYSTEM_BASE_PROMPT):
        self.system_prompt = system_prompt

    def build_prompt(
        self,
        student_question: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        learner_state: Optional[Dict[str, Any]] = None,
        retrieved_chunks: Optional[List[RetrievedChunk]] = None,
        strategy: str = "socratic_scaffolding",
        detected_intent: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        """Constructs a chat-formatted message array suitable for tokenizer apply_chat_template.

        Returns:
            List of message dicts: [{"role": "system", "content": ...}, {"role": "user", ...}]
        """
        system_sections = [self.system_prompt.strip()]

        # 1. Pedagogical Strategy Section
        strat_text = STRATEGY_INSTRUCTIONS.get(
            strategy, STRATEGY_INSTRUCTIONS["socratic_scaffolding"]
        )
        system_sections.append(f"\n[ACTIVE PEDAGOGICAL DIRECTIVE]\n{strat_text}")

        # 2. Learner State Section
        if learner_state:
            concept = learner_state.get("target_concept", "General STEM")
            mastery = learner_state.get("current_mastery", 0.1)
            failures = learner_state.get("consecutive_failures", 0)
            prereqs = learner_state.get("unmastered_prerequisites", [])
            remediation = learner_state.get("active_remediation")

            state_summary = (
                f"\n[LEARNER MASTERY STATE]\n"
                f"- Target Concept: {concept}\n"
                f"- Current Estimated Mastery: {mastery:.2f}\n"
                f"- Consecutive Failures on Concept: {failures}\n"
                f"- Unmastered Prerequisites: {prereqs if prereqs else 'None'}\n"
                f"- Active Remediation Focus: {remediation if remediation else 'None'}"
            )
            system_sections.append(state_summary)

        # 3. Retrieved Curriculum Grounding Section
        if retrieved_chunks:
            curriculum_lines = ["\n[RETRIEVED CURRICULUM CONTEXT]"]
            for idx, chunk in enumerate(retrieved_chunks, start=1):
                curriculum_lines.append(f"Source {idx}: {chunk.to_citation_text()}")
            system_sections.append("\n".join(curriculum_lines))

        system_message = "\n\n".join(system_sections)

        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_message}
        ]

        # 4. Conversation History
        if conversation_history:
            for turn in conversation_history:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                if role in ["user", "assistant"] and content.strip():
                    messages.append({"role": role, "content": content})

        # 5. Current Student Question
        messages.append({"role": "user", "content": student_question})

        return messages
