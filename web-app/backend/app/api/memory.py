import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, KnowledgeItem, Flashcard, Mistake, PYQItem, TopicMastery, RevisionItem

logger = logging.getLogger("intellitutor.api.memory")

router = APIRouter(prefix="/memory", tags=["Formula & Memory Vault"])

@router.get("")
def get_memory_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Overview of student's memory vault categorized by Formulas, Definitions, Names, Facts, Reactions.
    """
    knowledge = db.query(KnowledgeItem).filter(KnowledgeItem.user_id == current_user.id).all()
    
    formulas = [k for k in knowledge if k.type in ["FORMULA", "EQUATION"] or k.formula_equation]
    definitions = [k for k in knowledge if k.type in ["DEFINITION", "CONCEPT", "LAW", "THEOREM"]]
    facts = [k for k in knowledge if k.type in ["FACT", "NAME", "DATE", "REACTION", "MEMORY_AID"]]
    
    cards_due = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.retention_state.in_(["NEW", "LEARNING", "OVERDUE"])
    ).count()

    mistakes_unresolved = db.query(Mistake).filter(
        Mistake.user_id == current_user.id,
        Mistake.is_resolved == False
    ).count()

    return {
        "summary": {
            "total_formulas": len(formulas),
            "total_definitions": len(definitions),
            "total_facts": len(facts),
            "cards_due_for_recall": cards_due,
            "mistakes_to_review": mistakes_unresolved
        },
        "recent_formulas": [
            {
                "id": f.id,
                "title": f.title,
                "subject": f.subject,
                "topic": f.topic,
                "formula_equation": f.formula_equation or "E = mc^2",
                "importance_score": f.importance_score,
                "mastery_score": f.mastery_score
            }
            for f in formulas[:6]
        ],
        "high_yield_facts": [
            {
                "id": ft.id,
                "title": ft.title,
                "subject": ft.subject,
                "content": ft.content,
                "type": ft.type,
                "importance_score": ft.importance_score
            }
            for ft in facts[:6]
        ]
    }

@router.get("/formulas")
def get_formula_vault(
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Organized Formula Vault across Physics, Chemistry, Math.
    Each formula contains equation, variable breakdowns, significance, and mastery.
    """
    query = db.query(KnowledgeItem).filter(
        KnowledgeItem.user_id == current_user.id,
        (KnowledgeItem.type.in_(["FORMULA", "EQUATION"])) | (KnowledgeItem.formula_equation != None)
    )
    if subject and subject != "All":
        query = query.filter(KnowledgeItem.subject == subject)
    if topic:
        query = query.filter(KnowledgeItem.topic.ilike(f"%{topic}%"))
        
    items = query.order_by(KnowledgeItem.subject.asc(), KnowledgeItem.importance_score.desc()).all()
    
    # Group by subject and chapter
    grouped: Dict[str, Dict[str, List[Any]]] = {}
    for item in items:
        subj = item.subject or "Physics"
        chap = item.chapter or "General"
        if subj not in grouped:
            grouped[subj] = {}
        if chap not in grouped[subj]:
            grouped[subj][chap] = []
            
        grouped[subj][chap].append({
            "id": item.id,
            "title": item.title,
            "formula": item.formula_equation or "L = I\\omega",
            "variables": item.variables_explanation or {},
            "summary": item.summary or item.content[:100],
            "importance": item.importance_score,
            "mastery": item.mastery_score,
            "source": item.source_reference or "NCERT",
            "recurring_pattern": item.recurring_pattern
        })

    return {"grouped_formulas": grouped, "total_formulas": len(items)}

