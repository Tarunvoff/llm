import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, Mistake, Quiz, QuizQuestion

logger = logging.getLogger("intellitutor.mistakes")

router = APIRouter(prefix="/mistakes", tags=["Mistakes"])

class CreateMistakeRequest(BaseModel):
    question_text: str
    user_answer: str
    correct_answer: str
    explanation: str
    concept: str
    subject: str = "Physics"
    topic: str = "General"
    mistake_type: str = "Conceptual" # Conceptual, Calculation, Careless, Memory, Time management, Misread

@router.get("")
def list_mistakes(
    subject: Optional[str] = None,
    mistake_type: Optional[str] = None,
    is_resolved: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Mistake).filter(Mistake.user_id == current_user.id)
    
    if subject and subject != "All":
        query = query.filter(Mistake.subject == subject)
    if mistake_type and mistake_type != "All":
        query = query.filter(Mistake.mistake_type == mistake_type)
    if is_resolved is not None:
        query = query.filter(Mistake.is_resolved == is_resolved)
        
    mistakes = query.order_by(Mistake.created_at.desc()).all()
    
    # Calculate summary stats for the user
    all_user_mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id).all()
    total_count = len(all_user_mistakes)
    resolved_count = sum(1 for m in all_user_mistakes if m.is_resolved)
    conceptual_count = sum(1 for m in all_user_mistakes if m.mistake_type == "Conceptual")
    calculation_count = sum(1 for m in all_user_mistakes if m.mistake_type == "Calculation")
    memory_count = sum(1 for m in all_user_mistakes if m.mistake_type == "Memory")
    careless_count = sum(1 for m in all_user_mistakes if m.mistake_type in ["Careless", "Misread", "Time management"])
    
    # If user has no mistakes, let's provide default high-yield seed mistakes if empty
    if total_count == 0:
        seed_mistakes = [
            Mistake(
                user_id=current_user.id,
                question_text="A rigid body rotates about a fixed axis with constant angular acceleration α. If it makes N revolutions in time t, find α.",
                user_answer="α = 2πN / t² (Missed factor of 2 during radian conversion)",
                correct_answer="α = 4πN / t²",
                explanation="Remember θ = 2πN radians. Using θ = 1/2 α t² gives 2πN = 1/2 α t² => α = 4πN / t².",
                concept="Radian to Revolution Angular Acceleration Conversion",
                subject="Physics",
                topic="Rotational Motion",
                mistake_type="Conceptual",
                is_resolved=False
            ),
            Mistake(
                user_id=current_user.id,
                question_text="Which intermediate is formed in the acid-catalyzed hydration of propene?",
                user_answer="Primary carbocation",
                correct_answer="Secondary carbocation (2-propyl cation)",
                explanation="Markovnikov's rule dictates protonation occurs on less substituted carbon to generate the more stable secondary carbocation intermediate.",
                concept="Carbocation Stability & Markovnikov Addition",
                subject="Chemistry",
                topic="Organic Reactions",
                mistake_type="Conceptual",
                is_resolved=False
            ),
            Mistake(
                user_id=current_user.id,
                question_text="In which sub-stage of Prophase I does crossing over occur?",
                user_answer="Diplotene",
                correct_answer="Pachytene",
                explanation="Crossing over occurs at Pachytene via recombinase enzyme; Chiasmata become visible at Diplotene.",
                concept="Chiasmata Formation Stage",
                subject="Biology",
                topic="Cell Division",
                mistake_type="Memory",
                is_resolved=True
            ),
        ]
        for sm in seed_mistakes:
            db.add(sm)
        db.commit()
        # Re-fetch
        return list_mistakes(subject, mistake_type, is_resolved, current_user, db)

    return {
        "stats": {
            "total": total_count,
            "resolved": resolved_count,
            "unresolved": total_count - resolved_count,
            "conceptual": conceptual_count,
            "calculation": calculation_count,
            "memory": memory_count,
            "careless": careless_count
        },
        "mistakes": [
            {
                "id": m.id,
                "question": m.question_text,
                "userAnswer": m.user_answer,
                "correctAnswer": m.correct_answer,
                "explanation": m.explanation,
                "concept": m.concept,
                "subject": m.subject,
                "topic": m.topic,
                "mistakeType": m.mistake_type,
                "isResolved": m.is_resolved,
                "retestCount": m.retest_count,
                "retestScheduled": "Resolved" if m.is_resolved else "Due Today",
                "createdAt": m.created_at.isoformat() if m.created_at else None
            }
            for m in mistakes
        ]
    }

