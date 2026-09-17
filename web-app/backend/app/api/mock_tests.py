from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/mock-tests", tags=["Mock Tests"])

@router.get("")
def list_mock_tests(current_user: User = Depends(get_current_user)):
    return {"mock_tests": []}
