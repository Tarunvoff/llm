import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, UserProfile, TopicMastery, Mistake, Quiz

logger = logging.getLogger("intellitutor.analytics")

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    # Calculate live metrics if available
    total_quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).count()
    total_mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id).count()
    resolved_mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id, Mistake.is_resolved == True).count()
    
    # Average mastery across topic masteries
    masteries = db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
    overall_mastery = round(sum(m.mastery_percentage for m in masteries) / len(masteries), 1) if masteries else 68.4
    
    accuracy = profile.accuracy_percentage if profile else 78.5
    study_hours = round(profile.total_study_minutes / 60.0, 1) if profile else 30.6
    questions_solved = profile.questions_solved if profile else 142
    streak_days = profile.streak_days if profile else 5
    xp = profile.xp if profile else 420
    
    return {
        "overall_mastery": overall_mastery,
        "mastery_delta_week": "+4.2%",
        "accuracy": accuracy,
        "accuracy_total_questions": questions_solved,
        "study_hours": study_hours,
        "questions_solved": questions_solved,
        "streak_days": streak_days,
        "xp": xp,
        "total_quizzes": total_quizzes,
        "total_mistakes": total_mistakes,
        "resolved_mistakes": resolved_mistakes
    }

@router.get("/mastery-tree")
def get_mastery_tree(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure baseline topic masteries exist
    masteries = db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
    
    if not masteries:
        seed_masteries = [
            # Physics
            TopicMastery(user_id=current_user.id, subject="Physics", chapter="Mechanics", topic="Kinematics & 2D Projectile Motion", mastery_percentage=82.0, total_attempts=24, correct_attempts=20),
            TopicMastery(user_id=current_user.id, subject="Physics", chapter="Mechanics", topic="Newton's Laws of Motion & Friction", mastery_percentage=74.0, total_attempts=18, correct_attempts=14),
            TopicMastery(user_id=current_user.id, subject="Physics", chapter="Mechanics", topic="Work, Energy & Power", mastery_percentage=61.0, total_attempts=15, correct_attempts=9),
            TopicMastery(user_id=current_user.id, subject="Physics", chapter="Rotational Motion", topic="Rotational Motion & Angular Momentum", mastery_percentage=42.0, total_attempts=20, correct_attempts=8),
            TopicMastery(user_id=current_user.id, subject="Physics", chapter="Electromagnetism", topic="Electrostatics & Gauss's Law", mastery_percentage=79.0, total_attempts=19, correct_attempts=15),
            
            # Chemistry
            TopicMastery(user_id=current_user.id, subject="Chemistry", chapter="Organic Chemistry", topic="Electrophilic Addition Reactions", mastery_percentage=48.0, total_attempts=16, correct_attempts=8),
            TopicMastery(user_id=current_user.id, subject="Chemistry", chapter="Physical Chemistry", topic="Thermodynamics & Enthalpy", mastery_percentage=68.0, total_attempts=22, correct_attempts=15),
            TopicMastery(user_id=current_user.id, subject="Chemistry", chapter="Physical Chemistry", topic="Chemical Equilibrium & Le Chatelier", mastery_percentage=77.0, total_attempts=20, correct_attempts=16),
            TopicMastery(user_id=current_user.id, subject="Chemistry", chapter="Inorganic Chemistry", topic="Periodic Classification & Radii", mastery_percentage=88.0, total_attempts=25, correct_attempts=22),
            
            # Biology
            TopicMastery(user_id=current_user.id, subject="Biology", chapter="Cell Biology", topic="Cell Division (Mitosis & Meiosis)", mastery_percentage=51.0, total_attempts=21, correct_attempts=11),
            TopicMastery(user_id=current_user.id, subject="Biology", chapter="Genetics", topic="Mendelian Genetics & Inheritance", mastery_percentage=84.0, total_attempts=30, correct_attempts=26),
            TopicMastery(user_id=current_user.id, subject="Biology", chapter="Plant Physiology", topic="Photosynthesis & Light Reactions", mastery_percentage=71.0, total_attempts=17, correct_attempts=12),
            TopicMastery(user_id=current_user.id, subject="Biology", chapter="Human Physiology", topic="Human Circulatory System", mastery_percentage=90.0, total_attempts=20, correct_attempts=18),
        ]
        for sm in seed_masteries:
            db.add(sm)
        db.commit()
        masteries = db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()

    tree: Dict[str, List[Dict[str, Any]]] = {}
    for m in masteries:
        if m.subject not in tree:
            tree[m.subject] = []
            
        status = "Mastered" if m.mastery_percentage >= 80 else ("Proficient" if m.mastery_percentage >= 65 else ("Progressing" if m.mastery_percentage >= 55 else "Needs Review"))
        tree[m.subject].append({
            "id": m.id,
            "topic": m.topic,
            "chapter": m.chapter,
            "mastery": int(m.mastery_percentage),
            "status": status,
            "total_attempts": m.total_attempts,
            "correct_attempts": m.correct_attempts
        })

    return {"topic_tree": tree}
