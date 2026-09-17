import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, UserProfile, Quiz, QuizQuestion, Mistake, TopicMastery
from app.ai.gemini import ai_service

logger = logging.getLogger("intellitutor.quizzes")

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

class GenerateQuizRequest(BaseModel):
    subject: str = "Physics"
    chapter: Optional[str] = "Rotational Mechanics"
    topic: Optional[str] = "Torque and Angular Momentum"
    difficulty: str = "Exam level" # Easy, Medium, Hard, Exam level
    question_type: str = "MCQ" # MCQ, Assertion Reason, Numerical, HOTS
    question_count: int = Field(default=5, ge=1, le=15)

class SubmitQuizAnswer(BaseModel):
    question_id: str
    user_answer: str

class SubmitQuizRequest(BaseModel):
    answers: List[SubmitQuizAnswer]
    time_taken_seconds: int = 120

class GeneratedQuestionItem(BaseModel):
    question_text: str
    options: List[str]
    correct_answer: str
    explanation: str
    topic: str
    difficulty: str
    question_type: str
    common_trap: Optional[str] = None

class GeneratedQuizResponse(BaseModel):
    questions: List[GeneratedQuestionItem]

@router.get("")
def list_quizzes(
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Quiz).filter(Quiz.user_id == current_user.id)
    if subject and subject != "All":
        query = query.filter(Quiz.subject == subject)
        
    quizzes = query.order_by(Quiz.created_at.desc()).all()
    
    return {
        "quizzes": [
            {
                "id": q.id,
                "title": q.title,
                "subject": q.subject,
                "chapter": q.chapter or "General",
                "topic": q.topic or "Foundations",
                "difficulty": q.difficulty,
                "question_type": q.question_type,
                "question_count": q.question_count,
                "status": q.status,
                "score": q.score,
                "created_at": q.created_at.isoformat() if q.created_at else None
            }
            for q in quizzes
        ]
    }

