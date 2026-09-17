from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/mistakes", tags=["Mistakes"])

@router.get("")
def list_mistakes(current_user: User = Depends(get_current_user)):
    return {"mistakes": []}
