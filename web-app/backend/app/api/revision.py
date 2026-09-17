from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/revision", tags=["Revision"])

@router.get("/today")
def get_revision_today(current_user: User = Depends(get_current_user)):
    return {"topics": []}