@router.post("/generate")
async def generate_quiz(
    req: GenerateQuizRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate an adaptive quiz with Gemini AI based on student target exam, subject, topic, and difficulty.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    target_exam = profile.target_exam if profile else "Competitive Exam"
    
    prompt = (
        f"Generate a high-yield diagnostic quiz for a student preparing for {target_exam}.\n"
        f"Subject: {req.subject}\n"
        f"Chapter: {req.chapter or 'General'}\n"
        f"Topic: {req.topic or 'Fundamental Principles'}\n"
        f"Difficulty: {req.difficulty}\n"
        f"Question Type: {req.question_type}\n"
        f"Number of questions: {req.question_count}\n\n"
        f"Instructions:\n"
        f"1. Generate exactly {req.question_count} rigorous academic questions.\n"
        f"2. Each question MUST have exactly 4 clear options (A, B, C, D) and specify the single unambiguous correct option.\n"
        f"3. Include a deep, step-by-step pedagogical explanation highlighting the core concept and why other options are incorrect.\n"
        f"4. If Assertion-Reason type, format options as standard: A (Both true, R is correct explanation), B (Both true, R is NOT correct explanation), C (A true, R false), D (A false, R true)."
    )

    questions_data: List[GeneratedQuestionItem] = []
    
    if ai_service._initialized:
        try:
            structured_res = await ai_service.generate_structured(
                prompt=prompt,
                response_schema=GeneratedQuizResponse,
                system_instruction="You are an elite academic question paper setter specializing in competitive STEM exams. Create precise, unambiguous, pedagogical test questions."
            )
            if structured_res and structured_res.questions:
                questions_data = structured_res.questions[:req.question_count]
        except Exception as e:
            logger.error(f"Structured Gemini quiz generation failed: {e}")

    # Fallback if AI generation failed or wasn't initialized
    if not questions_data:
        questions_data = [
            GeneratedQuestionItem(
                question_text=f"A body of mass M is rotating with angular velocity ω. If its radius of gyration is k, what is its rotational kinetic energy in {req.subject}?",
                options=[
                    "(1/2) M k² ω²",
                    "(1/2) M k ω²",
                    "M k² ω",
                    "(1/4) M k² ω²"
                ],
                correct_answer="(1/2) M k² ω²",
                explanation="Rotational KE = (1/2) I ω². Since Moment of Inertia I = M k², substituting gives KE = (1/2) M k² ω².",
                topic=req.topic or "Rotational Dynamics",
                difficulty=req.difficulty,
                question_type=req.question_type
            ),
            GeneratedQuestionItem(
                question_text=f"When external torque on a closed system is zero, which physical quantity remains strictly conserved?",
                options=[
                    "Linear Momentum",
                    "Angular Momentum",
                    "Rotational Kinetic Energy",
                    "Angular Acceleration"
                ],
                correct_answer="Angular Momentum",
                explanation="From τ_ext = dL/dt, if τ_ext = 0, then dL/dt = 0, which implies Angular Momentum L is strictly conserved.",
                topic=req.topic or "Conservation Laws",
                difficulty=req.difficulty,
                question_type=req.question_type
            ),
            GeneratedQuestionItem(
                question_text=f"Assertion (A): A solid sphere rolls faster down an incline than a hollow sphere of the same mass and radius.\nReason (R): The moment of inertia of a solid sphere is less than that of a hollow sphere.",
                options=[
                    "Both A and R are true, and R is the correct explanation of A",
                    "Both A and R are true, but R is NOT the correct explanation of A",
                    "A is true, but R is false",
                    "A is false, but R is true"
                ],
                correct_answer="Both A and R are true, and R is the correct explanation of A",
                explanation="Acceleration rolling down incline is a = g sin θ / (1 + I / (MR²)). For solid sphere, I = (2/5)MR²; for hollow sphere, I = (2/3)MR². Less inertia means greater linear acceleration.",
                topic=req.topic or "Rolling Motion",
                difficulty=req.difficulty,
                question_type="Assertion Reason"
            )
        ][:req.question_count]

    # Save to database
    quiz_title = f"{req.subject} Practice: {req.topic or req.chapter or 'Core Concepts'}"
    quiz = Quiz(
        user_id=current_user.id,
        title=quiz_title,
        subject=req.subject,
        chapter=req.chapter,
        topic=req.topic,
        difficulty=req.difficulty,
        question_type=req.question_type,
        question_count=len(questions_data),
        status="created"
    )
    db.add(quiz)
    db.flush()

    saved_questions = []
    for q_item in questions_data:
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_item.question_text,
            options=q_item.options,
            correct_answer=q_item.correct_answer,
            explanation=q_item.explanation,
            topic=q_item.topic,
            difficulty=q_item.difficulty,
            question_type=q_item.question_type
        )
        db.add(qq)
        saved_questions.append(qq)

    db.commit()
    db.refresh(quiz)

    return {
        "quiz_id": quiz.id,
        "quiz": {
            "id": quiz.id,
            "title": quiz.title,
            "subject": quiz.subject,
            "chapter": quiz.chapter,
            "topic": quiz.topic,
            "difficulty": quiz.difficulty,
            "question_type": quiz.question_type,
            "question_count": quiz.question_count,
            "status": quiz.status,
            "questions": [
                {
                    "id": q.id,
                    "question_text": q.question_text,
                    "options": q.options,
                    "topic": q.topic,
                    "difficulty": q.difficulty,
                    "question_type": q.question_type
                }
                for q in saved_questions
            ]
        }
    }

@router.get("/{quiz_id}")
def get_quiz_details(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()

    is_completed = (quiz.status == "completed")

    return {
        "id": quiz.id,
        "title": quiz.title,
        "subject": quiz.subject,
        "chapter": quiz.chapter,
        "topic": quiz.topic,
        "difficulty": quiz.difficulty,
        "question_type": quiz.question_type,
        "question_count": quiz.question_count,
        "status": quiz.status,
        "score": quiz.score,
        "created_at": quiz.created_at.isoformat() if quiz.created_at else None,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": q.options,
                "topic": q.topic,
                "difficulty": q.difficulty,
                "question_type": q.question_type,
                "correct_answer": q.correct_answer if is_completed else None,
                "explanation": q.explanation if is_completed else None
            }
            for q in questions
        ]
    }

