import json
import asyncio
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, Conversation, Message, TopicMastery
from app.ai.gemini import ai_service
from app.ai.rag_service import RAGService

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    prompt: str
    explanation_mode: str = "Exam-oriented" # Child, Beginner, Intermediate, Expert, Exam-oriented
    subject: Optional[str] = "Physics"
    topic: Optional[str] = None

class QuickActionRequest(BaseModel):
    conversation_id: str
    action_type: str # simpler, example, quiz, formula, test_me
    current_topic: str
    explanation_mode: str = "Exam-oriented"

def get_system_prompt_for_mode(mode: str, rag_context: str = "") -> str:
    base_pedagogy = (
        "You are IntelliTutor AI, an elite Socratic personal study coach.\n"
        "Your core pedagogical goals:\n"
        "1. Explain with crystal clarity, precision, and pedagogical structure.\n"
        "2. Withhold premature direct answers to complex problems; guide through Socratic steps.\n"
        "3. Highlight critical formulas, sign conventions, and common competitive exam traps.\n"
        "4. If relevant source material is provided below, ground your explanations in it and reference citations accurately.\n"
        "5. If source context is empty or insufficient, provide accurate pedagogical reasoning but do NOT hallucinate fake citations.\n\n"
    )
    
    mode_instructions = {
        "Child": "Explain Like I'm 10: Use everyday analogies (bicycles, seesaws, water pipes), simple words, and zero jargon.",
        "Beginner": "Beginner Friendly: Break down foundational terms, explain the intuitive 'why' behind each step.",
        "Intermediate": "Structured & Balanced: Provide clear conceptual derivation, mathematical definition, and a standard example.",
        "Expert": "Rigorous & Advanced: Focus on first-principles physics/math, edge cases, tensor/vector notations, and boundary conditions.",
        "Exam-oriented": "Exam Mode: Emphasize high-yield shortcuts, standard trap options, quick elimination rules, and marking rubrics."
    }
    
    specific_mode = mode_instructions.get(mode, mode_instructions["Exam-oriented"])
    
    if rag_context:
        rag_section = f"\n### Grounded Textbook / Notes Excerpts:\n{rag_context}\n"
    else:
        rag_section = ""
        
    return f"{base_pedagogy}\nActive Explanation Style: {specific_mode}\n{rag_section}"

@router.get("/conversations")
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return {
        "conversations": [
            {
                "id": c.id,
                "title": c.title,
                "subject": c.subject,
                "topic": c.topic,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None
            }
            for c in convs
        ]
    }

@router.post("/conversations")
def create_conversation(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    title = payload.get("title", "New Study Session")
    subject = payload.get("subject", "Physics")
    topic = payload.get("topic", None)
    
    conv = Conversation(
        user_id=current_user.id,
        title=title,
        subject=subject,
        topic=topic
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {
        "id": conv.id,
        "title": conv.title,
        "subject": conv.subject,
        "topic": conv.topic
    }

@router.get("/conversations/{conversation_id}")
def get_conversation_details(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    
    return {
        "id": conv.id,
        "title": conv.title,
        "subject": conv.subject,
        "topic": conv.topic,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "explanation_mode": m.explanation_mode,
                "citations": m.citations or [],
                "related_topics": m.related_topics or [],
                "recommended_action": m.recommended_action,
                "feedback_rating": m.feedback_rating,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ]
    }

@router.post("/chat")
async def send_chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve or create conversation
    conv = None
    if req.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == req.conversation_id, Conversation.user_id == current_user.id).first()
        
    if not conv:
        conv = Conversation(
            user_id=current_user.id,
            title=req.prompt[:35] + "...",
            subject=req.subject or "Physics",
            topic=req.topic
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 1. Save user message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=req.prompt,
        explanation_mode=req.explanation_mode
    )
    db.add(user_msg)
    
    # 2. RAG Retrieval
    relevant_chunks = RAGService.retrieve_relevant_chunks(db, current_user.id, req.prompt, top_k=2)
    rag_context = RAGService.build_grounded_context(relevant_chunks)
    
    # 3. System Prompt
    sys_prompt = get_system_prompt_for_mode(req.explanation_mode, rag_context)
    
    # 4. Generate AI Response
    ai_answer = await ai_service.generate(prompt=req.prompt, system_instruction=sys_prompt)
    
    # 5. Build citations
    citations = [
        {
            "document_title": c["document_title"],
            "page": c["page_number"],
            "excerpt": c["content"][:160] + "..."
        }
        for c in relevant_chunks
    ]
    
    # 6. Save assistant message
    asst_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=ai_answer,
        explanation_mode=req.explanation_mode,
        citations=citations,
        related_topics=[req.topic or "Circuit Theory", "Prerequisites", "Problem Sets"],
        recommended_action={"title": f"Take 3-Question Practice on {req.subject or 'Physics'}", "type": "practice"}
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)
    
    return {
        "conversation_id": conv.id,
        "message": {
            "id": asst_msg.id,
            "role": "assistant",
            "content": asst_msg.content,
            "explanation_mode": asst_msg.explanation_mode,
            "citations": asst_msg.citations,
            "related_topics": asst_msg.related_topics,
            "recommended_action": asst_msg.recommended_action
        }
    }

@router.post("/stream")
async def stream_chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Server-Sent Events (SSE) streaming endpoint for AI Tutor.
    """
    conv = None
    if req.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == req.conversation_id, Conversation.user_id == current_user.id).first()
        
    if not conv:
        conv = Conversation(
            user_id=current_user.id,
            title=req.prompt[:35] + "...",
            subject=req.subject or "Physics",
            topic=req.topic
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Save user message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=req.prompt,
        explanation_mode=req.explanation_mode
    )
    db.add(user_msg)
    db.commit()

    # RAG Retrieval
    relevant_chunks = RAGService.retrieve_relevant_chunks(db, current_user.id, req.prompt, top_k=2)
    rag_context = RAGService.build_grounded_context(relevant_chunks)
    sys_prompt = get_system_prompt_for_mode(req.explanation_mode, rag_context)

    citations = [
        {
            "document_title": c["document_title"],
            "page": c["page_number"],
            "excerpt": c["content"][:160] + "..."
        }
        for c in relevant_chunks
    ]

    async def event_generator():
        yield f"data: {json.dumps({'type': 'init', 'conversation_id': conv.id, 'citations': citations})}\n\n"
        
        full_text = ""
        async for chunk in ai_service.stream(prompt=req.prompt, system_instruction=sys_prompt):
            full_text += chunk
            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            
        # Save assistant message in DB
        asst_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content=full_text,
            explanation_mode=req.explanation_mode,
            citations=citations,
            related_topics=["Core Mechanics", "Prerequisites"],
            recommended_action={"title": "Take Diagnostic Quiz", "type": "practice"}
        )
        db.add(asst_msg)
        db.commit()
        
        yield f"data: {json.dumps({'type': 'done', 'message_id': asst_msg.id})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/analyze-image")
async def analyze_diagram(
    image: UploadFile = File(...),
    prompt: str = Form("Explain the physics concept shown in this diagram and guide me Socratic style."),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image_bytes = await image.read()
    mime_type = image.content_type or "image/png"
    
    sys_prompt = get_system_prompt_for_mode("Exam-oriented")
    analysis = await ai_service.analyze_image(
        image_bytes=image_bytes,
        mime_type=mime_type,
        prompt=prompt,
        system_instruction=sys_prompt
    )
    
    return {
        "status": "success",
        "analysis": analysis
    }
