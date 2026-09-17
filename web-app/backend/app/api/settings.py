import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, UserSetting, UserProfile, TopicMastery, Mistake, Quiz, Document, Conversation, Message

logger = logging.getLogger("intellitutor.settings")

router = APIRouter(prefix="/settings", tags=["Settings"])

class UpdateSettingsRequest(BaseModel):
    model_name: Optional[str] = "gemini-2.5-flash"
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=1.0)
    scaffolding_intensity: Optional[str] = "adaptive"
    enable_citations: Optional[bool] = True
    enable_sound_effects: Optional[bool] = True
    dark_mode: Optional[bool] = False
    email_notifications: Optional[bool] = True

@router.get("")
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(UserSetting).filter(UserSetting.user_id == current_user.id).first()
    if not settings:
        settings = UserSetting(
            user_id=current_user.id,
            model_name="gemini-2.5-flash",
            temperature=0.7,
            scaffolding_intensity="adaptive",
            enable_citations=True,
            enable_sound_effects=True,
            dark_mode=False,
            email_notifications=True
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return {
        "settings": {
            "model_name": settings.model_name,
            "temperature": settings.temperature,
            "scaffolding_intensity": settings.scaffolding_intensity,
            "enable_citations": settings.enable_citations,
            "enable_sound_effects": settings.enable_sound_effects,
            "dark_mode": settings.dark_mode,
            "email_notifications": settings.email_notifications,
            "updated_at": settings.updated_at.isoformat() if settings.updated_at else None
        }
    }

@router.put("")
def update_user_settings(
    req: UpdateSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(UserSetting).filter(UserSetting.user_id == current_user.id).first()
    if not settings:
        settings = UserSetting(user_id=current_user.id)
        db.add(settings)

    settings.model_name = req.model_name or settings.model_name
    settings.temperature = req.temperature if req.temperature is not None else settings.temperature
    settings.scaffolding_intensity = req.scaffolding_intensity or settings.scaffolding_intensity
    settings.enable_citations = req.enable_citations if req.enable_citations is not None else settings.enable_citations
    settings.enable_sound_effects = req.enable_sound_effects if req.enable_sound_effects is not None else settings.enable_sound_effects
    settings.dark_mode = req.dark_mode if req.dark_mode is not None else settings.dark_mode
    settings.email_notifications = req.email_notifications if req.email_notifications is not None else settings.email_notifications
    settings.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(settings)
    
    return {
        "message": "Settings updated successfully",
        "settings": {
            "model_name": settings.model_name,
            "temperature": settings.temperature,
            "scaffolding_intensity": settings.scaffolding_intensity,
            "enable_citations": settings.enable_citations,
            "enable_sound_effects": settings.enable_sound_effects,
            "dark_mode": settings.dark_mode,
            "email_notifications": settings.email_notifications
        }
    }

@router.post("/export-data")
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a full educational data dump (GDPR/Data Portability compliant).
    """
    profile = current_user.profile
    masteries = db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
    mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id).all()
    quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).all()
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()

    now_iso = datetime.now(timezone.utc).isoformat()
    export_payload = {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        },
        "profile": {
            "target_exam": profile.target_exam if profile else "NEET",
            "streak_days": profile.streak_days if profile else 0,
            "xp": profile.xp if profile else 0,
            "accuracy_percentage": profile.accuracy_percentage if profile else 0,
            "questions_solved": profile.questions_solved if profile else 0
        },
        "topic_masteries": [
            {"subject": m.subject, "chapter": m.chapter, "topic": m.topic, "mastery": m.mastery_percentage}
            for m in masteries
        ],
        "mistakes_recorded": [
            {"subject": m.subject, "concept": m.concept, "type": m.mistake_type, "resolved": m.is_resolved}
            for m in mistakes
        ],
        "quizzes_completed_count": len(quizzes),
        "documents_uploaded_count": len(documents),
        "exported_at": now_iso
    }

    return {
        "status": "success",
        "export_timestamp": now_iso,
        "user_profile": export_payload["profile"],
        "user": export_payload["user"],
        "mastery_scores": export_payload["topic_masteries"],
        "mistakes_history": export_payload["mistakes_recorded"],
        "quizzes_count": len(quizzes),
        "documents_count": len(documents),
        "export": export_payload
    }

@router.post("/reset-history")
def reset_conversation_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clears all conversational chat messages and dialogue sessions for the student.
    """
    conversations = db.query(Conversation).filter(Conversation.user_id == current_user.id).all()
    deleted_count = len(conversations)
    for c in conversations:
        db.delete(c)
    db.commit()
    
    return {
        "message": f"Successfully reset {deleted_count} study dialogue sessions.",
        "cleared_dialogues": deleted_count
    }
