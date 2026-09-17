from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

@router.get("")
def list_quizzes(current_user: User = Depends(get_current_user)):
    return {"quizzes": []}
