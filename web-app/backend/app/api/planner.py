from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/planner", tags=["Planner"])

@router.get("/today")
def get_planner_today(current_user: User = Depends(get_current_user)):
    return {"plan": []}
