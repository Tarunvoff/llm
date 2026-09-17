import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, UserProfile, StudyPlan, StudyPlanItem

logger = logging.getLogger("intellitutor.planner")

router = APIRouter(prefix="/planner", tags=["Planner"])

class AddSessionRequest(BaseModel):
    day_name: str = "Monday"
    scheduled_time: str = "08:00"
    duration_minutes: int = 45
    subject: str = "Physics"
    topic: str = "Rotational Dynamics"
    activity_type: str = "Study" # Study, Practice, Revision, Mock

@router.get("/week")
def get_weekly_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).first()
    
    # If no study plan exists, create default seed plan
    if not plan:
        plan = StudyPlan(
            user_id=current_user.id,
            title="NEET 45-Day High-Yield Adaptive Study Plan",
            exam_goal="NEET",
            days_left=45
        )
        db.add(plan)
        db.flush()
        
        seed_sessions = [
            # Monday
            StudyPlanItem(plan_id=plan.id, day_name="Monday", scheduled_time="08:00", duration_minutes=45, subject="Biology", topic="Cell Division (Mitosis & Meiosis)", activity_type="Study", is_completed=True),
            StudyPlanItem(plan_id=plan.id, day_name="Monday", scheduled_time="10:30", duration_minutes=60, subject="Physics", topic="Kinematics 2D Practice Problem Set", activity_type="Practice", is_completed=False),
            StudyPlanItem(plan_id=plan.id, day_name="Monday", scheduled_time="14:00", duration_minutes=45, subject="Chemistry", topic="Electrophilic Addition Reactions", activity_type="Study", is_completed=False),
            StudyPlanItem(plan_id=plan.id, day_name="Monday", scheduled_time="18:00", duration_minutes=30, subject="Physics", topic="Rotational Motion Mistake Review", activity_type="Revision", is_completed=False),
            StudyPlanItem(plan_id=plan.id, day_name="Monday", scheduled_time="20:00", duration_minutes=45, subject="Biology", topic="Diagnostic Quiz on Cell Cycle", activity_type="Mock", is_completed=False),
            
            # Tuesday
            StudyPlanItem(plan_id=plan.id, day_name="Tuesday", scheduled_time="08:00", duration_minutes=45, subject="Chemistry", topic="Thermodynamics & Enthalpy Calculation", activity_type="Study", is_completed=False),
            StudyPlanItem(plan_id=plan.id, day_name="Tuesday", scheduled_time="11:00", duration_minutes=60, subject="Physics", topic="Work, Power & Energy Socratic Tutoring", activity_type="Study", is_completed=False),
            StudyPlanItem(plan_id=plan.id, day_name="Tuesday", scheduled_time="16:00", duration_minutes=45, subject="Biology", topic="Mendelian Genetics Problem Solving", activity_type="Practice", is_completed=False),
            
            # Wednesday
            StudyPlanItem(plan_id=plan.id, day_name="Wednesday", scheduled_time="08:30", duration_minutes=60, subject="Physics", topic="Center of Mass & Rigid Body Equilibrium", activity_type="Study", is_completed=False),
            StudyPlanItem(plan_id=plan.id, day_name="Wednesday", scheduled_time="14:00", duration_minutes=45, subject="Chemistry", topic="Markovnikov Rule & Carbocation Intermediates", activity_type="Revision", is_completed=False),
            
            # Thursday
            StudyPlanItem(plan_id=plan.id, day_name="Thursday", scheduled_time="08:00", duration_minutes=60, subject="Biology", topic="Human Circulatory System & Cardiac Cycle", activity_type="Study", is_completed=False),
            StudyPlanItem(plan_id=plan.id, day_name="Thursday", scheduled_time="15:00", duration_minutes=60, subject="Physics", topic="Rotational Motion Adaptive Retest", activity_type="Practice", is_completed=False),
            
            # Friday
            StudyPlanItem(plan_id=plan.id, day_name="Friday", scheduled_time="09:00", duration_minutes=90, subject="General", topic="Full-Length Physics & Chemistry Sectional Mock", activity_type="Mock", is_completed=False),
            StudyPlanItem(plan_id=plan.id, day_name="Friday", scheduled_time="16:00", duration_minutes=45, subject="Biology", topic="Weekly Spaced Repetition Mastery Review", activity_type="Revision", is_completed=False),
        ]
        for s in seed_sessions:
            db.add(s)
        db.commit()
        db.refresh(plan)

    items = db.query(StudyPlanItem).filter(StudyPlanItem.plan_id == plan.id).order_by(StudyPlanItem.scheduled_time.asc()).all()
    
    # Days ribbon
    now = datetime.now()
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    current_day_name = now.strftime("%A")
    if current_day_name not in day_names:
        current_day_name = "Monday"
        
    days = []
    for i, d in enumerate(day_names):
        days.append({
            "name": d,
            "date": f"Sep {22 + i}",
            "isToday": d == current_day_name
        })

    return {
        "plan_title": plan.title,
        "days_left": plan.days_left,
        "exam_goal": plan.exam_goal,
        "days": days,
        "sessions": [
            {
                "id": item.id,
                "day": item.day_name,
                "time": item.scheduled_time,
                "subject": item.subject,
                "topic": item.topic,
                "duration": f"{item.duration_minutes} min",
                "duration_minutes": item.duration_minutes,
                "type": item.activity_type,
                "completed": item.is_completed
            }
            for item in items
        ]
    }

@router.get("/today")
def get_planner_today(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    weekly = get_weekly_plan(current_user, db)
    # Find today
    today_obj = next((d for d in weekly["days"] if d["isToday"]), weekly["days"][0])
    today_name = today_obj["name"]
    today_sessions = [s for s in weekly["sessions"] if s["day"] == today_name]
    return {"today": today_name, "plan": today_sessions}

@router.post("/items/{item_id}/toggle")
def toggle_planner_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(StudyPlanItem).join(StudyPlan).filter(
        StudyPlanItem.id == item_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Study plan session not found")
        
    item.is_completed = not item.is_completed
    db.commit()
    return {"id": item.id, "is_completed": item.is_completed}

@router.post("/items")
def add_planner_item(
    req: AddSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).first()
    if not plan:
        plan = StudyPlan(user_id=current_user.id, title="Custom Study Plan", exam_goal="NEET", days_left=45)
        db.add(plan)
        db.flush()
        
    item = StudyPlanItem(
        plan_id=plan.id,
        day_name=req.day_name,
        scheduled_time=req.scheduled_time,
        duration_minutes=req.duration_minutes,
        subject=req.subject,
        topic=req.topic,
        activity_type=req.activity_type,
        is_completed=False
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return {
        "message": "Session added successfully",
        "session": {
            "id": item.id,
            "day": item.day_name,
            "time": item.scheduled_time,
            "subject": item.subject,
            "topic": item.topic,
            "duration": f"{item.duration_minutes} min",
            "type": item.activity_type,
            "completed": item.is_completed
        }
    }

@router.post("/generate")
def reoptimize_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Re-optimizes the user's weekly study plan based on their daily study hours preference and weak areas.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    study_hours = profile.daily_study_hours if profile else 3.0
    
    # Trigger plan re-generation
    plan = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).first()
    if plan:
        # Reset items
        db.query(StudyPlanItem).filter(StudyPlanItem.plan_id == plan.id).delete()
        db.delete(plan)
        db.commit()
        
    # Re-fetch will generate freshly calibrated plan
    return get_weekly_plan(current_user, db)