@router.post("")
def add_mistake(
    req: CreateMistakeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mistake = Mistake(
        user_id=current_user.id,
        question_text=req.question_text,
        user_answer=req.user_answer,
        correct_answer=req.correct_answer,
        explanation=req.explanation,
        concept=req.concept,
        subject=req.subject,
        topic=req.topic,
        mistake_type=req.mistake_type,
        is_resolved=False
    )
    db.add(mistake)
    db.commit()
    db.refresh(mistake)
    return {"message": "Mistake logged successfully", "id": mistake.id}

@router.post("/{mistake_id}/toggle-resolve")
def toggle_resolve_mistake(
    mistake_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mistake = db.query(Mistake).filter(Mistake.id == mistake_id, Mistake.user_id == current_user.id).first()
    if not mistake:
        raise HTTPException(status_code=404, detail="Mistake not found")
        
    mistake.is_resolved = not mistake.is_resolved
    if mistake.is_resolved:
        mistake.retest_count += 1
    db.commit()
    
    return {
        "id": mistake.id,
        "is_resolved": mistake.is_resolved,
        "retest_count": mistake.retest_count
    }

@router.post("/retest")
def generate_mistakes_retest_quiz(
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a targeted retest quiz from the student's active unresolved mistakes.
    """
    query = db.query(Mistake).filter(Mistake.user_id == current_user.id, Mistake.is_resolved == False)
    if subject and subject != "All":
        query = query.filter(Mistake.subject == subject)
        
    mistakes = query.order_by(Mistake.created_at.desc()).limit(10).all()
    if not mistakes:
        # Fall back to any mistake
        mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id).limit(5).all()
        
    if not mistakes:
        raise HTTPException(status_code=400, detail="No mistakes available for retest.")
        
    quiz = Quiz(
        user_id=current_user.id,
        title=f"Smart Retest: {mistakes[0].subject} Mistake Elimination",
        subject=mistakes[0].subject,
        chapter=mistakes[0].topic or "Weak Concepts Review",
        topic="Adaptive Retest",
        difficulty="Exam level",
        question_type="MCQ",
        question_count=len(mistakes),
        status="created"
    )
    db.add(quiz)
    db.flush()
    
    quiz_questions = []
    for m in mistakes:
        # Construct 4 options including correct answer and common distractor
        options = [
            m.correct_answer,
            m.user_answer if m.user_answer != m.correct_answer else f"Inverse of {m.correct_answer}",
            f"Zero or Indeterminate",
            f"Double the value of {m.correct_answer[:15]}"
        ]
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question_text=m.question_text,
            options=options,
            correct_answer=m.correct_answer,
            explanation=m.explanation,
            topic=m.concept,
            difficulty="Exam level",
            question_type="MCQ"
        )
        db.add(qq)
        quiz_questions.append(qq)
        
    db.commit()
    db.refresh(quiz)
    
    return {
        "quiz_id": quiz.id,
        "title": quiz.title,
        "question_count": len(quiz_questions),
        "questions": [
            {
                "id": qq.id,
                "question_text": qq.question_text,
                "options": qq.options,
                "correct_answer": qq.correct_answer,
                "explanation": qq.explanation,
                "topic": qq.topic
            }
            for qq in quiz_questions
        ]
    }

@router.delete("/{mistake_id}")
def delete_mistake(
    mistake_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mistake = db.query(Mistake).filter(Mistake.id == mistake_id, Mistake.user_id == current_user.id).first()
    if not mistake:
        raise HTTPException(status_code=404, detail="Mistake not found")
        
    db.delete(mistake)
    db.commit()
    return {"message": "Mistake deleted successfully"}
