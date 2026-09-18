import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, DiagramItem
from app.ai.diagram_engine import DiagramEngine

logger = logging.getLogger("intellitutor.api.diagrams")

router = APIRouter(prefix="/diagrams", tags=["Diagrams"])

class GenerateDiagramRequest(BaseModel):
    topic: str
    subject: str = "Physics"

@router.get("")
def list_diagrams(
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    diagrams = DiagramEngine.get_all_diagrams()
    if subject and subject != "All":
        diagrams = [d for d in diagrams if d["subject"].lower() == subject.lower()]
        
    return {
        "count": len(diagrams),
        "diagrams": [
            {
                "id": d["id"],
                "title": d["title"],
                "subject": d["subject"],
                "chapter": d["chapter"],
                "topic": d["topic"],
                "diagram_type": d["diagram_type"],
                "labels_count": len(d["labels"]),
                "related_formulas": d["related_formulas"],
                "simplified_view_code": d["simplified_view_code"]
            }
            for d in diagrams
        ]
    }

@router.get("/{diagram_id}")
def get_diagram_details(
    diagram_id: str,
    current_user: User = Depends(get_current_user)
):
    diag = DiagramEngine.get_diagram_by_id(diagram_id)
    if not diag:
        raise HTTPException(status_code=404, detail="Diagram not found")
        
    return diag

@router.post("/generate")
def generate_diagram(
    req: GenerateDiagramRequest,
    current_user: User = Depends(get_current_user)
):
    diagram_data = DiagramEngine.generate_custom_diagram(topic=req.topic, subject=req.subject)
    return {"message": "Custom diagram generated", "diagram": diagram_data}
