import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, Document, DocumentChunk
from app.ai.rag_service import RAGService

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("")
def list_documents(
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if subject and subject != "All":
        query = query.filter(Document.subject == subject)
        
    docs = query.order_by(Document.created_at.desc()).all()
    
    results = []
    for d in docs:
        results.append({
            "id": d.id,
            "title": d.title,
            "subject": d.subject,
            "chapter": d.chapter or "General",
            "pages": d.page_count,
            "size": f"{round(d.file_size / (1024 * 1024), 1)} MB" if d.file_size > 1024 * 1024 else f"{round(d.file_size / 1024, 1)} KB",
            "status": d.status,
            "extracted_topics": d.extracted_topics or ["Foundational Principles", "Problem Applications"],
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "last_accessed": "Recently"
        })
    return {"documents": results}

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    subject: str = Form("Physics"),
    chapter: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file extension
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ["pdf", "txt", "docx", "png", "jpg", "jpeg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, TXT, DOCX, or Image files."
        )
        
    user_upload_dir = os.path.join(UPLOAD_DIR, current_user.id)
    os.makedirs(user_upload_dir, exist_ok=True)
    
    file_path = os.path.join(user_upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_size = os.path.getsize(file_path)
    
    doc = Document(
        user_id=current_user.id,
        title=file.filename,
        file_path=file_path,
        file_type=ext,
        file_size=file_size,
        subject=subject,
        chapter=chapter or "Chapter 1",
        status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Process document in background
    background_tasks.add_task(RAGService.process_and_index_document, db, doc)
    
    return {
        "status": "success",
        "message": "File uploaded successfully and indexing initiated",
        "document": {
            "id": doc.id,
            "title": doc.title,
            "subject": doc.subject,
            "status": "processing"
        }
    }

@router.get("/{document_id}")
def get_document_details(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).all()
    
    return {
        "id": doc.id,
        "title": doc.title,
        "subject": doc.subject,
        "chapter": doc.chapter,
        "pages": doc.page_count,
        "status": doc.status,
        "extracted_topics": doc.extracted_topics or [],
        "chunks_count": len(chunks),
        "chunks": [
            {
                "chunk_index": c.chunk_index,
                "page_number": c.page_number,
                "content": c.content[:200] + "..." if len(c.content) > 200 else c.content
            }
            for c in chunks[:10]
        ]
    }

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception as e:
        pass
        
    db.delete(doc)
    db.commit()
    return {"status": "success", "message": "Document deleted"}
