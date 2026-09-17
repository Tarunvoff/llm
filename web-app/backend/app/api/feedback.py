import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, Message

logger = logging.getLogger("intellitutor.feedback")

router = APIRouter(prefix="/feedback", tags=["Feedback"])

class FeedbackSubmission(BaseModel):
    message_id: Optional[str] = None
    rating: int = Field(ge=-1, le=1) # 1 (positive), -1 (negative), 0 (neutral)
    comment: Optional[str] = None
    category: Optional[str] = "Pedagogical Clarity"

@router.post("")
def submit_feedback(
    req: FeedbackSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.message_id:
        msg = db.query(Message).filter(Message.id == req.message_id).first()
        if msg:
            msg.feedback_rating = req.rating
            db.commit()
            
    logger.info(f"Feedback received from {current_user.email}: rating={req.rating}, category={req.category}, comment={req.comment}")
    return {"message": "Thank you for your feedback! It helps improve our pedagogical AI tutor.", "status": "recorded"}
