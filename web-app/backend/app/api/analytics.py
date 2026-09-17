from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview(current_user: User = Depends(get_current_user)):
    return {
        "overall_mastery": 68.4,
        "accuracy": 78.5,
        "study_hours": 30.6,
        "questions_solved": 142
    }
