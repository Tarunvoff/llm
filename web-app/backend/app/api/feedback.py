from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.post("")
def submit_feedback(payload: dict, current_user: User = Depends(get_current_user)):
    return {"status": "success", "message": "Feedback recorded"}
