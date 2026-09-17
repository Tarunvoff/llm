from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, TopicMastery

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])

EXAMS_DATABASE = [
    {
        "id": "NEET",
        "name": "NEET (National Eligibility cum Entrance Test)",
        "code": "UG-MED",
        "subjects": [
            {
                "name": "Physics",
                "chapters": [
                    {
                        "name": "Mechanics",
                        "topics": [
                            {"name": "Kinematics & 2D Projectile", "weight": "High", "difficulty": "Medium"},
                            {"name": "Newton's Laws & Friction", "weight": "High", "difficulty": "Medium"},
                            {"name": "Work, Energy & Power", "weight": "Medium", "difficulty": "Medium"},
                            {"name": "Rotational Motion & Angular Momentum", "weight": "High", "difficulty": "Hard"}
                        ]
                    },
                    {
                        "name": "Electrodynamics",
                        "topics": [
                            {"name": "Electrostatics & Gauss Law", "weight": "High", "difficulty": "Medium"},
                            {"name": "Current Electricity & Circuits", "weight": "High", "difficulty": "Medium"},
                            {"name": "Magnetic Effects & EMI", "weight": "High", "difficulty": "Hard"}
                        ]
                    }
                ]
            },
            {
                "name": "Chemistry",
                "chapters": [
                    {
                        "name": "Organic Chemistry",
                        "topics": [
                            {"name": "Hydrocarbons & Mechanisms", "weight": "High", "difficulty": "Hard"},
                            {"name": "Alcohols, Phenols & Ethers", "weight": "Medium", "difficulty": "Medium"},
                            {"name": "Aldehydes, Ketones & Acids", "weight": "High", "difficulty": "Hard"}
                        ]
                    },
                    {
                        "name": "Physical Chemistry",
                        "topics": [
                            {"name": "Thermodynamics & Thermochemistry", "weight": "High", "difficulty": "Hard"},
                            {"name": "Chemical Kinetics & Equilibrium", "weight": "High", "difficulty": "Medium"}
                        ]
                    }
                ]
            },
            {
                "name": "Biology",
                "chapters": [
                    {
                        "name": "Cell Biology & Genetics",
                        "topics": [
                            {"name": "Cell Cycle & Mitosis/Meiosis", "weight": "High", "difficulty": "Medium"},
                            {"name": "Principles of Inheritance", "weight": "High", "difficulty": "Hard"},
                            {"name": "Molecular Basis of Inheritance", "weight": "High", "difficulty": "Hard"}
                        ]
                    },
                    {
                        "name": "Human Physiology",
                        "topics": [
                            {"name": "Circulation & Body Fluids", "weight": "Medium", "difficulty": "Medium"},
                            {"name": "Neural Control & Coordination", "weight": "High", "difficulty": "Hard"}
                        ]
                    }
                ]
            }
        ]
    },
    {
        "id": "JEE",
        "name": "JEE Advanced / Main",
        "code": "UG-ENG",
        "subjects": [
            {
                "name": "Physics",
                "chapters": [{"name": "Mechanics", "topics": [{"name": "Rotational Dynamics", "weight": "High", "difficulty": "Hard"}]}]
            },
            {
                "name": "Mathematics",
                "chapters": [{"name": "Calculus", "topics": [{"name": "Definite Integration & Differential Equations", "weight": "High", "difficulty": "Hard"}]}]
            },
            {
                "name": "Chemistry",
                "chapters": [{"name": "Physical & Organic", "topics": [{"name": "Coordination Compounds", "weight": "High", "difficulty": "Hard"}]}]
            }
        ]
    }
]

@router.get("/exams")
def list_exams():
    return {"exams": EXAMS_DATABASE}

@router.get("/subjects")
def get_subjects_hierarchy(exam: Optional[str] = Query("NEET")):
    target = next((e for e in EXAMS_DATABASE if e["id"].upper() == exam.upper()), EXAMS_DATABASE[0])
    return {"exam": target["id"], "subjects": target["subjects"]}

@router.get("/topics/mastery")
def get_topics_mastery(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    masteries = db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
    return {
        "masteries": [
            {
                "subject": m.subject,
                "chapter": m.chapter,
                "topic": m.topic,
                "mastery_percentage": m.mastery_percentage,
                "total_attempts": m.total_attempts,
                "correct_attempts": m.correct_attempts,
                "last_practiced": m.last_practiced_at.isoformat() if m.last_practiced_at else None
            }
            for m in masteries
        ]
    }
