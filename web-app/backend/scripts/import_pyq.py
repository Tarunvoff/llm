import os
import sys
import json
import argparse
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.models import PYQItem

SAMPLE_PYQ_DATA = [
    {
        "exam_name": "NEET",
        "year": 2024,
        "subject": "Physics",
        "chapter": "Rotational Mechanics",
        "topic": "Conservation of Angular Momentum",
        "question_text": "A disc of mass M and radius R is rotating with angular velocity \\omega_0. Another identical disc of mass M is gently placed on it coaxially. What is the new angular velocity of the combined system?",
        "options": ["\\omega_0 / 2", "\\omega_0 / 4", "2 \\omega_0", "\\omega_0"],
        "correct_answer": "\\omega_0 / 2",
        "explanation": "Since no external torque acts on the system, angular momentum is conserved: L_i = I_1 \\omega_0 = (1/2 M R^2) \\omega_0. When the second disc is added, I_f = 2 \\times (1/2 M R^2) = M R^2. Thus, \\omega_f = L_i / I_f = \\omega_0 / 2.",
        "difficulty": "Medium",
        "question_type": "MCQ",
        "source": "NEET 2024 Question Paper",
        "key_formula_used": "I_1 \\omega_1 = I_2 \\omega_2",
        "recurring_pattern_tag": "Coaxial Disc Inertia & Angular Momentum",
        "repeat_frequency_score": 5.0,
        "appeared_years": [2018, 2020, 2022, 2024]
    },
    {
        "exam_name": "NEET",
        "year": 2023,
        "subject": "Biology",
        "chapter": "Cell Biology",
        "topic": "Cell Division (Mitosis vs Meiosis)",
        "question_text": "During which phase of cell cycle does DNA synthesis (replication) take place?",
        "options": ["G1 Phase", "S Phase", "G2 Phase", "M Phase"],
        "correct_answer": "S Phase",
        "explanation": "DNA replication occurs exclusively during the Synthesis (S) phase of interphase. The amount of DNA doubles from 2C to 4C, while chromosome number remains 2n.",
        "difficulty": "Easy",
        "question_type": "MCQ",
        "source": "NEET 2023 Question Paper",
        "key_formula_used": "DNA Replication: 2C \\rightarrow 4C",
        "recurring_pattern_tag": "Interphase Stage Transitions",
        "repeat_frequency_score": 6.0,
        "appeared_years": [2017, 2019, 2021, 2023]
    },
    {
        "exam_name": "NEET",
        "year": 2024,
        "subject": "Chemistry",
        "chapter": "Hydrocarbons",
        "topic": "Markovnikov Addition & Carbocations",
        "question_text": "Addition of HBr to propene in the presence of benzoyl peroxide gives:",
        "options": ["1-bromopropane", "2-bromopropane", "1,2-dibromopropane", "2,2-dibromopropane"],
        "correct_answer": "1-bromopropane",
        "explanation": "In the presence of peroxide, HBr adds via free radical mechanism according to Anti-Markovnikov (Kharasch effect) rule, yielding 1-bromopropane as the major product.",
        "difficulty": "Medium",
        "question_type": "MCQ",
        "source": "NEET 2024 Question Paper",
        "key_formula_used": "Free Radical Addition (Kharasch Effect)",
        "recurring_pattern_tag": "Peroxide Effect in HBr Additions",
        "repeat_frequency_score": 4.0,
        "appeared_years": [2019, 2021, 2023, 2024]
    },
    {
        "exam_name": "NEET",
        "year": 2022,
        "subject": "Physics",
        "chapter": "Mechanics",
        "topic": "Kinematics 2D Projectile Equations",
        "question_text": "A projectile is fired from the origin with velocity \\vec{v} = (3\\hat{i} + 4\\hat{j}) m/s. Taking g = 10 m/s^2, the horizontal range of the projectile is:",
        "options": ["2.4 m", "1.2 m", "4.8 m", "3.6 m"],
        "correct_answer": "2.4 m",
        "explanation": "Horizontal component u_x = 3 m/s, vertical component u_y = 4 m/s. Time of flight T = 2 u_y / g = 2(4)/10 = 0.8 s. Range R = u_x \\times T = 3 \\times 0.8 = 2.4 m.",
        "difficulty": "Easy",
        "question_type": "MCQ",
        "source": "NEET 2022 Question Paper",
        "key_formula_used": "R = \\frac{2 u_x u_y}{g}",
        "recurring_pattern_tag": "Vector Projectile Range & Flight Time",
        "repeat_frequency_score": 4.0,
        "appeared_years": [2018, 2020, 2022]
    }
]

def import_pyqs(file_path: str = None):
    db: Session = SessionLocal()
    try:
        Base.metadata.create_all(bind=engine)
        data = SAMPLE_PYQ_DATA
        if file_path and os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
        count = 0
        for item in data:
            existing = db.query(PYQItem).filter(
                PYQItem.exam_name == item["exam_name"],
                PYQItem.year == item["year"],
                PYQItem.question_text == item["question_text"]
            ).first()
            if not existing:
                pyq = PYQItem(
                    exam_name=item["exam_name"],
                    year=item["year"],
                    subject=item["subject"],
                    chapter=item["chapter"],
                    topic=item["topic"],
                    question_text=item["question_text"],
                    options=item["options"],
                    correct_answer=item["correct_answer"],
                    explanation=item["explanation"],
                    difficulty=item.get("difficulty", "Medium"),
                    question_type=item.get("question_type", "MCQ"),
                    source=item.get("source", "Official Archive"),
                    key_formula_used=item.get("key_formula_used"),
                    recurring_pattern_tag=item.get("recurring_pattern_tag"),
                    repeat_frequency_score=item.get("repeat_frequency_score", 3.0),
                    appeared_years=item.get("appeared_years", [item["year"]])
                )
                db.add(pyq)
                count += 1
                
        db.commit()
        print(f"Successfully imported {count} PYQs into database.")
    except Exception as e:
        db.rollback()
        print(f"Error during PYQ import: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import structured PYQs into IntelliTutor")
    parser.add_argument("--file", type=str, default=None, help="Path to JSON file with PYQs")
    args = parser.parse_args()
    import_pyqs(args.file)
