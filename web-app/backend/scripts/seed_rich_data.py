import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.models import User, KnowledgeItem, Flashcard, PYQItem, VideoResource, Book, BookChapter
from app.core.rich_seed_data import RICH_FORMULAS, RICH_PYQS, RICH_VIDEOS, RICH_BOOKS

def run_seed():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Found {len(users)} users in database.")
        
        for user in users:
            print(f"Seeding rich data for user {user.email}...")
            # Seed formulas
            for f in RICH_FORMULAS:
                existing = db.query(KnowledgeItem).filter(
                    KnowledgeItem.user_id == user.id,
                    KnowledgeItem.title == f["title"]
                ).first()
                if not existing:
                    db.add(KnowledgeItem(
                        user_id=user.id,
                        type="FORMULA",
                        title=f["title"],
                        content=f["summary"],
                        summary=f["summary"],
                        subject=f["subject"],
                        chapter=f["chapter"],
                        topic=f["topic"],
                        formula_equation=f["formula_equation"],
                        variables_explanation=f["variables_explanation"],
                        importance_score=f["importance_score"],
                        mastery_score=f["mastery_score"],
                        recurring_pattern=f["recurring_pattern"],
                        tags=f["tags"],
                        source_reference=f["source_reference"]
                    ))

        # Seed global PYQs
        for p in RICH_PYQS:
            existing = db.query(PYQItem).filter(
                PYQItem.exam_name == p["exam_name"],
                PYQItem.year == p["year"],
                PYQItem.question_text == p["question_text"]
            ).first()
            if not existing:
                db.add(PYQItem(
                    exam_name=p["exam_name"],
                    year=p["year"],
                    subject=p["subject"],
                    chapter=p["chapter"],
                    topic=p["topic"],
                    question_text=p["question_text"],
                    options=p["options"],
                    correct_answer=p["correct_answer"],
                    explanation=p["explanation"],
                    difficulty=p.get("difficulty", "Medium"),
                    question_type=p.get("question_type", "MCQ"),
                    source=p.get("source", "Official Archive"),
                    key_formula_used=p.get("key_formula_used"),
                    recurring_pattern_tag=p.get("recurring_pattern_tag"),
                    repeat_frequency_score=p.get("repeat_frequency_score", 4.0),
                    appeared_years=p.get("appeared_years", [p["year"]])
                ))

        # Seed global videos
        for v in RICH_VIDEOS:
            existing = db.query(VideoResource).filter(VideoResource.id == v["id"]).first()
            if not existing:
                db.add(VideoResource(
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
                ))

        # Seed books
        for b in RICH_BOOKS:
            existing = db.query(Book).filter(Book.id == b["id"]).first()
            if not existing:
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
                    db.add(BookChapter(
                        book_id=b["id"],
                        chapter_number=ch["chapter_number"],
                        title=ch["title"],
                        summary=f"Covers key concepts: {', '.join(ch.get('topics_covered', []))}",
                        key_facts=ch.get("topics_covered", [])
                    ))

        db.commit()
        print("Rich seed completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
