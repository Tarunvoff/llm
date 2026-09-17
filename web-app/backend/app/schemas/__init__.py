from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# --- Auth & User Schemas ---

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserProfileSchema(BaseModel):
    target_exam: str = "NEET"
    target_exam_date: Optional[str] = None
    daily_study_hours: float = 3.0
    current_grade_level: str = "Class 12 / Aspirant"
    selected_subjects: List[str] = ["Physics", "Chemistry", "Biology"]
    confidence_level: str = "Intermediate"
    explanation_preference: str = "Exam-oriented"
    onboarding_completed: bool = False
    streak_days: int = 5
    xp: int = 420
    total_study_minutes: int = 1840
    accuracy_percentage: float = 78.5
    questions_solved: int = 142

class OnboardingRequest(BaseModel):
    full_name: Optional[str] = None
    target_exam: str
    selected_subjects: List[str]
    target_exam_date: Optional[str] = None
    daily_study_hours: float = 3.0
    confidence_level: str = "Intermediate"
    explanation_preference: str = "Exam-oriented"

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    profile: Optional[UserProfileSchema] = None

# --- AI Structured Output Schemas ---

class QuizQuestionOption(BaseModel):
    id: str
    text: str

class QuizQuestionSchema(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str
    topic: str
    difficulty: str = "Medium"
    question_type: str = "MCQ"

class TutorCitation(BaseModel):
    document_title: str
    page: int
    excerpt: str

class TutorAction(BaseModel):
    title: str
    action_type: str # practice, revision, document
    payload: Dict[str, Any]

class TutorResponseSchema(BaseModel):
    answer: str
    sources: List[TutorCitation] = []
    related_topics: List[str] = []
    recommended_action: Optional[TutorAction] = None

class StudySessionItem(BaseModel):
    time: str
    subject: str
    topic: str
    duration_min: int
    activity_type: str = "Study"

class StudyPlanSchema(BaseModel):
    date: str
    sessions: List[StudySessionItem]

class AnalyticsRecommendationSchema(BaseModel):
    reason: str
    priority: str # High, Medium, Low
    action: str
    topic: str
    recommended_minutes: int = 20

# --- Dashboard Schemas ---

class StudyPlanItemOut(BaseModel):
    id: str
    time: str
    subject: str
    topic: str
    duration_min: int
    activity_type: str
    is_completed: bool

class WeakTopicOut(BaseModel):
    topic: str
    subject: str
    mastery_percentage: float
    mistake_count: int

class RevisionDueOut(BaseModel):
    id: str
    topic: str
    subject: str
    due_text: str
    interval_stage: int

class AIRecommendationOut(BaseModel):
    title: str
    highlight: str
    description: str
    action_text: str
    topic: str

class DashboardSummaryResponse(BaseModel):
    user_name: str
    target_exam: str
    streak_days: int
    xp: int
    today_progress_percentage: int
    daily_study_goal_hours: float
    today_plan: List[StudyPlanItemOut]
    weak_topics: List[WeakTopicOut]
    revision_due: List[RevisionDueOut]
    ai_recommendation: AIRecommendationOut
    accuracy_percentage: float
    questions_solved: int
