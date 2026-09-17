import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, RevisionItem, Mistake, TopicMastery

logger = logging.getLogger("intellitutor.revision")

router = APIRouter(prefix="/revision", tags=["Revision"])

class CreateRevisionItemRequest(BaseModel):
    subject: str
    topic: str
    interval_stage: int = 1

@router.get("")
def get_revision_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(RevisionItem).filter(RevisionItem.user_id == current_user.id).all()
    
    # Seed initial spaced repetition items if user has none
    if not items:
        now = datetime.now(timezone.utc)
        seed_items = [
            RevisionItem(
                user_id=current_user.id,
                subject="Physics",
                topic="Conservation of Angular Momentum",
                due_date=now,
                interval_stage=1,
                is_completed=False
            ),
            RevisionItem(
                user_id=current_user.id,
                subject="Biology",
                topic="Cell Division (Mitosis vs Meiosis)",
                due_date=now,
                interval_stage=1,
                is_completed=False
            ),
            RevisionItem(
                user_id=current_user.id,
                subject="Chemistry",
                topic="Markovnikov Addition & Carbocations",
                due_date=now + timedelta(days=1),
                interval_stage=2,
                is_completed=False
            ),
            RevisionItem(
                user_id=current_user.id,
                subject="Physics",
                topic="Work-Energy Theorem in Non-Conservative Fields",
                due_date=now + timedelta(days=7),
                interval_stage=3,
                is_completed=False
            ),
            RevisionItem(
                user_id=current_user.id,
                subject="Biology",
                topic="Enzyme Kinetics & Michaelis Constant",
                due_date=now + timedelta(days=7),
                interval_stage=3,
                is_completed=False
            ),
            RevisionItem(
                user_id=current_user.id,
                subject="Chemistry",
                topic="Thermodynamics & Enthalpy Calculation",
                due_date=now + timedelta(days=7),
                interval_stage=3,
                is_completed=False
            ),
            RevisionItem(
                user_id=current_user.id,
                subject="Physics",
                topic="Kinematics 2D Projectile Equations",
                due_date=now + timedelta(days=30),
                interval_stage=4,
                is_completed=False
            ),
            RevisionItem(
                user_id=current_user.id,
                subject="Chemistry",
                topic="Periodic Trends & Electronegativity",
                due_date=now + timedelta(days=30),
                interval_stage=4,
                is_completed=False
            ),
        ]
        for si in seed_items:
            db.add(si)
        db.commit()
        items = db.query(RevisionItem).filter(RevisionItem.user_id == current_user.id).all()

    # Group into 4 Spaced Repetition Buckets
    stage_map = {
        1: {"stage": "Stage 1 (Today)", "desc": "Immediate active recall after 24h", "variant": "coral", "interval": "24h Interval", "topics": []},
        2: {"stage": "Stage 2 (Tomorrow)", "desc": "3-Day memory stabilization interval", "variant": "yellow", "interval": "3d Interval", "topics": []},
        3: {"stage": "Stage 3 (In 7 Days)", "desc": "Weekly consolidation interval", "variant": "lavender", "interval": "7d Interval", "topics": []},
        4: {"stage": "Stage 4 (In 30 Days)", "desc": "Long-term permanent memory lock", "variant": "academic", "interval": "30d Interval", "topics": []},
    }

    for item in items:
        if not item.is_completed:
            stage_key = item.interval_stage if item.interval_stage in stage_map else 1
            stage_map[stage_key]["topics"].append({
                "id": item.id,
                "subject": item.subject,
                "topic": item.topic,
                "interval": stage_map[stage_key]["interval"],
                "dueDate": item.due_date.isoformat() if item.due_date else None,
                "isCompleted": item.is_completed
            })

    buckets = []
    for k in sorted(stage_map.keys()):
        b = stage_map[k]
        buckets.append({
            "stage": b["stage"],
            "desc": b["desc"],
            "count": len(b["topics"]),
            "variant": b["variant"],
            "topics": b["topics"]
        })

    return {
        "buckets": buckets,
        "total_due_today": len(stage_map[1]["topics"])
    }

@router.get("/today")
def get_revision_today(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = get_revision_schedule(current_user, db)
    today_bucket = schedule["buckets"][0] if schedule["buckets"] else {"topics": []}
    return {"topics": today_bucket.get("topics", [])}

@router.post("/{item_id}/complete")
def complete_revision_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(RevisionItem).filter(RevisionItem.id == item_id, RevisionItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Revision item not found")
        
    # Advance to next spaced repetition stage
    now = datetime.now(timezone.utc)
    if item.interval_stage == 1:
        item.interval_stage = 2
        item.due_date = now + timedelta(days=3)
    elif item.interval_stage == 2:
        item.interval_stage = 3
        item.due_date = now + timedelta(days=7)
    elif item.interval_stage == 3:
        item.interval_stage = 4
        item.due_date = now + timedelta(days=30)
    else:
        item.is_completed = True
        item.completed_at = now
        
    db.commit()
    return {
        "id": item.id,
        "interval_stage": item.interval_stage,
        "is_completed": item.is_completed,
        "next_due_date": item.due_date.isoformat() if item.due_date else None
    }

@router.post("/generate")
def generate_smart_revision_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Scans recent mistakes and low mastery topics to schedule new spaced repetition items.
    """
    mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id, Mistake.is_resolved == False).all()
    created_count = 0
    now = datetime.now(timezone.utc)
    
    for m in mistakes:
        # Check if already in revision
        existing = db.query(RevisionItem).filter(
            RevisionItem.user_id == current_user.id,
            RevisionItem.topic == m.concept,
            RevisionItem.is_completed == False
        ).first()
        if not existing:
            rev = RevisionItem(
                user_id=current_user.id,
                subject=m.subject,
                topic=m.concept,
                due_date=now,
                interval_stage=1,
                is_completed=False
            )
            db.add(rev)
            created_count += 1
            
    db.commit()
    return {"message": f"Generated {created_count} new spaced repetition tasks", "count": created_count}
