import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User
from app.ai.recommendation_engine import ResourceRecommendationService

logger = logging.getLogger("intellitutor.api.topics")

router = APIRouter(prefix="/topics", tags=["Unified Topic Center"])

@router.get("/{topic_name}/overview")
def get_unified_topic_overview(
    topic_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Phase 18: Unified Topic Study Desk.
    Aggregates Notes, Books, AI Explanation, Videos, Diagrams, Formulas, Flashcards,
    Practice, PYQs, Mistakes, Revision schedule, and Analytics into one central hub.
    """
    try:
        overview = ResourceRecommendationService.get_topic_360_overview(
            topic_name=topic_name,
            user=current_user,
            db=db
        )
        return {"overview": overview}
    except Exception as e:
        logger.error(f"Error fetching topic overview: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load topic overview: {str(e)}")