@router.get("/facts")
def get_facts_and_definitions(
    subject: Optional[str] = None,
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(KnowledgeItem).filter(
        KnowledgeItem.user_id == current_user.id,
        KnowledgeItem.type.in_(["DEFINITION", "FACT", "NAME", "DATE", "REACTION", "LAW", "THEOREM"])
    )
    if subject and subject != "All":
        query = query.filter(KnowledgeItem.subject == subject)
    if type and type != "ALL":
        query = query.filter(KnowledgeItem.type == type.upper())
        
    items = query.order_by(KnowledgeItem.importance_score.desc()).all()
    return {
        "count": len(items),
        "facts": [
            {
                "id": i.id,
                "title": i.title,
                "type": i.type,
                "subject": i.subject,
                "chapter": i.chapter,
                "topic": i.topic,
                "content": i.content,
                "importance": i.importance_score,
                "tags": i.tags or []
            }
            for i in items
        ]
    }

@router.get("/quick-recall")
def get_quick_recall_session(
    duration_minutes: int = Query(10, enum=[10, 20, 30]),
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Phase 20: Rapid revision session automatically calibrated for 10, 20, or 30 minutes.
    Blends formulas, flashcards, previous mistakes, and rapid PYQs.
    """
    # Scale counts based on duration
    multiplier = 1 if duration_minutes == 10 else (2 if duration_minutes == 20 else 3)
    formula_count = 3 * multiplier
    flashcard_count = 4 * multiplier
    mistake_count = 2 * multiplier
    pyq_count = 2 * multiplier

    k_query = db.query(KnowledgeItem).filter(
        KnowledgeItem.user_id == current_user.id,
        (KnowledgeItem.type.in_(["FORMULA", "EQUATION"])) | (KnowledgeItem.formula_equation != None)
    )
    if subject and subject != "All":
        k_query = k_query.filter(KnowledgeItem.subject == subject)
    formulas = k_query.order_by(KnowledgeItem.mastery_score.asc()).limit(formula_count).all()

    c_query = db.query(Flashcard).filter(Flashcard.user_id == current_user.id)
    if subject and subject != "All":
        c_query = c_query.filter(Flashcard.subject == subject)
    flashcards = c_query.order_by(Flashcard.repetition_count.asc()).limit(flashcard_count).all()

    m_query = db.query(Mistake).filter(Mistake.user_id == current_user.id, Mistake.is_resolved == False)
    if subject and subject != "All":
        m_query = m_query.filter(Mistake.subject == subject)
    mistakes = m_query.limit(mistake_count).all()

    p_query = db.query(PYQItem)
    if subject and subject != "All":
        p_query = p_query.filter(PYQItem.subject == subject)
    pyqs = p_query.order_by(PYQItem.repeat_frequency_score.desc()).limit(pyq_count).all()

    return {
        "duration_minutes": duration_minutes,
        "total_items": len(formulas) + len(flashcards) + len(mistakes) + len(pyqs),
        "formulas": [
            {"id": f.id, "title": f.title, "formula": f.formula_equation or "L = I\\omega", "topic": f.topic, "variables": f.variables_explanation}
            for f in formulas
        ],
        "flashcards": [
            {"id": c.id, "front": c.front, "back": c.back, "topic": c.topic, "card_type": c.card_type}
            for c in flashcards
        ],
        "mistakes": [
            {"id": m.id, "concept": m.concept, "question": m.question_text, "correct_answer": m.correct_answer, "explanation": m.explanation}
            for m in mistakes
        ],
        "pyqs": [
            {"id": p.id, "year": p.year, "exam_name": p.exam_name, "question_text": p.question_text, "options": p.options, "correct_answer": p.correct_answer, "explanation": p.explanation}
            for p in pyqs
        ]
    }

@router.get("/exam")
def get_exam_memory_cram_mode(
    exam: str = "NEET",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Phase 21: High-yield final exam cram mode.
    Pulls top recurring formulas, highest-weighted PYQ patterns, and trap mistakes into one page.
    """
    formulas = db.query(KnowledgeItem).filter(
        KnowledgeItem.user_id == current_user.id,
        KnowledgeItem.importance_score >= 8.5
    ).order_by(KnowledgeItem.importance_score.desc()).limit(15).all()

    pyqs = db.query(PYQItem).filter(
        PYQItem.exam_name == exam,
        PYQItem.repeat_frequency_score >= 3.0
    ).order_by(PYQItem.repeat_frequency_score.desc()).limit(10).all()

    mistakes = db.query(Mistake).filter(
        Mistake.user_id == current_user.id,
        Mistake.is_resolved == False
    ).limit(8).all()

    return {
        "exam_goal": exam,
        "must_know_formulas": [
            {
                "id": f.id,
                "title": f.title,
                "formula": f.formula_equation or "L = I\\omega",
                "subject": f.subject,
                "topic": f.topic,
                "importance": f.importance_score
            }
            for f in formulas
        ],
        "recurring_pyq_patterns": [
            {
                "id": p.id,
                "topic": p.topic,
                "pattern": p.recurring_pattern_tag,
                "frequency": p.repeat_frequency_score,
                "appeared_years": p.appeared_years or [p.year],
                "sample_question": p.question_text
            }
            for p in pyqs
        ],
        "high_priority_mistakes": [
            {
                "id": m.id,
                "concept": m.concept,
                "mistake_type": m.mistake_type,
                "correct_answer": m.correct_answer,
                "explanation": m.explanation
            }
            for m in mistakes
        ]
    }
