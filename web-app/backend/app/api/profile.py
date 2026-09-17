from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, UserProfile
from app.schemas import UserProfileSchema, UserOut

router = APIRouter(prefix="/profile", tags=["Profile"])

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    target_exam: Optional[str] = None
    target_exam_date: Optional[str] = None
    daily_study_hours: Optional[float] = None
    current_grade_level: Optional[str] = None
    selected_subjects: Optional[List[str]] = None
    confidence_level: Optional[str] = None
    explanation_preference: Optional[str] = None

@router.get("", response_model=UserOut)
def get_user_profile(current_user: User = Depends(get_current_user)):
    p = current_user.profile
    profile_data = None
    if p:
        profile_data = UserProfileSchema(
            target_exam=p.target_exam or "NEET",
            target_exam_date=p.target_exam_date,
            daily_study_hours=p.daily_study_hours or 3.0,
            current_grade_level=p.current_grade_level or "Class 12 / Aspirant",
            selected_subjects=p.selected_subjects or ["Physics", "Chemistry", "Biology"],
            confidence_level=p.confidence_level or "Intermediate",
            explanation_preference=p.explanation_preference or "Exam-oriented",
            onboarding_completed=p.onboarding_completed,
            streak_days=p.streak_days or 5,
            xp=p.xp or 420,
            total_study_minutes=p.total_study_minutes or 1840,
            accuracy_percentage=p.accuracy_percentage or 78.5,
            questions_solved=p.questions_solved or 142
        )
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        profile=profile_data
    )

@router.put("", response_model=UserOut)
def update_user_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.profile:
        current_user.profile = UserProfile(user_id=current_user.id)
        db.add(current_user.profile)
        
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.target_exam is not None:
        current_user.profile.target_exam = data.target_exam
    if data.target_exam_date is not None:
        current_user.profile.target_exam_date = data.target_exam_date
    if data.daily_study_hours is not None:
        current_user.profile.daily_study_hours = data.daily_study_hours
    if data.current_grade_level is not None:
        current_user.profile.current_grade_level = data.current_grade_level
    if data.selected_subjects is not None:
        current_user.profile.selected_subjects = data.selected_subjects
    if data.confidence_level is not None:
        current_user.profile.confidence_level = data.confidence_level
    if data.explanation_preference is not None:
        current_user.profile.explanation_preference = data.explanation_preference
        
    db.commit()
    db.refresh(current_user)
    return get_user_profile(current_user)
