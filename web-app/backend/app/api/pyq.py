import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, PYQItem, PYQAttempt, Mistake, TopicMastery, KnowledgeItem

logger = logging.getLogger("intellitutor.api.pyq")

router = APIRouter(prefix="/pyq", tags=["PYQ Knowledge System"])

class SubmitPYQAttemptRequest(BaseModel):
    selected_option: str
    time_taken_seconds: int = 45

@router.get("")
def list_pyqs(
    exam: Optional[str] = None,
    year: Optional[int] = None,
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    status_filter: Optional[str] = None, # all, solved, unsolved, incorrect
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(PYQItem)
    if exam and exam != "ALL":
        query = query.filter(PYQItem.exam_name == exam)
    if year:
        query = query.filter(PYQItem.year == year)
    if subject and subject != "All":
        query = query.filter(PYQItem.subject == subject)
    if topic:
        query = query.filter(PYQItem.topic.ilike(f"%{topic}%"))
    if difficulty and difficulty != "ALL":
        query = query.filter(PYQItem.difficulty == difficulty)
        
    pyqs = query.order_by(PYQItem.year.desc(), PYQItem.repeat_frequency_score.desc()).all()
    
    # Get user attempts
    user_attempts = db.query(PYQAttempt).filter(PYQAttempt.user_id == current_user.id).all()
    attempt_map = {a.pyq_id: a for a in user_attempts}

    results = []
    for p in pyqs:
        attempt = attempt_map.get(p.id)
        is_solved = attempt is not None
        is_correct = attempt.is_correct if attempt else None

        if status_filter == "solved" and not is_solved:
            continue
        if status_filter == "unsolved" and is_solved:
            continue
        if status_filter == "incorrect" and (not is_solved or is_correct):
            continue

        results.append({
            "id": p.id,
            "exam_name": p.exam_name,
            "year": p.year,
            "subject": p.subject,
            "chapter": p.chapter,
            "topic": p.topic,
            "question_text": p.question_text,
            "options": p.options,
            "difficulty": p.difficulty,
            "key_formula_used": p.key_formula_used,
            "recurring_pattern_tag": p.recurring_pattern_tag,
            "repeat_frequency_score": p.repeat_frequency_score,
            "appeared_years": p.appeared_years or [p.year],
            "is_solved": is_solved,
            "is_correct": is_correct,
            "user_selected_option": attempt.selected_option if attempt else None
        })

    return {
        "count": len(results),
        "total_available_years": sorted(list(set(p.year for p in pyqs)), reverse=True),
        "pyqs": results
    }

@router.get("/{pyq_id}")
def get_pyq_details(
    pyq_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = db.query(PYQItem).filter(PYQItem.id == pyq_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="PYQ not found")
        
    attempt = db.query(PYQAttempt).filter(PYQAttempt.pyq_id == p.id, PYQAttempt.user_id == current_user.id).first()
    
    # Fetch related formulas & similar questions
    formulas = db.query(KnowledgeItem).filter(
        KnowledgeItem.user_id == current_user.id,
        KnowledgeItem.topic.ilike(f"%{p.topic}%")
    ).limit(3).all()

    similar_questions = db.query(PYQItem).filter(
        PYQItem.topic == p.topic,
        PYQItem.id != p.id
    ).limit(3).all()

    return {
        "id": p.id,
        "exam_name": p.exam_name,
        "year": p.year,
        "subject": p.subject,
        "chapter": p.chapter,
        "topic": p.topic,
        "question_text": p.question_text,
        "options": p.options,
        "correct_answer": p.correct_answer,
        "explanation": p.explanation,
        "difficulty": p.difficulty,
        "source": p.source,
        "key_formula_used": p.key_formula_used,
        "recurring_pattern_tag": p.recurring_pattern_tag,
        "repeat_frequency_score": p.repeat_frequency_score,
        "appeared_years": p.appeared_years or [p.year],
        "user_attempt": {
            "selected_option": attempt.selected_option,
            "is_correct": attempt.is_correct,
            "time_taken_seconds": attempt.time_taken_seconds
        } if attempt else None,
        "related_formulas": [
            {"title": f.title, "formula": f.formula_equation or "L = I\\omega"}
            for f in formulas if f.formula_equation
        ],
        "similar_pyqs": [
            {"id": sq.id, "year": sq.year, "question_text": sq.question_text[:80]}
            for sq in similar_questions
        ]
    }

@router.post("/{pyq_id}/submit")
def submit_pyq_attempt(
    pyq_id: str,
    req: SubmitPYQAttemptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = db.query(PYQItem).filter(PYQItem.id == pyq_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="PYQ not found")
        
    is_correct = (req.selected_option.strip().lower() == p.correct_answer.strip().lower())
    now = datetime.now(timezone.utc)
    
    # Save or update attempt
    attempt = db.query(PYQAttempt).filter(PYQAttempt.pyq_id == p.id, PYQAttempt.user_id == current_user.id).first()
    if attempt:
        attempt.selected_option = req.selected_option
        attempt.is_correct = is_correct
        attempt.time_taken_seconds = req.time_taken_seconds
        attempt.attempted_at = now
    else:
        attempt = PYQAttempt(
            user_id=current_user.id,
            pyq_id=p.id,
            selected_option=req.selected_option,
            is_correct=is_correct,
            time_taken_seconds=req.time_taken_seconds,
            attempted_at=now
        )
        db.add(attempt)

    # If incorrect, automatically record to Mistake Journal
    if not is_correct:
        existing_m = db.query(Mistake).filter(
            Mistake.user_id == current_user.id,
            Mistake.question_text == p.question_text
        ).first()
        if not existing_m:
            mistake = Mistake(
                user_id=current_user.id,
                question_text=p.question_text,
                user_answer=req.selected_option,
                correct_answer=p.correct_answer,
                explanation=p.explanation,
                concept=p.recurring_pattern_tag or p.topic,
                subject=p.subject,
                topic=p.topic,
                mistake_type="Conceptual",
                is_resolved=False
            )
            db.add(mistake)

    # Update Topic Mastery
    mastery = db.query(TopicMastery).filter(
        TopicMastery.user_id == current_user.id,
        TopicMastery.topic == p.topic
    ).first()
    if mastery:
        mastery.total_attempts += 1
        if is_correct:
            mastery.correct_attempts += 1
        mastery.mastery_percentage = (mastery.correct_attempts / mastery.total_attempts) * 100.0
        mastery.last_practiced_at = now

    db.commit()

    return {
        "is_correct": is_correct,
        "correct_answer": p.correct_answer,
        "explanation": p.explanation,
        "key_formula_used": p.key_formula_used,
        "recurring_pattern": p.recurring_pattern_tag
    }

@router.get("/analytics/overview")
def get_pyq_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempts = db.query(PYQAttempt).filter(PYQAttempt.user_id == current_user.id).all()
    total_attempts = len(attempts)
    correct_attempts = sum(1 for a in attempts if a.is_correct)
    accuracy = (correct_attempts / total_attempts * 100.0) if total_attempts > 0 else 0.0

    # Recurring question patterns
    pyqs = db.query(PYQItem).all()
    patterns = {}
    for p in pyqs:
        tag = p.recurring_pattern_tag or p.topic
        if tag not in patterns:
            patterns[tag] = {
                "pattern_name": tag,
                "subject": p.subject,
                "topic": p.topic,
                "appeared_years": p.appeared_years or [p.year],
                "frequency_score": p.repeat_frequency_score,
                "questions_count": 0
            }
        patterns[tag]["questions_count"] += 1

    pattern_list = sorted(list(patterns.values()), key=lambda x: x["frequency_score"], reverse=True)

    return {
        "total_attempted": total_attempts,
        "correct_count": correct_attempts,
        "accuracy_percentage": round(accuracy, 1),
        "recurring_patterns": pattern_list[:6]
    }