@router.post("/{quiz_id}/submit")
def submit_quiz(
    quiz_id: str,
    payload: SubmitQuizRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Grade quiz submission, record mistakes, update BKT topic mastery, award XP.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
    q_map = {q.id: q for q in questions}

    user_answers_map = {a.question_id: a.user_answer for a in payload.answers}

    correct_count = 0
    total_questions = len(questions)
    graded_results = []
    mistakes_recorded = []

    for q in questions:
        user_ans = user_answers_map.get(q.id, "")
        is_correct = (user_ans.strip().lower() == q.correct_answer.strip().lower())
        
        if is_correct:
            correct_count += 1
        else:
            # Auto-classify mistake type
            mistake_type = "Conceptual"
            if "calculation" in q.question_text.lower() or "calculate" in q.question_text.lower() or any(char.isdigit() for char in user_ans):
                mistake_type = "Calculation"
            elif "assertion" in q.question_type.lower():
                mistake_type = "Conceptual"
            elif "not" in q.question_text.lower() or "incorrect" in q.question_text.lower():
                mistake_type = "Misread"

            # Create Mistake record in Mistake Journal
            mistake = Mistake(
                user_id=current_user.id,
                question_text=q.question_text,
                user_answer=user_ans or "Unanswered",
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                concept=q.topic or quiz.topic or "General Concept",
                subject=quiz.subject,
                topic=q.topic or quiz.topic or "Core Topic",
                mistake_type=mistake_type,
                is_resolved=False
            )
            db.add(mistake)
            mistakes_recorded.append(mistake)

        graded_results.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "options": q.options,
            "user_answer": user_ans,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation,
            "topic": q.topic
        })

    # Compute percentage
    score_pct = round((correct_count / total_questions) * 100, 1) if total_questions > 0 else 0.0
    quiz.score = score_pct
    quiz.status = "completed"

    # Update Topic Mastery in BKT
    topic_name = quiz.topic or "General"
    mastery = db.query(TopicMastery).filter(
        TopicMastery.user_id == current_user.id,
        TopicMastery.subject == quiz.subject,
        TopicMastery.topic == topic_name
    ).first()

    if not mastery:
        mastery = TopicMastery(
            user_id=current_user.id,
            subject=quiz.subject,
            chapter=quiz.chapter or "Chapter 1",
            topic=topic_name,
            mastery_percentage=score_pct,
            total_attempts=total_questions,
            correct_attempts=correct_count
        )
        db.add(mastery)
    else:
        mastery.total_attempts += total_questions
        mastery.correct_attempts += correct_count
        # Bayesian updated mastery
        mastery.mastery_percentage = round((mastery.correct_attempts / mastery.total_attempts) * 100, 1)
        mastery.last_practiced_at = datetime.now(timezone.utc)

    # Award XP and update user profile stats
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    earned_xp = (correct_count * 20) + 10 # 20 XP per correct + 10 XP completion bonus
    if profile:
        profile.xp = (profile.xp or 0) + earned_xp
        profile.questions_solved = (profile.questions_solved or 0) + total_questions
        profile.total_study_minutes = (profile.total_study_minutes or 0) + max(1, payload.time_taken_seconds // 60)
        # Recalculate profile overall accuracy
        prev_accuracy = profile.accuracy_percentage or 75.0
        profile.accuracy_percentage = round((prev_accuracy * 0.7) + (score_pct * 0.3), 1)

    db.commit()

    return {
        "status": "success",
        "quiz_id": quiz.id,
        "score": score_pct,
        "score_percentage": score_pct,
        "correct_count": correct_count,
        "total_count": total_questions,
        "total_questions": total_questions,
        "earned_xp": earned_xp,
        "xp_earned": earned_xp,
        "mistakes_count": len(mistakes_recorded),
        "results": graded_results
    }
