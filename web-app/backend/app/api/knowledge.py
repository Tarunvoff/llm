import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import (
    User, KnowledgeItem, Document, DocumentChunk, Flashcard,
    PYQItem, Mistake, VideoResource, DiagramItem, Conversation
)
from app.ai.knowledge_extractor import KnowledgeExtractorService

logger = logging.getLogger("intellitutor.api.knowledge")

router = APIRouter(prefix="/knowledge", tags=["Knowledge Hub"])

class CreateKnowledgeRequest(BaseModel):
    type: str = "CONCEPT"
    title: str
    content: str
    summary: Optional[str] = None
    subject: str = "Physics"
    chapter: str = "General"
    topic: str = "General"
    importance_score: float = 8.5
    formula_equation: Optional[str] = None
    variables_explanation: Optional[Dict[str, str]] = None
    tags: Optional[List[str]] = []
    source_reference: Optional[str] = None

class ExtractDocumentKnowledgeRequest(BaseModel):
    document_id: Optional[str] = None
    raw_text: Optional[str] = None
    subject: str = "Physics"
    chapter: str = "General"
    topic: str = "General"

class SearchRequest(BaseModel):
    query: str
    subject: Optional[str] = None

@router.get("")
def list_knowledge_items(
    type: Optional[str] = None,
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    is_pinned: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(KnowledgeItem).filter(KnowledgeItem.user_id == current_user.id)
    
    if type and type != "ALL":
        query = query.filter(KnowledgeItem.type == type.upper())
    if subject and subject != "All":
        query = query.filter(KnowledgeItem.subject == subject)
    if topic:
        query = query.filter(KnowledgeItem.topic.ilike(f"%{topic}%"))
    if is_pinned is not None:
        query = query.filter(KnowledgeItem.is_pinned == is_pinned)
    if search:
        query = query.filter(
            (KnowledgeItem.title.ilike(f"%{search}%")) |
            (KnowledgeItem.content.ilike(f"%{search}%")) |
            (KnowledgeItem.topic.ilike(f"%{search}%"))
        )
        
    items = query.order_by(KnowledgeItem.is_pinned.desc(), KnowledgeItem.importance_score.desc(), KnowledgeItem.created_at.desc()).all()
    
    return {
        "count": len(items),
        "items": [
            {
                "id": item.id,
                "type": item.type,
                "title": item.title,
                "content": item.content,
                "summary": item.summary,
                "subject": item.subject,
                "chapter": item.chapter,
                "topic": item.topic,
                "importance_score": item.importance_score,
                "confidence_score": item.confidence_score,
                "mastery_score": item.mastery_score,
                "formula_equation": item.formula_equation,
                "variables_explanation": item.variables_explanation or {},
                "recurring_pattern": item.recurring_pattern,
                "is_pinned": item.is_pinned,
                "tags": item.tags or [],
                "source_reference": item.source_reference,
                "created_at": item.created_at.isoformat() if item.created_at else None
            }
            for item in items
        ]
    }

@router.get("/{item_id}")
def get_knowledge_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id, KnowledgeItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
        
    # Fetch related flashcards & mistakes
    cards = db.query(Flashcard).filter(Flashcard.user_id == current_user.id, Flashcard.topic == item.topic).all()
    mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id, Mistake.topic == item.topic).all()
    
    return {
        "id": item.id,
        "type": item.type,
        "title": item.title,
        "content": item.content,
        "summary": item.summary,
        "subject": item.subject,
        "chapter": item.chapter,
        "topic": item.topic,
        "importance_score": item.importance_score,
        "mastery_score": item.mastery_score,
        "formula_equation": item.formula_equation,
        "variables_explanation": item.variables_explanation or {},
        "recurring_pattern": item.recurring_pattern,
        "is_pinned": item.is_pinned,
        "tags": item.tags or [],
        "source_reference": item.source_reference,
        "related_flashcards_count": len(cards),
        "related_mistakes_count": len(mistakes)
    }

