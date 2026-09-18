import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, VideoResource, VideoInteraction, TopicMastery, Mistake
from app.ai.video_provider import VideoProvider
from app.ai.recommendation_engine import ResourceRecommendationService

logger = logging.getLogger("intellitutor.api.resources")

router = APIRouter(prefix="/resources", tags=["Personalized Resources & Recommender"])

class VideoFeedbackRequest(BaseModel):
    feedback_rating: str # Useful, Too basic, Too advanced, Too long, Didnt help
    watch_percentage: Optional[float] = 100.0

class VideoInteractionRequest(BaseModel):
    watch_percentage: float
    is_completed: Optional[bool] = False
    is_saved: Optional[bool] = None
    is_liked: Optional[bool] = None

@router.get("/videos")
def get_recommended_videos(
    topic: Optional[str] = None,
    subject: Optional[str] = None,
    style: Optional[str] = None, # Visual, Conceptual, Problem solving, Fast revision, Detailed lecture, Exam-oriented
    duration_category: Optional[str] = None, # Short, Medium, Long
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns personalized video recommendations ranked by student's weak topics,
    learning style preferences, and duration choices.
    """
    # If no topic specified, target the user's lowest mastery topic
    target_topic = topic
    target_subject = subject or "Physics"
    if not target_topic:
        weakest = db.query(TopicMastery).filter(
            TopicMastery.user_id == current_user.id
        ).order_by(TopicMastery.mastery_percentage.asc()).first()
        if weakest:
            target_topic = weakest.topic
            target_subject = weakest.subject
        else:
            target_topic = "Conservation of Angular Momentum"

    user_style = style or (current_user.profile.explanation_preference if current_user.profile else "Visual")

    videos = VideoProvider.search_videos(
        topic=target_topic,
        subject=target_subject,
        preferred_style=user_style,
        duration_category=duration_category
    )

    # Fetch user interactions on these videos
    interactions = db.query(VideoInteraction).filter(VideoInteraction.user_id == current_user.id).all()
    int_map = {i.video_id: i for i in interactions}

    results = []
    for v in videos:
        interaction = int_map.get(v["id"])
        results.append({
            "id": v["id"],
            "title": v["title"],
            "channel": v["channel"],
            "topic": v["topic"],
            "subject": v["subject"],
            "duration_minutes": v["duration_minutes"],
            "duration_category": v["duration_category"],
            "style": v["style"],
            "language": v["language"],
            "video_id_or_url": v["video_id_or_url"],
            "thumbnail_url": v["thumbnail_url"],
            "difficulty": v["difficulty"],
            "why_recommended": v.get("why_recommended", f"Recommended for strengthening {v['topic']}"),
            "interaction": {
                "watch_percentage": interaction.watch_percentage,
                "is_completed": interaction.is_completed,
                "is_saved": interaction.is_saved,
                "is_liked": interaction.is_liked,
                "feedback_rating": interaction.feedback_rating
            } if interaction else None
        })

    return {
        "target_topic": target_topic,
        "target_subject": target_subject,
        "videos": results
    }

@router.post("/videos/{video_id}/feedback")
def submit_video_feedback(
    video_id: str,
    req: VideoFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Phase 16: Log video feedback (Useful, Too basic, Too advanced, Too long, Didn't help)
    to steer future recommendation weights.
    """
    interaction = db.query(VideoInteraction).filter(
        VideoInteraction.user_id == current_user.id,
        VideoInteraction.video_id == video_id
    ).first()

    now = datetime.now(timezone.utc)
    if not interaction:
        interaction = VideoInteraction(
            user_id=current_user.id,
            video_id=video_id,
            watch_percentage=req.watch_percentage or 100.0,
            is_completed=True,
            feedback_rating=req.feedback_rating,
            updated_at=now
        )
        db.add(interaction)
    else:
        interaction.feedback_rating = req.feedback_rating
        if req.watch_percentage:
            interaction.watch_percentage = max(interaction.watch_percentage, req.watch_percentage)
        interaction.updated_at = now

    db.commit()
    return {"message": "Feedback recorded", "video_id": video_id, "feedback": req.feedback_rating}

@router.post("/videos/{video_id}/interaction")
def log_video_interaction(
    video_id: str,
    req: VideoInteractionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interaction = db.query(VideoInteraction).filter(
        VideoInteraction.user_id == current_user.id,
        VideoInteraction.video_id == video_id
    ).first()

    now = datetime.now(timezone.utc)
    if not interaction:
        interaction = VideoInteraction(
            user_id=current_user.id,
            video_id=video_id,
            watch_percentage=req.watch_percentage,
            is_completed=req.is_completed or (req.watch_percentage >= 90.0),
            is_saved=req.is_saved or False,
            is_liked=req.is_liked or False,
            updated_at=now
        )
        db.add(interaction)
    else:
        interaction.watch_percentage = max(interaction.watch_percentage, req.watch_percentage)
        if req.is_completed is not None:
            interaction.is_completed = req.is_completed
        if req.is_saved is not None:
            interaction.is_saved = req.is_saved
        if req.is_liked is not None:
            interaction.is_liked = req.is_liked
        interaction.updated_at = now

    db.commit()
    return {"status": "success", "video_id": video_id, "watch_percentage": interaction.watch_percentage}

@router.get("/next-action")
def get_what_should_i_do_now(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Phase 19: Prominent singular 'What should I study now?' recommendation.
    """
    rec = ResourceRecommendationService.get_what_should_i_do_now(user=current_user, db=db)
    return {"recommendation": rec}

@router.get("/retention-matrix")
def get_retention_decay_matrix(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns Ebbinghaus memory retention decay matrix across all student topics.
    """
    results = ResourceRecommendationService.compute_ebbinghaus_retention(user_id=current_user.id, db=db)
    at_risk = [r for r in results if r["needs_recall_drill"]]
    
    return {
        "overall_retention_score": round(sum(r["predicted_retention_pct"] for r in results) / len(results), 1) if results else 85.0,
        "topics_at_risk_count": len(at_risk),
        "matrix": results
    }
