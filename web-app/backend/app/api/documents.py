from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("")
def list_documents(current_user: User = Depends(get_current_user)):
    return {"documents": []}
