import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, UserProfile, Quiz, QuizQuestion

logger = logging.getLogger("intellitutor.mock_tests")

router = APIRouter(prefix="/mock-tests", tags=["Mock Tests"])

class GenerateMockRequest(BaseModel):
    title: Optional[str] = "High-Yield Adaptive Sectional Mock"
    subject: str = "All" # All, Physics, Chemistry, Biology
    question_count: int = 15

class SubmitMockAnswer(BaseModel):
    question_id: str
    user_answer: str

class SubmitMockRequest(BaseModel):
    answers: List[SubmitMockAnswer]
    time_taken_seconds: int = 1800

@router.get("")
def list_mock_tests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    target_exam = profile.target_exam if profile else "NEET"
    
    # Query all quizzes labeled as mock tests
    mocks = db.query(Quiz).filter(
        Quiz.user_id == current_user.id,
        Quiz.question_type.in_(["Mock", "Full-Length", "Sectional"])
    ).order_by(Quiz.created_at.desc()).all()
    
    # Return structured tests list including completed and scheduled
    tests = [
        {
            "id": "mock-seed-1",
            "title": f"Full-Length Diagnostic Mock Test #1",
            "exam": f"{target_exam} Full Syllabus",
            "duration": "3 Hours",
            "questions": 180,
            "score": "612 / 720" if target_exam == "NEET" else "245 / 300",
            "accuracy": "85%",
            "date": "Completed 3 days ago",
            "status": "Completed"
        },
        {
            "id": "mock-seed-2",
            "title": "Physics & Chemistry High-Yield Sectional",
            "exam": f"{target_exam} Sectional",
            "duration": "90 Min",
            "questions": 90,
            "score": "Upcoming",
            "accuracy": "-",
            "date": "Scheduled for Tomorrow 7 PM",
            "status": "Upcoming"
        }
    ]
    
    for m in mocks:
        tests.insert(0, {
            "id": m.id,
            "title": m.title,
            "exam": f"{target_exam} Custom Mock",
            "duration": f"{m.question_count * 2} Min",
            "questions": m.question_count,
            "score": f"{int(m.score)}%" if m.score is not None else "Not taken",
            "accuracy": f"{int(m.score)}%" if m.score is not None else "-",
            "date": m.created_at.strftime("%b %d, %Y") if m.created_at else "Recently",
            "status": "Completed" if m.status == "completed" else "Available"
        })
        
    return {"mock_tests": tests}

@router.post("/generate")
def generate_mock_test(
    req: GenerateMockRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    target_exam = profile.target_exam if profile else "NEET"
    
    mock_title = req.title or f"{target_exam} Adaptive Practice Mock"
    
    quiz = Quiz(
        user_id=current_user.id,
        title=mock_title,
        subject=req.subject if req.subject != "All" else "Comprehensive STEM",
        chapter="Multi-Chapter High-Yield",
        topic="Adaptive Simulation",
        difficulty="Exam level",
        question_type="Sectional",
        question_count=req.question_count,
        status="created"
    )
    db.add(quiz)
    db.flush()
    
    mock_questions = [
        QuizQuestion(
            quiz_id=quiz.id,
            question_text="A uniform rod of length L and mass M is rotated about an axis passing through one end perpendicular to its length. Find its radius of gyration.",
            options=["L / √3", "L / √2", "L / 2", "L / √12"],
            correct_answer="L / √3",
            explanation="I = (1/3) M L² = M k² => k = L / √3.",
            topic="Rotational Dynamics",
            difficulty="Exam level",
            question_type="MCQ"
        ),
        QuizQuestion(
            quiz_id=quiz.id,
            question_text="Which of the following carbocations exhibits the highest thermodynamic stability?",
            options=["Tert-butyl cation (CH3)3C+", "Isopropyl cation (CH3)2CH+", "Ethyl cation CH3CH2+", "Methyl cation CH3+"],
            correct_answer="Tert-butyl cation (CH3)3C+",
            explanation="Tert-butyl cation has 9 hyperconjugative alpha-hydrogens and +I inductive stabilization.",
            topic="Organic Reaction Mechanisms",
            difficulty="Exam level",
            question_type="MCQ"
        ),
        QuizQuestion(
            quiz_id=quiz.id,
            question_text="During which stage of meiosis do homologous chromosomes synapse and undergo genetic recombination?",
            options=["Pachytene", "Leptotene", "Zygotene", "Diakinesis"],
            correct_answer="Pachytene",
            explanation="Synapsis begins in Zygotene with synaptonemal complex; crossing over and recombination occurs in Pachytene.",
            topic="Cell Division & Genetics",
            difficulty="Exam level",
            question_type="MCQ"
        ),
        QuizQuestion(
            quiz_id=quiz.id,
            question_text="An ideal gas undergoes adiabatic expansion where volume doubles. If γ = 1.4, the final pressure P2 in terms of initial P1 is:",
            options=["P1 / 2^1.4", "P1 * 2^1.4", "P1 / 2", "P1 * 1.4"],
            correct_answer="P1 / 2^1.4",
            explanation="For adiabatic process, P1 V1^γ = P2 V2^γ => P2 = P1 (V1 / 2V1)^γ = P1 / 2^γ = P1 / 2^1.4.",
            topic="Thermodynamics",
            difficulty="Exam level",
            question_type="MCQ"
        ),
        QuizQuestion(
            quiz_id=quiz.id,
            question_text="According to the fluid mosaic model, cell membranes are composed of:",
            options=["A phospholipid bilayer with quasi-fluid protein mobility", "A rigid protein monolayer", "Pure carbohydrate lipid sheets", "Static cellulose layers"],
            correct_answer="A phospholipid bilayer with quasi-fluid protein mobility",
            explanation="Proposed by Singer & Nicolson (1972), the quasi-fluid nature of lipids enables lateral movement of proteins.",
            topic="Cell Biology",
            difficulty="Exam level",
            question_type="MCQ"
        ),
    ]
    
    for q in mock_questions:
        db.add(q)
        
    db.commit()
    db.refresh(quiz)
    
    return {
        "id": quiz.id,
        "title": quiz.title,
        "subject": quiz.subject,
        "question_count": len(mock_questions),
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": q.options,
                "topic": q.topic
            }
            for q in mock_questions
        ]
    }

@router.get("/{mock_id}")
def get_mock_test(
    mock_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == mock_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Mock test not found")
        
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
    return {
        "id": quiz.id,
        "title": quiz.title,
        "subject": quiz.subject,
        "status": quiz.status,
        "score": quiz.score,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "topic": q.topic
            }
            for q in questions
        ]
    }
