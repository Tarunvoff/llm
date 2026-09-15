"""FastAPI Backend Application for Pedagogical Tutor Serving.

Endpoints:
- GET  /health: Health check and hardware readiness.
- POST /chat: Interactive tutoring turn.
- GET  /student/{id}/state: Inspects student mastery profile (BKT state).
"""

from contextlib import asynccontextmanager
import logging
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from tutor.pipeline import PedagogicalTutorPipeline

logger = logging.getLogger(__name__)

# Global pipeline instance
pipeline: Optional[PedagogicalTutorPipeline] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager initializing tutoring pipeline on startup."""
    global pipeline
    logger.info("Initializing Pedagogical Tutor Pipeline...")
    pipeline = PedagogicalTutorPipeline()
    logger.info("Pipeline ready.")
    yield


app = FastAPI(
    title="Pedagogically Aligned AI Tutor API",
    version="1.0.0",
    description="Inference and state API for curriculum-grounded Socratic tutoring.",
    lifespan=lifespan,
)


class ChatRequest(BaseModel):
    student_id: str = Field(..., description="Unique student identifier")
    question: str = Field(..., description="Student prompt or inquiry")
    concept: Optional[str] = Field("Quadratic Equations", description="Target curriculum concept")
    subject: Optional[str] = Field("Mathematics", description="STEM subject domain")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        default_factory=list,
        description="Prior message history array",
    )


class ChatResponse(BaseModel):
    student_id: str
    target_concept: str
    detected_intent: str
    strategy_used: str
    tutor_response: str
    mastery_before: float
    mastery_after: float
    is_mastered: bool
    retrieved_sources: List[Dict[str, Any]]
    active_remediation: Optional[str] = None


class StateResponse(BaseModel):
    student_id: str
    concept: str
    mastery_summary: Dict[str, Any]


@app.get("/health")
def health():
    """Returns server and pipeline health status."""
    return {
        "status": "healthy",
        "pipeline_initialized": pipeline is not None,
    }


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    """Executes a single tutoring interaction turn."""
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized.")

    result = pipeline.step(
        student_id=req.student_id,
        student_utterance=req.question,
        target_concept=req.concept or "General STEM",
        conversation_history=req.conversation_history,
        subject=req.subject,
    )

    return ChatResponse(
        student_id=result.student_id,
        target_concept=result.target_concept,
        detected_intent=result.detected_intent,
        strategy_used=result.strategy_used,
        tutor_response=result.tutor_response,
        mastery_before=result.mastery_before,
        mastery_after=result.mastery_after,
        is_mastered=result.is_mastered,
        retrieved_sources=result.retrieved_sources,
        active_remediation=result.active_remediation,
    )


@app.get("/student/{student_id}/state", response_model=StateResponse)
def get_student_state(student_id: str, concept: str = "Quadratic Equations"):
    """Returns deterministic BKT mastery state and history for a student."""
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized.")

    summary = pipeline.learner_manager.get_summary(student_id, concept)
    return StateResponse(
        student_id=student_id,
        concept=concept,
        mastery_summary=summary,
    )
