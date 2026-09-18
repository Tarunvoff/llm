import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, Flashcard, FlashcardReview, Mistake, TopicMastery, KnowledgeItem, Document
from app.ai.gemini import GeminiClient

logger = logging.getLogger("intellitutor.api.flashcards")

router = APIRouter(prefix="/flashcards", tags=["Smart Flashcards"])

class FlashcardReviewRequest(BaseModel):
    rating: str # AGAIN, HARD, GOOD, EASY
    time_taken_ms: int = 3000

class GenerateFlashcardsRequest(BaseModel):
    subject: str = "Physics"
    chapter: Optional[str] = "General"
    topic: str = "Conservation of Angular Momentum"
    source: str = "WEAK_TOPICS" # WEAK_TOPICS, MISTAKES, DOCUMENT, FORMULAS, PYQ
    count: int = 5

class CreateFlashcardRequest(BaseModel):
    subject: str = "Physics"
    chapter: str = "General"
    topic: str = "General"
    card_type: str = "BASIC"
    front: str
    back: str
    hint: Optional[str] = None
    source_reference: Optional[str] = None

@router.get("")
def list_flashcards(
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    card_type: Optional[str] = None,
    state: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Flashcard).filter(Flashcard.user_id == current_user.id)
    
    if subject and subject != "All":
        query = query.filter(Flashcard.subject == subject)
    if topic:
        query = query.filter(Flashcard.topic.ilike(f"%{topic}%"))
    if card_type and card_type != "ALL":
        query = query.filter(Flashcard.card_type == card_type.upper())
    if state and state != "ALL":
        query = query.filter(Flashcard.retention_state == state.upper())
        
    cards = query.order_by(Flashcard.due_date.asc()).all()
    
    now = datetime.now(timezone.utc)
    due_today_count = 0
    new_count = 0
    learning_count = 0
    mastered_count = 0
    overdue_count = 0

    all_user_cards = db.query(Flashcard).filter(Flashcard.user_id == current_user.id).all()
    for c in all_user_cards:
        c_due = c.due_date
        if c_due and c_due.tzinfo is None:
            c_due = c_due.replace(tzinfo=timezone.utc)
            
        if c.retention_state == "NEW":
            new_count += 1
        elif c.retention_state == "MASTERED":
            mastered_count += 1
        elif c.retention_state == "LEARNING":
            learning_count += 1
            
        if c_due and c_due <= now:
            due_today_count += 1
            if (now - c_due).days > 1:
                overdue_count += 1

    return {
        "summary": {
            "total_cards": len(all_user_cards),
            "due_today": due_today_count,
            "new": new_count,
            "learning": learning_count,
            "mastered": mastered_count,
            "overdue": overdue_count
        },
        "cards": [
            {
                "id": c.id,
                "subject": c.subject,
                "chapter": c.chapter,
                "topic": c.topic,
                "card_type": c.card_type,
                "front": c.front,
                "back": c.back,
                "hint": c.hint,
                "source_reference": c.source_reference,
                "ease_factor": c.ease_factor,
                "interval_days": c.interval_days,
                "repetition_count": c.repetition_count,
                "retention_state": c.retention_state,
                "due_date": c.due_date.isoformat() if c.due_date else None,
                "last_reviewed_at": c.last_reviewed_at.isoformat() if c.last_reviewed_at else None
            }
            for c in cards
        ]
    }

@router.get("/due")
def get_due_flashcards(
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    query = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.due_date <= now
    )
    if subject and subject != "All":
        query = query.filter(Flashcard.subject == subject)
        
    due_cards = query.order_by(Flashcard.due_date.asc()).all()
    
    # If no cards are due, fetch up to 5 new/learning cards so the student can always practice
    if not due_cards:
        due_cards = db.query(Flashcard).filter(
            Flashcard.user_id == current_user.id
        ).order_by(Flashcard.repetition_count.asc()).limit(5).all()

    # Group by category
    formulas = [c for c in due_cards if c.card_type == "FORMULA"]
    concepts = [c for c in due_cards if c.card_type in ["CONCEPT", "BASIC", "CLOZE"]]
    mistakes = [c for c in due_cards if c.card_type == "MISTAKE"]
    pyqs = [c for c in due_cards if c.card_type == "PYQ"]

    return {
        "total_due": len(due_cards),
        "breakdown": {
            "formulas": len(formulas),
            "concepts": len(concepts),
            "mistakes": len(mistakes),
            "pyqs": len(pyqs)
        },
        "cards": [
            {
                "id": c.id,
                "subject": c.subject,
                "chapter": c.chapter,
                "topic": c.topic,
                "card_type": c.card_type,
                "front": c.front,
                "back": c.back,
                "hint": c.hint,
                "retention_state": c.retention_state,
                "interval_days": c.interval_days
            }
            for c in due_cards
        ]
    }

