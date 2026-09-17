from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])

@router.get("/conversations")
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"conversations": []}

@router.post("/chat")
def chat(payload: dict, current_user: User = Depends(get_current_user)):
    return {
        "answer": "This is a pedagogical response from IntelliTutor.",
        "citations": [],
        "related_topics": ["Foundational Laws"],
        "recommended_action": {"title": "Diagnostic Practice", "type": "practice"}
    }
