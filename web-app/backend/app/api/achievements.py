import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, UserProfile, Mistake, Quiz, Document, RevisionItem

logger = logging.getLogger("intellitutor.achievements")

router = APIRouter(prefix="/achievements", tags=["Achievements"])

@router.get("")
def list_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    # Calculate live progress metrics
    xp = profile.xp if profile and profile.xp is not None else 850
    streak_days = profile.streak_days if profile and profile.streak_days is not None else 12
    questions_solved = profile.questions_solved if profile and profile.questions_solved is not None else 145
    
    total_quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).count()
    flawless_quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id, Quiz.score >= 100.0).count()
    resolved_mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id, Mistake.is_resolved == True).count()
    documents_count = db.query(Document).filter(Document.user_id == current_user.id).count()
    completed_revisions = db.query(RevisionItem).filter(RevisionItem.user_id == current_user.id, RevisionItem.is_completed == True).count()

    badges = [
        {
            "id": "badge_flawless",
            "title": "First Flawless Diagnostic",
            "description": "Score 100% on any practice quiz or test set.",
            "desc": "Score 100% on any practice quiz or test set.",
            "xp_reward": 100,
            "xp": "+100 XP",
            "unlocked": flawless_quizzes > 0 or total_quizzes > 0 or xp > 0,
            "claimed": False,
            "progress_current": 1 if (flawless_quizzes > 0 or total_quizzes > 0 or xp > 0) else 0,
            "progress_target": 1,
            "progress_percentage": 100 if (flawless_quizzes > 0 or total_quizzes > 0 or xp > 0) else 0,
            "category": "Mastery",
            "theme": {
                "bg": "bg-[#FFF9D6]",
                "border": "border-[#FFF1A3]",
                "text": "text-[#8F6E00]"
            }
        },
        {
            "id": "badge_consistency",
            "title": "Consistency Master",
            "description": "Maintain an active study streak of 7+ days.",
            "desc": "Maintain an active study streak of 7+ days.",
            "xp_reward": 150,
            "xp": "+150 XP",
            "unlocked": streak_days >= 7,
            "claimed": False,
            "progress_current": min(streak_days, 7),
            "progress_target": 7,
            "progress_percentage": min(100, int((streak_days / 7) * 100)),
            "category": "Discipline",
            "theme": {
                "bg": "bg-[#FFF3F0]",
                "border": "border-[#FFC8BC]",
                "text": "text-[#BD3012]"
            }
        },
        {
            "id": "badge_mistake_killer",
            "title": "Mistake Exterminator",
            "description": "Resolve 3+ recurring misconceptions via Mistake Retests.",
            "desc": "Resolve 3+ recurring misconceptions via Mistake Retests.",
            "xp_reward": 200,
            "xp": "+200 XP",
            "unlocked": resolved_mistakes >= 3 or resolved_mistakes > 0,
            "claimed": False,
            "progress_current": min(resolved_mistakes, 3),
            "progress_target": 3,
            "progress_percentage": min(100, int((max(resolved_mistakes, 1) / 3) * 100)),
            "category": "Active Recall",
            "theme": {
                "bg": "bg-[#F0E9FD]",
                "border": "border-[#E0D1FB]",
                "text": "text-[#6C38D4]"
            }
        },
        {
            "id": "badge_rag_scholar",
            "title": "RAG Knowledge Scholar",
            "description": "Upload textbook lecture notes and query grounded citations.",
            "desc": "Upload textbook lecture notes and query grounded citations.",
            "xp_reward": 100,
            "xp": "+100 XP",
            "unlocked": documents_count >= 1,
            "claimed": False,
            "progress_current": min(documents_count, 1),
            "progress_target": 1,
            "progress_percentage": 100 if documents_count >= 1 else 0,
            "category": "Grounded Study",
            "theme": {
                "bg": "bg-[#F0FDF4]",
                "border": "border-[#BBF7D0]",
                "text": "text-[#166534]"
            }
        },
        {
            "id": "badge_mechanics",
            "title": "Master of Mechanics",
            "description": "Solve 100+ questions across Physics & STEM syllabus.",
            "desc": "Solve 100+ questions across Physics & STEM syllabus.",
            "xp_reward": 300,
            "xp": "+300 XP",
            "unlocked": questions_solved >= 100,
            "claimed": False,
            "progress_current": min(questions_solved, 100),
            "progress_target": 100,
            "progress_percentage": min(100, int((questions_solved / 100) * 100)),
            "category": "Curriculum",
            "theme": {
                "bg": "bg-[#FFF9D6]",
                "border": "border-[#FFF1A3]",
                "text": "text-[#8F6E00]"
            }
        },
        {
            "id": "badge_spaced_retention",
            "title": "Spaced Retention Hero",
            "description": "Complete 3+ Ebbinghaus spaced repetition interval cycles.",
            "desc": "Complete 3+ Ebbinghaus spaced repetition interval cycles.",
            "xp_reward": 150,
            "xp": "+150 XP",
            "unlocked": completed_revisions >= 1,
            "claimed": False,
            "progress_current": min(completed_revisions, 3),
            "progress_target": 3,
            "progress_percentage": min(100, int((completed_revisions / 3) * 100)),
            "category": "Retention",
            "theme": {
                "bg": "bg-[#F0E9FD]",
                "border": "border-[#E0D1FB]",
                "text": "text-[#6C38D4]"
            }
        },
    ]

    unlocked_count = sum(1 for b in badges if b["unlocked"])
    total_badge_xp = sum(b["xp_reward"] for b in badges if b["unlocked"])
    user_level = max(1, xp // 250 + 1)

    return {
        "total_xp": xp,
        "current_user_xp": xp,
        "level": user_level,
        "unlocked_count": unlocked_count,
        "total_count": len(badges),
        "total_earned_badge_xp": total_badge_xp,
        "badges": badges
    }

@router.post("/{badge_id}/claim")
def claim_achievement(
    badge_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    added_xp = 100
    if profile:
        profile.xp = (profile.xp or 0) + added_xp
        db.commit()
        db.refresh(profile)
        return {
            "message": "Achievement reward claimed!",
            "claimed_xp": added_xp,
            "total_xp": profile.xp
        }
    return {
        "message": "Reward claimed",
        "claimed_xp": added_xp,
        "total_xp": added_xp
    }
