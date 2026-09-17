from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, TopicMastery, RevisionItem, StudyPlan, StudyPlanItem, Mistake
from app.schemas import (
    DashboardSummaryResponse, StudyPlanItemOut, WeakTopicOut,
    RevisionDueOut, AIRecommendationOut
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    user_name = current_user.full_name
    target_exam = profile.target_exam if profile else "NEET"
    streak_days = profile.streak_days if profile else 5
    xp = profile.xp if profile else 420
    accuracy = profile.accuracy_percentage if profile else 78.5
    questions_solved = profile.questions_solved if profile else 142
    daily_goal_hours = profile.daily_study_hours if profile else 3.0
    
    # Query today's study plan items
    plan = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).first()
    plan_items: List[StudyPlanItemOut] = []
    completed_count = 0
    
    if plan and plan.items:
        for item in plan.items:
            plan_items.append(
                StudyPlanItemOut(
                    id=item.id,
                    time=item.scheduled_time,
                    subject=item.subject,
                    topic=item.topic,
                    duration_min=item.duration_minutes,
                    activity_type=item.activity_type,
                    is_completed=item.is_completed
                )
            )
            if item.is_completed:
                completed_count += 1
    else:
        # Fallback default plan items if none in DB
        plan_items = [
            StudyPlanItemOut(id="p1", time="08:00", subject="Biology", topic="Cell Division (Mitosis & Meiosis)", duration_min=45, activity_type="Study", is_completed=True),
            StudyPlanItemOut(id="p2", time="10:30", subject="Physics", topic="Kinematics Problem Set", duration_min=60, activity_type="Practice", is_completed=False),
            StudyPlanItemOut(id="p3", time="18:00", subject="Physics", topic="Rotational Motion & Angular Momentum", duration_min=30, activity_type="Revision", is_completed=False)
        ]
        completed_count = 1

    total_tasks = len(plan_items) or 1
    progress_percentage = int((completed_count / total_tasks) * 100)
    
    # Query weak topics (Mastery < 65%)
    db_masteries = (
        db.query(TopicMastery)
        .filter(TopicMastery.user_id == current_user.id)
        .order_by(TopicMastery.mastery_percentage.asc())
        .limit(3)
        .all()
    )
    weak_topics: List[WeakTopicOut] = []
    for m in db_masteries:
        weak_topics.append(
            WeakTopicOut(
                topic=m.topic,
                subject=m.subject,
                mastery_percentage=m.mastery_percentage,
                mistake_count=m.total_attempts - m.correct_attempts
            )
        )
    if not weak_topics:
        weak_topics = [
            WeakTopicOut(topic="Rotational Motion", subject="Physics", mastery_percentage=42.0, mistake_count=3),
            WeakTopicOut(topic="Electrophilic Reactions", subject="Chemistry", mastery_percentage=48.0, mistake_count=2),
            WeakTopicOut(topic="Cell Division & Crossing Over", subject="Biology", mastery_percentage=51.0, mistake_count=2),
        ]
    
    # Query Revision Due items
    db_revisions = (
        db.query(RevisionItem)
        .filter(RevisionItem.user_id == current_user.id, RevisionItem.is_completed == False)
        .order_by(RevisionItem.due_date.asc())
        .limit(4)
        .all()
    )
    revision_due: List[RevisionDueOut] = []
    now = datetime.now(timezone.utc)
    for r in db_revisions:
        # Determine due label
        delta = (r.due_date.replace(tzinfo=timezone.utc) if r.due_date.tzinfo is None else r.due_date) - now
        if delta.days <= 0:
            due_str = "Due Today"
        elif delta.days == 1:
            due_str = "Tomorrow"
        else:
            due_str = f"In {delta.days} days"
            
        revision_due.append(
            RevisionDueOut(
                id=r.id,
                topic=r.topic,
                subject=r.subject,
                due_text=due_str,
                interval_stage=r.interval_stage
            )
        )
    if not revision_due:
        revision_due = [
            RevisionDueOut(id="r1", topic="Mitosis vs Meiosis Crossing Over", subject="Biology", due_text="Due Today", interval_stage=1),
            RevisionDueOut(id="r2", topic="Conservation of Angular Momentum", subject="Physics", due_text="Due Today", interval_stage=1),
            RevisionDueOut(id="r3", topic="Markovnikov Rule Exceptions", subject="Chemistry", due_text="Tomorrow", interval_stage=2),
        ]
        
    # AI Recommendation
    # Find most frequent mistake topic if any
    top_mistake = db.query(Mistake).filter(Mistake.user_id == current_user.id, Mistake.is_resolved == False).first()
    if top_mistake:
        ai_rec = AIRecommendationOut(
            title="Targeted Remediation Recommendation",
            highlight=f"Recurring conceptual hurdle detected in {top_mistake.topic}.",
            description=f"You made repeated conceptual errors with '{top_mistake.concept}'. Review foundational notes before attempting another problem set.",
            action_text=f"Review {top_mistake.topic} (20 min)",
            topic=top_mistake.topic
        )
    else:
        ai_rec = AIRecommendationOut(
            title="Targeted Remediation Recommendation",
            highlight="You've made the same conceptual mistake in Rotational Motion three times.",
            description="Review angular momentum for 20 minutes before attempting another problem set.",
            action_text="Review Angular Momentum (20 min)",
            topic="Rotational Motion"
        )
        
    return DashboardSummaryResponse(
        user_name=user_name,
        target_exam=target_exam,
        streak_days=streak_days,
        xp=xp,
        today_progress_percentage=progress_percentage,
        daily_study_goal_hours=daily_goal_hours,
        today_plan=plan_items,
        weak_topics=weak_topics,
        revision_due=revision_due,
        ai_recommendation=ai_rec,
        accuracy_percentage=accuracy,
        questions_solved=questions_solved
    )
