import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models import User, UserProfile
from app.api.auth import seed_initial_user_data, router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.tutor import router as tutor_router
from app.api.documents import router as documents_router
from app.api.quizzes import router as quizzes_router
from app.api.mistakes import router as mistakes_router
from app.api.revision import router as revision_router
from app.api.planner import router as planner_router
from app.api.analytics import router as analytics_router
from app.api.mock_tests import router as mock_tests_router
from app.api.feedback import router as feedback_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intellitutor")

def init_db():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Check if default demo user exists
    db: Session = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "student@intellitutor.ai").first()
        if not demo_user:
            logger.info("Creating default demo user: student@intellitutor.ai...")
            demo_user = User(
                email="student@intellitutor.ai",
                full_name="Aarav Sharma",
                hashed_password=get_password_hash("password123")
            )
            db.add(demo_user)
            db.flush()
            
            profile = UserProfile(
                user_id=demo_user.id,
                target_exam="NEET",
                target_exam_date="May 2027",
                daily_study_hours=3.5,
                current_grade_level="Class 12 / Aspirant",
                selected_subjects=["Physics", "Chemistry", "Biology"],
                confidence_level="Intermediate",
                explanation_preference="Exam-oriented",
                onboarding_completed=True,
                streak_days=7,
                xp=580,
                total_study_minutes=2450,
                accuracy_percentage=82.4,
                questions_solved=210
            )
            db.add(profile)
            db.commit()
            db.refresh(demo_user)
            seed_initial_user_data(db, demo_user)
            logger.info("Demo user successfully initialized.")
    except Exception as e:
        logger.error(f"Error during DB initialization: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for IntelliTutor AI - Your AI-powered personal study coach.",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(tutor_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(quizzes_router, prefix="/api")
app.include_router(mistakes_router, prefix="/api")
app.include_router(revision_router, prefix="/api")
app.include_router(planner_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(mock_tests_router, prefix="/api")
app.include_router(feedback_router, prefix="/api")

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
