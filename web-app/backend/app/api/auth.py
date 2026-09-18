from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.core.config import settings
from app.models import (
    User, UserProfile, TopicMastery, RevisionItem, StudyPlan, StudyPlanItem, Mistake,
    KnowledgeItem, Flashcard, PYQItem, Book, BookChapter, VideoResource
)
from app.schemas import UserRegister, UserLogin, TokenResponse, UserOut, OnboardingRequest, UserProfileSchema
from datetime import datetime, timezone, timedelta as dt_timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def seed_initial_user_data(db: Session, user: User):
    """Seed initial realistic educational records so the workspace immediately reflects real stats."""
    # Seed Weak Topics & Mastery
    topics = [
        ("Physics", "Mechanics", "Rotational Motion", 42.0, 18, 7),
        ("Chemistry", "Organic Chemistry", "Electrophilic Addition Reactions", 48.0, 15, 6),
        ("Biology", "Cell Biology", "Cell Division & Mitosis Phases", 51.0, 20, 10),
        ("Physics", "Mechanics", "Kinematics & Projectile Motion", 82.0, 24, 20),
        ("Physics", "Mechanics", "Newton's Laws of Motion", 74.0, 22, 17),
        ("Chemistry", "Physical Chemistry", "Thermodynamics & Enthalpy", 68.0, 19, 13),
    ]
    for subj, chap, top, mast, tot, corr in topics:
        mastery = TopicMastery(
            user_id=user.id,
            subject=subj,
            chapter=chap,
            topic=top,
            mastery_percentage=mast,
            total_attempts=tot,
            correct_attempts=corr
        )
        db.add(mastery)
    
    # Seed Revision Queue
    now = datetime.now(timezone.utc)
    revisions = [
        ("Biology", "Mitosis vs Meiosis Crossing Over", now, 1),
        ("Physics", "Torque & Conservation of Angular Momentum", now, 1),
        ("Chemistry", "Markovnikov vs Anti-Markovnikov Rule", now + dt_timedelta(days=1), 2),
        ("Physics", "Work-Energy Theorem in Non-Conservative Fields", now + dt_timedelta(days=3), 2),
        ("Biology", "Enzyme Kinetics and Michaelis Constant", now + dt_timedelta(days=7), 3),
    ]
    for subj, top, due, stage in revisions:
        rev = RevisionItem(
            user_id=user.id,
            subject=subj,
            topic=top,
            due_date=due,
            interval_stage=stage
        )
        db.add(rev)
    
    # Seed Study Plan
    plan = StudyPlan(
        user_id=user.id,
        title=f"{user.profile.target_exam if user.profile else 'NEET'} 45-Day Adaptive Roadmap",
        days_left=45
    )
    db.add(plan)
    db.flush()
    
    plan_items = [
        ("Monday", "08:00", 45, "Biology", "Cell Division & Mitosis", "Study", True),
        ("Monday", "10:30", 60, "Physics", "Kinematics Problem Set", "Practice", False),
        ("Monday", "14:00", 45, "Chemistry", "Electrophilic Addition", "Study", False),
        ("Monday", "18:00", 30, "Physics", "Mistake Review & Angular Momentum", "Revision", False),
        ("Monday", "20:00", 45, "Biology", "Diagnostic Topic Quiz", "Practice", False),
    ]
    for day, time_str, dur, subj, top, act, done in plan_items:
        p_item = StudyPlanItem(
            plan_id=plan.id,
            day_name=day,
            scheduled_time=time_str,
            duration_minutes=dur,
            subject=subj,
            topic=top,
            activity_type=act,
            is_completed=done
        )
        db.add(p_item)
    
    # Seed Diagnostic Mistakes
    mistakes = [
        (
            "A rigid body rotates about a fixed axis with constant angular acceleration α. If it makes N revolutions in time t, find α.",
            "α = 4πN / t²",
            "α = 4πN / t² (Missed factor of 2 during radian conversion)",
            "Remember θ = 2πN radians. Using θ = 1/2 α t² gives 2πN = 1/2 α t² => α = 4πN / t².",
            "Radian Revolution Conversion",
            "Physics",
            "Rotational Motion",
            "Conceptual"
        ),
        (
            "Which intermediate is formed in the acid-catalyzed hydration of propene?",
            "Primary carbocation",
            "Secondary carbocation (2-propyl cation)",
            "Markovnikov's rule dictates protonation occurs on less substituted carbon to generate the more stable secondary carbocation intermediate.",
            "Carbocation Stability & Markovnikov Addition",
            "Chemistry",
            "Organic Reactions",
            "Conceptual"
        )
    ]
    for q, ans, corr, exp, conc, subj, top, m_type in mistakes:
        m = Mistake(
            user_id=user.id,
            question_text=q,
            user_answer=ans,
            correct_answer=corr,
            explanation=exp,
            concept=conc,
            subject=subj,
            topic=top,
            mistake_type=m_type,
            is_resolved=False
        )
        db.add(m)

    # Seed Knowledge Items & LaTeX Formulas from Rich Dataset
    from app.core.rich_seed_data import RICH_FORMULAS, RICH_PYQS, RICH_VIDEOS, RICH_BOOKS

    for f_data in RICH_FORMULAS:
        existing_k = db.query(KnowledgeItem).filter(
            KnowledgeItem.user_id == user.id,
            KnowledgeItem.title == f_data["title"]
        ).first()
        if not existing_k:
            k_obj = KnowledgeItem(
                user_id=user.id,
                type="FORMULA",
                title=f_data["title"],
                content=f_data["summary"],
                summary=f_data["summary"],
                subject=f_data["subject"],
                chapter=f_data["chapter"],
                topic=f_data["topic"],
                formula_equation=f_data["formula_equation"],
                variables_explanation=f_data["variables_explanation"],
                importance_score=f_data["importance_score"],
                mastery_score=f_data["mastery_score"],
                recurring_pattern=f_data["recurring_pattern"],
                tags=f_data["tags"],
                source_reference=f_data["source_reference"]
            )
            db.add(k_obj)

    # Seed Flashcards (Spaced recall cards)
    flashcard_seeds = [
        Flashcard(
            user_id=user.id,
            subject="Physics",
            chapter="Rotational Mechanics",
            topic="Conservation of Angular Momentum",
            card_type="FORMULA",
            front="What is the condition and mathematical formula for Conservation of Angular Momentum?",
            back="Condition: Net external torque τ_ext = 0\nFormula: L = I₁ω₁ = I₂ω₂ = Constant",
            hint="Think of an ice skater pulling arms inward",
            retention_state="LEARNING",
            interval_days=1,
            repetition_count=1,
            due_date=now
        ),
        Flashcard(
            user_id=user.id,
            subject="Biology",
            chapter="Cell Biology",
            topic="Cell Division (Mitosis vs Meiosis)",
            card_type="CLOZE",
            front="During meiosis, crossing over between non-sister chromatids occurs at the [_______] sub-stage of Prophase I.",
            back="PACHYTENE (facilitated by recombinase enzyme)",
            hint="Leptotene -> Zygotene -> Pachytene -> Diplotene -> Diakinesis",
            retention_state="REVIEW",
            interval_days=3,
            repetition_count=2,
            due_date=now
        ),
        Flashcard(
            user_id=user.id,
            subject="Chemistry",
            chapter="Hydrocarbons",
            topic="Markovnikov Addition & Carbocations",
            card_type="CONCEPT",
            front="Why does the peroxide effect (Kharasch effect) occur only with HBr and NOT with HCl or HI?",
            back="H-Cl bond is too strong for free-radical homolytic cleavage, while H-I adds too slowly and iodine radicals recombine into I₂.",
            hint="Thermodynamic feasibility of both propagation steps",
            retention_state="NEW",
            interval_days=0,
            repetition_count=0,
            due_date=now
        ),
        Flashcard(
            user_id=user.id,
            subject="Physics",
            chapter="Mechanics",
            topic="Kinematics 2D Projectile Equations",
            card_type="FORMULA",
            front="State the formula for maximum height (H_max) and horizontal range (R) in terms of launch angle θ and initial speed u.",
            back="H_max = (u² sin²θ) / (2g)\nRange R = (u² sin 2θ) / g",
            hint="R is maximum at 45 degrees",
            retention_state="MASTERED",
            interval_days=14,
            repetition_count=4,
            due_date=now + dt_timedelta(days=7)
        )
    ]
    for fc in flashcard_seeds:
        db.add(fc)

    # Seed PYQs (NEET / JEE Archive from Rich Dataset)
    for pyq_data in RICH_PYQS:
        existing_pyq = db.query(PYQItem).filter(
            PYQItem.exam_name == pyq_data["exam_name"],
            PYQItem.year == pyq_data["year"],
            PYQItem.question_text == pyq_data["question_text"]
        ).first()
        if not existing_pyq:
            pyq_obj = PYQItem(
                exam_name=pyq_data["exam_name"],
                year=pyq_data["year"],
                subject=pyq_data["subject"],
                chapter=pyq_data["chapter"],
                topic=pyq_data["topic"],
                question_text=pyq_data["question_text"],
                options=pyq_data["options"],
                correct_answer=pyq_data["correct_answer"],
                explanation=pyq_data["explanation"],
                difficulty=pyq_data.get("difficulty", "Medium"),
                question_type=pyq_data.get("question_type", "MCQ"),
                source=pyq_data.get("source", "Official Archive"),
                key_formula_used=pyq_data.get("key_formula_used"),
                recurring_pattern_tag=pyq_data.get("recurring_pattern_tag"),
                repeat_frequency_score=pyq_data.get("repeat_frequency_score", 4.0),
                appeared_years=pyq_data.get("appeared_years", [pyq_data["year"]])
            )
            db.add(pyq_obj)

    # Seed Video Resources from Rich Dataset
    for v in RICH_VIDEOS:
        existing_vid = db.query(VideoResource).filter(VideoResource.id == v["id"]).first()
        if not existing_vid:
            v_obj = VideoResource(
                id=v["id"],
                title=v["title"],
                channel=v["channel"],
                topic=v["topic"],
                subject=v["subject"],
                duration_minutes=v["duration_minutes"],
                duration_category=v["duration_category"],
                style=v["style"],
                language=v["language"],
                video_id_or_url=v["video_id_or_url"],
                thumbnail_url=v["thumbnail_url"],
                difficulty=v["difficulty"],
                why_recommended=v["why_recommended"]
            )
            db.add(v_obj)

    # Seed Reference Books from Rich Dataset
    for b in RICH_BOOKS:
        existing_book = db.query(Book).filter(Book.id == b["id"]).first()
        if not existing_book:
            b_obj = Book(
                id=b["id"],
                title=b["title"],
                author=b["author"],
                subject=b["subject"],
                cover_color=b.get("cover_color", "coral"),
                source_type=b.get("source_type", "REFERENCE"),
                description=b["description"]
            )
            db.add(b_obj)
            db.flush()

            for ch in b["chapters"]:
                ch_obj = BookChapter(
                    book_id=b["id"],
                    chapter_number=ch["chapter_number"],
                    title=ch["title"],
                    summary=f"Covers key concepts: {', '.join(ch.get('topics_covered', []))}",
                    key_facts=ch.get("topics_covered", [])
                )
                db.add(ch_obj)
    
    db.commit()

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    hashed = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=hashed
    )
    db.add(new_user)
    db.flush()
    
    profile = UserProfile(
        user_id=new_user.id,
        target_exam="NEET",
        selected_subjects=["Physics", "Chemistry", "Biology"],
        explanation_preference="Exam-oriented",
        onboarding_completed=False
    )
    db.add(profile)
    db.commit()
    db.refresh(new_user)
    
    seed_initial_user_data(db, new_user)
    
    token = create_access_token(new_user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "onboarding_completed": False
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "onboarding_completed": user.profile.onboarding_completed if user.profile else False
        }
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    profile_data = None
    if current_user.profile:
        profile_data = UserProfileSchema(
            target_exam=current_user.profile.target_exam or "NEET",
            target_exam_date=current_user.profile.target_exam_date,
            daily_study_hours=current_user.profile.daily_study_hours or 3.0,
            current_grade_level=current_user.profile.current_grade_level or "Class 12 / Aspirant",
            selected_subjects=current_user.profile.selected_subjects or ["Physics", "Chemistry", "Biology"],
            confidence_level=current_user.profile.confidence_level or "Intermediate",
            explanation_preference=current_user.profile.explanation_preference or "Exam-oriented",
            onboarding_completed=current_user.profile.onboarding_completed,
            streak_days=current_user.profile.streak_days or 5,
            xp=current_user.profile.xp or 420,
            total_study_minutes=current_user.profile.total_study_minutes or 1840,
            accuracy_percentage=current_user.profile.accuracy_percentage or 78.5,
            questions_solved=current_user.profile.questions_solved or 142
        )
    
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        profile=profile_data
    )

@router.post("/onboarding", response_model=UserOut)
def complete_onboarding(
    data: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.profile:
        current_user.profile = UserProfile(user_id=current_user.id)
        db.add(current_user.profile)
    
    if data.full_name:
        current_user.full_name = data.full_name
    
    current_user.profile.target_exam = data.target_exam
    current_user.profile.selected_subjects = data.selected_subjects
    current_user.profile.target_exam_date = data.target_exam_date
    current_user.profile.daily_study_hours = data.daily_study_hours
    current_user.profile.confidence_level = data.confidence_level
    current_user.profile.explanation_preference = data.explanation_preference
    current_user.profile.onboarding_completed = True
    
    db.commit()
    db.refresh(current_user)
    return get_me(current_user)