@router.post("")
def create_knowledge_item(
    req: CreateKnowledgeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = KnowledgeItem(
        user_id=current_user.id,
        type=req.type.upper(),
        title=req.title,
        content=req.content,
        summary=req.summary or req.content[:150],
        subject=req.subject,
        chapter=req.chapter,
        topic=req.topic,
        importance_score=req.importance_score,
        formula_equation=req.formula_equation,
        variables_explanation=req.variables_explanation or {},
        tags=req.tags or [],
        source_reference=req.source_reference
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"message": "Knowledge item created", "item": {"id": item.id, "title": item.title}}

@router.post("/extract")
def extract_knowledge_from_text(
    req: ExtractDocumentKnowledgeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    text_to_process = req.raw_text or ""
    source_title = "User Input"
    doc_id = None
    
    if req.document_id:
        doc = db.query(Document).filter(Document.id == req.document_id, Document.user_id == current_user.id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        doc_id = doc.id
        source_title = doc.title
        chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).all()
        text_to_process = "\n\n".join([c.content for c in chunks[:5]]) if chunks else doc.title

    if not text_to_process:
        text_to_process = f"Important study notes on {req.topic} in {req.subject} covering core principles, governing equations, and exam patterns."

    extracted = KnowledgeExtractorService.extract_knowledge(
        text=text_to_process,
        subject=req.subject,
        chapter=req.chapter,
        topic=req.topic,
        source_title=source_title
    )

    created_knowledge_ids = []
    for k in extracted.get("knowledge_items", []):
        ki = KnowledgeItem(
            user_id=current_user.id,
            source_document_id=doc_id,
            type=k.get("type", "CONCEPT"),
            title=k.get("title", f"{req.topic} Insight"),
            content=k.get("content", ""),
            summary=k.get("summary", ""),
            subject=req.subject,
            chapter=req.chapter,
            topic=req.topic,
            importance_score=k.get("importance_score", 8.5),
            confidence_score=k.get("confidence_score", 0.9),
            formula_equation=k.get("formula_equation"),
            variables_explanation=k.get("variables_explanation", {}),
            recurring_pattern=k.get("recurring_pattern"),
            tags=k.get("tags", []),
            source_reference=source_title
        )
        db.add(ki)
        db.flush()
        created_knowledge_ids.append(ki.id)

    # Also automatically seed the extracted flashcards
    created_flashcard_ids = []
    for fc in extracted.get("flashcards", []):
        f = Flashcard(
            user_id=current_user.id,
            subject=req.subject,
            chapter=req.chapter,
            topic=req.topic,
            card_type=fc.get("card_type", "CONCEPT"),
            front=fc.get("front", ""),
            back=fc.get("back", ""),
            hint=fc.get("hint"),
            source_reference=source_title,
            retention_state="NEW"
        )
        db.add(f)
        db.flush()
        created_flashcard_ids.append(f.id)

    db.commit()

    return {
        "message": f"Successfully extracted {len(created_knowledge_ids)} knowledge nodes and {len(created_flashcard_ids)} flashcards.",
        "extracted_knowledge_count": len(created_knowledge_ids),
        "extracted_flashcards_count": len(created_flashcard_ids)
    }

@router.put("/{item_id}/toggle-pin")
def toggle_pin_knowledge_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id, KnowledgeItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
        
    item.is_pinned = not item.is_pinned
    db.commit()
    return {"id": item.id, "is_pinned": item.is_pinned}

@router.delete("/{item_id}")
def delete_knowledge_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id, KnowledgeItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    db.delete(item)
    db.commit()
    return {"message": "Knowledge item deleted successfully"}

@router.post("/search")
def unified_global_search(
    req: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Phase 24: Global User-Scoped Search (Ctrl+K Command Palette)
    Searches across: Knowledge, Documents, Formulas, PYQs, Flashcards, Mistakes, Videos, Conversations.
    """
    query_str = f"%{req.query}%"
    
    # 1. Knowledge items & formulas
    knowledge = db.query(KnowledgeItem).filter(
        KnowledgeItem.user_id == current_user.id,
        (KnowledgeItem.title.ilike(query_str)) | (KnowledgeItem.content.ilike(query_str)) | (KnowledgeItem.topic.ilike(query_str))
    ).limit(6).all()
    
    # 2. Documents
    docs = db.query(Document).filter(
        Document.user_id == current_user.id,
        (Document.title.ilike(query_str)) | (Document.subject.ilike(query_str))
    ).limit(4).all()
    
    # 3. Flashcards
    cards = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        (Flashcard.front.ilike(query_str)) | (Flashcard.back.ilike(query_str)) | (Flashcard.topic.ilike(query_str))
    ).limit(5).all()
    
    # 4. PYQs
    pyqs = db.query(PYQItem).filter(
        (PYQItem.question_text.ilike(query_str)) | (PYQItem.topic.ilike(query_str)) | (PYQItem.key_formula_used.ilike(query_str))
    ).limit(4).all()
    
    # 5. Mistakes
    mistakes = db.query(Mistake).filter(
        Mistake.user_id == current_user.id,
        (Mistake.concept.ilike(query_str)) | (Mistake.question_text.ilike(query_str))
    ).limit(4).all()
    
    # 6. Videos
    videos = db.query(VideoResource).filter(
        (VideoResource.title.ilike(query_str)) | (VideoResource.topic.ilike(query_str))
    ).limit(4).all()

    return {
        "query": req.query,
        "results": {
            "knowledge": [{"id": k.id, "title": k.title, "type": k.type, "topic": k.topic, "subject": k.subject} for k in knowledge],
            "documents": [{"id": d.id, "title": d.title, "subject": d.subject, "pages": d.page_count} for d in docs],
            "flashcards": [{"id": c.id, "front": c.front[:80], "topic": c.topic, "card_type": c.card_type} for c in cards],
            "pyqs": [{"id": p.id, "year": p.year, "exam_name": p.exam_name, "topic": p.topic, "question_snippet": p.question_text[:100]} for p in pyqs],
            "mistakes": [{"id": m.id, "concept": m.concept, "mistake_type": m.mistake_type, "subject": m.subject} for m in mistakes],
            "videos": [{"id": v.id, "title": v.title, "channel": v.channel, "duration_minutes": v.duration_minutes} for v in videos]
        }
    }