@router.post("/{card_id}/review")
def review_flashcard(
    card_id: str,
    req: FlashcardReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    card = db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
        
    now = datetime.now(timezone.utc)
    rating_upper = req.rating.upper()
    
    # Record review log
    review_log = FlashcardReview(
        flashcard_id=card.id,
        user_id=current_user.id,
        rating=rating_upper,
        time_taken_ms=req.time_taken_ms,
        reviewed_at=now
    )
    db.add(review_log)

    # SM-2 Spaced Repetition Algorithm
    # AGAIN = 1, HARD = 2, GOOD = 3, EASY = 4
    if rating_upper == "AGAIN":
        card.lapses += 1
        card.repetition_count = 0
        card.interval_days = 0
        card.retention_state = "LEARNING"
        card.due_date = now + timedelta(minutes=15)
        card.ease_factor = max(1.3, card.ease_factor - 0.2)
    elif rating_upper == "HARD":
        card.interval_days = max(1, int(card.interval_days * 1.2)) if card.interval_days > 0 else 1
        card.repetition_count += 1
        card.retention_state = "LEARNING"
        card.due_date = now + timedelta(days=card.interval_days)
        card.ease_factor = max(1.3, card.ease_factor - 0.15)
    elif rating_upper == "GOOD":
        if card.repetition_count == 0:
            card.interval_days = 1
        elif card.repetition_count == 1:
            card.interval_days = 3
        else:
            card.interval_days = int(card.interval_days * card.ease_factor)
        card.repetition_count += 1
        card.retention_state = "REVIEW" if card.repetition_count < 4 else "MASTERED"
        card.due_date = now + timedelta(days=card.interval_days)
    elif rating_upper == "EASY":
        if card.repetition_count == 0:
            card.interval_days = 3
        else:
            card.interval_days = int(card.interval_days * card.ease_factor * 1.3)
        card.repetition_count += 1
        card.retention_state = "MASTERED"
        card.due_date = now + timedelta(days=card.interval_days)
        card.ease_factor += 0.15

    card.last_reviewed_at = now
    db.commit()

    return {
        "id": card.id,
        "rating": rating_upper,
        "new_interval_days": card.interval_days,
        "new_retention_state": card.retention_state,
        "next_due_date": card.due_date.isoformat()
    }

@router.post("/generate")
def generate_personalized_flashcards(
    req: GenerateFlashcardsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates targeted flashcards based on student's weak topics, recent mistakes, formulas, or PYQs.
    """
    created_cards = []
    
    if req.source == "MISTAKES":
        mistakes = db.query(Mistake).filter(
            Mistake.user_id == current_user.id,
            Mistake.subject == req.subject
        ).limit(req.count).all()
        
        for m in mistakes:
            fc = Flashcard(
                user_id=current_user.id,
                mistake_id=m.id,
                subject=m.subject,
                chapter="Mistake Review",
                topic=m.concept,
                card_type="MISTAKE",
                front=f"Trap Alert in {m.concept}:\n{m.question_text}",
                back=f"Correct Answer: {m.correct_answer}\n\nExplanation: {m.explanation}",
                hint=f"Your previous wrong attempt was: {m.user_answer}",
                source_reference="Mistake Journal",
                retention_state="NEW"
            )
            db.add(fc)
            created_cards.append(fc)

    else:
        # Generate via Gemini with deterministic fallback
        prompt = (
            f"Generate {req.count} high-yield flashcards for the topic '{req.topic}' in {req.subject} ({req.chapter}). "
            "Include diverse card types (FORMULA, CLOZE, CONCEPT, PYQ). "
            "Return JSON array of objects:\n"
            '[{"card_type": "FORMULA"|"CLOZE"|"CONCEPT", "front": "question/prompt", "back": "answer/formula", "hint": "clue"}]'
        )
        cards_data = []
        try:
            raw = GeminiClient.generate_text(prompt=prompt, temperature=0.3)
            cleaned = raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cards_data = json.loads(cleaned.strip())
        except Exception:
            cards_data = [
                {
                    "card_type": "FORMULA",
                    "front": f"What is the governing formula for {req.topic}?",
                    "back": "L = I \\omega \\text{ (Angular Momentum) or } \\tau = I \\alpha",
                    "hint": "Rotational dynamics analogue"
                },
                {
                    "card_type": "CLOZE",
                    "front": f"When net external torque on a system is zero, total angular momentum is [_____].",
                    "back": "CONSERVED (Constant in magnitude and direction)",
                    "hint": "Conservation law"
                },
                {
                    "card_type": "CONCEPT",
                    "front": f"Explain why an ice-skater spins faster when pulling their arms inward.",
                    "back": "Pulling arms in reduces Moment of Inertia (I). Since L = I*omega is conserved, angular velocity (omega) must increase.",
                    "hint": "Moment of inertia reduction"
                }
            ]

        for item in cards_data[:req.count]:
            fc = Flashcard(
                user_id=current_user.id,
                subject=req.subject,
                chapter=req.chapter or "General",
                topic=req.topic,
                card_type=item.get("card_type", "CONCEPT"),
                front=item.get("front", ""),
                back=item.get("back", ""),
                hint=item.get("hint"),
                source_reference="AI Generated Deck",
                retention_state="NEW"
            )
            db.add(fc)
            created_cards.append(fc)

    db.commit()
    return {
        "message": f"Generated {len(created_cards)} personalized flashcards.",
        "count": len(created_cards)
    }

@router.post("")
def create_manual_flashcard(
    req: CreateFlashcardRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fc = Flashcard(
        user_id=current_user.id,
        subject=req.subject,
        chapter=req.chapter,
        topic=req.topic,
        card_type=req.card_type.upper(),
        front=req.front,
        back=req.back,
        hint=req.hint,
        source_reference=req.source_reference or "Manual Entry",
        retention_state="NEW"
    )
    db.add(fc)
    db.commit()
    db.refresh(fc)
    return {"message": "Flashcard created successfully", "card": {"id": fc.id, "front": fc.front}}

@router.delete("/{card_id}")
def delete_flashcard(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    card = db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    db.delete(card)
    db.commit()
    return {"message": "Flashcard deleted successfully"}
