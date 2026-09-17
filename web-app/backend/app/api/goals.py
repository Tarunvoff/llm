import logging
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, Goal

logger = logging.getLogger("intellitutor.goals")

router = APIRouter(prefix="/goals", tags=["Goals"])

class CreateGoalRequest(BaseModel):
    title: str
    target_metric: str
    current_metric: str = "0"
    progress_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    due_date_str: str = "This Month"
    variant: str = "coral" # coral, yellow, lavender, academic

def _serialize_goal(g: Goal) -> dict:
    return {
        "id": g.id,
        "title": g.title,
        "target": g.target_metric,
        "target_metric": g.target_metric,
        "current": g.current_metric,
        "current_metric": g.current_metric,
        "progress": int(g.progress_percentage),
        "progress_percentage": int(g.progress_percentage),
        "dueDate": g.due_date_str,
        "due_date_str": g.due_date_str,
        "variant": g.variant,
        "isCompleted": g.is_completed,
        "is_completed": g.is_completed,
        "createdAt": g.created_at.isoformat() if g.created_at else None
    }

@router.get("")
def list_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).order_by(Goal.created_at.asc()).all()
    
    # Seed default initial academic goals if empty
    if not goals:
        seed_goals = [
            Goal(
                user_id=current_user.id,
                title="Target Score NEET 650+",
                target_metric="650 / 720",
                current_metric="612",
                progress_percentage=85.0,
                due_date_str="May 2027",
                variant="coral",
                is_completed=False
            ),
            Goal(
                user_id=current_user.id,
                title="Resolve All Mechanics Mistakes",
                target_metric="100%",
                current_metric="75%",
                progress_percentage=75.0,
                due_date_str="This Week",
                variant="yellow",
                is_completed=False
            ),
            Goal(
                user_id=current_user.id,
                title="Complete 500 Practice Problems",
                target_metric="500",
                current_metric="210",
                progress_percentage=42.0,
                due_date_str="End of Month",
                variant="lavender",
                is_completed=False
            ),
            Goal(
                user_id=current_user.id,
                title="Maintain 14-Day Study Streak",
                target_metric="14 Days",
                current_metric="12 Days",
                progress_percentage=85.0,
                due_date_str="Ongoing",
                variant="academic",
                is_completed=False
            ),
        ]
        for g in seed_goals:
            db.add(g)
        db.commit()
        goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()

    return {
        "goals": [_serialize_goal(g) for g in goals]
    }

@router.post("")
def create_goal(
    req: CreateGoalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # calculate progress percentage if target is numeric / percentage
    progress = req.progress_percentage
    if progress == 0.0:
        try:
            # extract numbers if format like 140 / 180 or 75%
            if "/" in req.target_metric and "/" in req.current_metric:
                c_num = float(req.current_metric.split("/")[0].strip())
                t_num = float(req.target_metric.split("/")[0].strip())
                if t_num > 0:
                    progress = round((c_num / t_num) * 100, 1)
            elif "%" in req.target_metric:
                t_num = float(req.target_metric.replace("%", "").strip())
                c_num = float(req.current_metric.replace("%", "").strip()) if "%" in req.current_metric else float(req.current_metric)
                if t_num > 0:
                    progress = round((c_num / t_num) * 100, 1)
        except Exception:
            progress = 0.0

    goal = Goal(
        user_id=current_user.id,
        title=req.title,
        target_metric=req.target_metric,
        current_metric=req.current_metric,
        progress_percentage=progress,
        due_date_str=req.due_date_str,
        variant=req.variant,
        is_completed=(progress >= 100.0)
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    
    return {
        "message": "Goal created successfully",
        "goal": _serialize_goal(goal)
    }

@router.post("/{goal_id}/toggle")
def toggle_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    goal.is_completed = not goal.is_completed
    if goal.is_completed:
        goal.progress_percentage = 100.0
    db.commit()
    db.refresh(goal)
    
    return {
        "message": "Goal updated",
        "goal": _serialize_goal(goal)
    }

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}
