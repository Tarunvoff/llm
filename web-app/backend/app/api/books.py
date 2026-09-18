import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, Book, BookChapter, KnowledgeItem, Flashcard, PYQItem, DiagramItem

logger = logging.getLogger("intellitutor.api.books")

router = APIRouter(prefix="/books", tags=["Reference Book System"])

@router.get("")
def list_books(
    subject: Optional[str] = None,
    source_type: Optional[str] = None, # PRIMARY, REFERENCE, PRACTICE
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Book)
    if subject and subject != "All":
        query = query.filter(Book.subject == subject)
    if source_type and source_type != "ALL":
        query = query.filter(Book.source_type == source_type)
        
    books = query.all()
    
    # Seed default curriculum books if none exist
    if not books:
        default_books = [
            Book(
                title="NCERT Biology Class 11",
                author="NCERT Editorial Board",
                subject="Biology",
                source_type="PRIMARY",
                cover_color="emerald",
                description="Core mandatory curriculum textbook for NEET aspirants.",
                total_chapters=22,
                progress_percentage=65.0,
                last_read_chapter="Chapter 10: Cell Cycle and Cell Division"
            ),
            Book(
                title="Concepts of Physics (Vol 1 & 2)",
                author="Dr. H.C. Verma",
                subject="Physics",
                source_type="REFERENCE",
                cover_color="amber",
                description="Standard conceptual reference book for physics problem-solving.",
                total_chapters=18,
                progress_percentage=42.0,
                last_read_chapter="Chapter 9: Rotational Mechanics"
            ),
            Book(
                title="NCERT Chemistry Class 11 & 12",
                author="NCERT Editorial Board",
                subject="Chemistry",
                source_type="PRIMARY",
                cover_color="violet",
                description="Primary standard textbook for Organic, Inorganic and Physical chemistry.",
                total_chapters=16,
                progress_percentage=58.0,
                last_read_chapter="Chapter 13: Hydrocarbons"
            ),
            Book(
                title="37 Years NEET Chapterwise PYQ Archive",
                author="IntelliTutor Editorial",
                subject="General",
                source_type="PRACTICE",
                cover_color="rose",
                description="Comprehensive previous years question collection with detailed step solutions.",
                total_chapters=45,
                progress_percentage=72.0,
                last_read_chapter="Rotational Dynamics 2018-2024"
            )
        ]
        for b in default_books:
            db.add(b)
        db.commit()
        books = db.query(Book).all()

    return {
        "count": len(books),
        "books": [
            {
                "id": b.id,
                "title": b.title,
                "author": b.author,
                "subject": b.subject,
                "source_type": b.source_type,
                "cover_color": b.cover_color,
                "description": b.description,
                "total_chapters": b.total_chapters,
                "progress_percentage": b.progress_percentage,
                "last_read_chapter": b.last_read_chapter
            }
            for b in books
        ]
    }

@router.get("/{book_id}")
def get_book_details(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    chapters = db.query(BookChapter).filter(BookChapter.book_id == book.id).order_by(BookChapter.chapter_number.asc()).all()
    
    if not chapters:
        # Seed default chapters for the book
        demo_chapters = [
            BookChapter(
                book_id=book.id,
                chapter_number=1,
                title="Foundational Units & Measurement",
                summary="Dimensions, dimensional formulas, significant figures, and error estimation.",
                key_facts=["1 Angstrom = 10^-10 m", "Dimension of Planck Constant = [M L^2 T^-1]"],
                is_completed=True
            ),
            BookChapter(
                book_id=book.id,
                chapter_number=2,
                title="Motion in a Plane (Vectors & Projectile)",
                summary="Scalar and vector products, projectile motion trajectories, and uniform circular dynamics.",
                key_facts=["Maximum horizontal range at theta = 45 deg", "Trajectory equation is parabolic"],
                is_completed=True
            ),
            BookChapter(
                book_id=book.id,
                chapter_number=3,
                title="Rotational Dynamics & Moment of Inertia",
                summary="Rigid body dynamics, torque equilibrium, angular momentum conservation, and rolling without slipping.",
                key_facts=["Tau = I * alpha", "L is conserved when net external torque = 0"],
                is_completed=False
            )
        ]
        for ch in demo_chapters:
            db.add(ch)
        db.commit()
        chapters = db.query(BookChapter).filter(BookChapter.book_id == book.id).order_by(BookChapter.chapter_number.asc()).all()

    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "subject": book.subject,
        "source_type": book.source_type,
        "cover_color": book.cover_color,
        "description": book.description,
        "progress_percentage": book.progress_percentage,
        "chapters": [
            {
                "id": ch.id,
                "chapter_number": ch.chapter_number,
                "title": ch.title,
                "summary": ch.summary,
                "key_facts": ch.key_facts or [],
                "is_completed": ch.is_completed
            }
            for ch in chapters
        ]
    }

@router.get("/{book_id}/chapters/{chapter_id}/study-center")
def get_chapter_study_center(
    book_id: str,
    chapter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chapter Study Center: Read notes, Ask Tutor, Flashcards, PYQs, Important Facts, Diagrams.
    """
    chapter = db.query(BookChapter).filter(BookChapter.id == chapter_id, BookChapter.book_id == book_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    book = db.query(Book).filter(Book.id == book_id).first()
    topic_tag = chapter.title.split("(")[0].strip()

    knowledge_items = db.query(KnowledgeItem).filter(
        KnowledgeItem.user_id == current_user.id,
        KnowledgeItem.topic.ilike(f"%{topic_tag}%")
    ).all()

    flashcards = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.topic.ilike(f"%{topic_tag}%")
    ).limit(6).all()

    pyqs = db.query(PYQItem).filter(
        PYQItem.topic.ilike(f"%{topic_tag}%")
    ).limit(5).all()

    return {
        "chapter": {
            "id": chapter.id,
            "number": chapter.chapter_number,
            "title": chapter.title,
            "book_title": book.title if book else "Reference",
            "summary": chapter.summary,
            "key_facts": chapter.key_facts or []
        },
        "extracted_knowledge": [
            {"id": k.id, "title": k.title, "type": k.type, "summary": k.summary, "formula": k.formula_equation}
            for k in knowledge_items
        ],
        "flashcards": [
            {"id": fc.id, "front": fc.front, "back": fc.back, "card_type": fc.card_type}
            for fc in flashcards
        ],
        "pyqs": [
            {"id": p.id, "year": p.year, "question": p.question_text, "exam": p.exam_name}
            for p in pyqs
        ]
    }
