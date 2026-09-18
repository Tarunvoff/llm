import logging
import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models import (
    User, UserProfile, Mistake, TopicMastery, RevisionItem,
    KnowledgeItem, Flashcard, PYQItem, RetentionMemoryLog
)
from app.ai.video_provider import VideoProvider
from app.ai.diagram_engine import DiagramEngine

logger = logging.getLogger("intellitutor.ai.recommendations")

class ResourceRecommendationService:
    @classmethod
    def get_what_should_i_do_now(cls, user: User, db: Session) -> Dict[str, Any]:
        """
        Synthesizes student's exam timeline, lowest mastery topics, unresolved mistakes,
        and due spaced repetition cards to yield ONE clear, actionable recommendation.
        """
        # 1. Check for immediate spaced revision items due
        now = datetime.now(timezone.utc)
        due_rev = db.query(RevisionItem).filter(
            RevisionItem.user_id == user.id,
            RevisionItem.is_completed == False,
            RevisionItem.due_date <= now + timedelta(hours=12)
        ).first()

        # 2. Check for unresolved repeated mistakes
        top_mistake = db.query(Mistake).filter(
            Mistake.user_id == user.id,
            Mistake.is_resolved == False
        ).order_by(Mistake.retest_count.desc(), Mistake.created_at.desc()).first()

        # 3. Check for lowest mastery topic
        lowest_mastery = db.query(TopicMastery).filter(
            TopicMastery.user_id == user.id
        ).order_by(TopicMastery.mastery_percentage.asc()).first()

        target_topic = "Conservation of Angular Momentum"
        subject = "Physics"
        reason = "Your mastery dropped after two incorrect attempts, and 3 revision items are due."
        action_title = "Study Conservation of Angular Momentum for 25 minutes"
        action_type = "topic_study"
        target_minutes = 25

        if top_mistake and lowest_mastery and lowest_mastery.mastery_percentage < 55:
            target_topic = lowest_mastery.topic
            subject = lowest_mastery.subject
            reason = f"Your mastery in {target_topic} is at {int(lowest_mastery.mastery_percentage)}% with {top_mistake.concept} triggering recurring errors."
            action_title = f"Master {target_topic} (Notes + 5 Flashcards + 3 PYQs)"
            target_minutes = 20
        elif due_rev:
            target_topic = due_rev.topic
            subject = due_rev.subject
            reason = f"Active recall interval reached for {target_topic}. Review today to lock into long-term memory."
            action_title = f"Quick Recall Drill: {target_topic}"
            action_type = "flashcard_drill"
            target_minutes = 15

        return {
            "topic": target_topic,
            "subject": subject,
            "title": action_title,
            "reason": reason,
            "action_type": action_type,
            "target_minutes": target_minutes,
            "priority": "HIGH",
            "suggested_steps": [
                {"step": 1, "action": f"Review {target_topic} formula sheet & notes", "duration": "5 min"},
                {"step": 2, "action": "Solve 5 targeted rapid flashcards", "duration": "5 min"},
                {"step": 3, "action": "Attempt 2 high-frequency PYQs", "duration": "10 min"}
            ]
        }

    @classmethod
    def get_topic_360_overview(cls, topic_name: str, user: User, db: Session) -> Dict[str, Any]:
        """
        Constructs the comprehensive 360-degree topic learning nerve center:
        Learn (Notes, AI Explanation), Visualize (Diagrams), Remember (Formulas, Flashcards),
        Practice (Questions), PYQs, Watch (Videos), Mistakes, Revision, and Analytics.
        """
        # 1. Topic Mastery
        mastery = db.query(TopicMastery).filter(
            TopicMastery.user_id == user.id,
            TopicMastery.topic.ilike(f"%{topic_name}%")
        ).first()

        mastery_pct = mastery.mastery_percentage if mastery else 45.0
        subject = mastery.subject if mastery else "Physics"
        chapter = mastery.chapter if mastery else "General"

        # 2. Knowledge Items & Formulas
        knowledge_nodes = db.query(KnowledgeItem).filter(
            KnowledgeItem.user_id == user.id,
            KnowledgeItem.topic.ilike(f"%{topic_name}%")
        ).all()

        formulas = [
            {
                "id": k.id,
                "title": k.title,
                "formula": k.formula_equation or "L = I\\omega",
                "summary": k.summary,
                "variables": k.variables_explanation or {}
            }
            for k in knowledge_nodes if k.type in ["FORMULA", "EQUATION"] or k.formula_equation
        ]

        # 3. Flashcards
        cards = db.query(Flashcard).filter(
            Flashcard.user_id == user.id,
            Flashcard.topic.ilike(f"%{topic_name}%")
        ).all()

        # 4. Mistakes
        mistakes = db.query(Mistake).filter(
            Mistake.user_id == user.id,
            Mistake.topic.ilike(f"%{topic_name}%")
        ).all()

        # 5. PYQs
        pyqs = db.query(PYQItem).filter(
            PYQItem.topic.ilike(f"%{topic_name}%")
        ).all()

        # 6. Videos
        videos = VideoProvider.search_videos(
            topic=topic_name,
            subject=subject,
            preferred_style="Visual"
        )

        # 7. Diagrams
        diagrams = [
            d for d in DiagramEngine.get_all_diagrams()
            if topic_name.lower() in d["topic"].lower() or d["subject"].lower() == subject.lower()
        ]

        # 8. Revision Status
        rev_item = db.query(RevisionItem).filter(
            RevisionItem.user_id == user.id,
            RevisionItem.topic.ilike(f"%{topic_name}%")
        ).first()

        return {
            "topic": topic_name,
            "subject": subject,
            "chapter": chapter,
            "mastery_percentage": mastery_pct,
            "status": "Mastered" if mastery_pct >= 80 else ("In Progress" if mastery_pct >= 50 else "Needs Attention"),
            "learn": {
                "summary": f"Comprehensive conceptual breakdown of {topic_name} under {chapter}.",
                "knowledge_count": len(knowledge_nodes),
                "notes_available": True
            },
            "visualize": {
                "diagrams_count": len(diagrams),
                "diagrams": diagrams
            },
            "remember": {
                "formula_count": len(formulas),
                "formulas": formulas,
                "flashcards_count": len(cards),
                "flashcards_due": sum(1 for c in cards if c.retention_state in ["NEW", "LEARNING", "OVERDUE"])
            },
            "practice": {
                "available_questions": 20,
                "pyqs_count": len(pyqs),
                "pyqs": [
                    {
                        "id": p.id,
                        "year": p.year,
                        "exam_name": p.exam_name,
                        "question_text": p.question_text,
                        "recurring_pattern": p.recurring_pattern_tag
                    }
                    for p in pyqs
                ]
            },
            "watch": {
                "recommended_videos_count": len(videos),
                "videos": videos
            },
            "mistakes": {
                "total_mistakes": len(mistakes),
                "unresolved": sum(1 for m in mistakes if not m.is_resolved),
                "items": [
                    {
                        "id": m.id,
                        "concept": m.concept,
                        "mistake_type": m.mistake_type,
                        "user_answer": m.user_answer,
                        "correct_answer": m.correct_answer
                    }
                    for m in mistakes
                ]
            },
            "revision": {
                "next_review": rev_item.due_date.strftime("%b %d, %Y") if rev_item and rev_item.due_date else "Tomorrow",
                "interval_stage": rev_item.interval_stage if rev_item else 1
            }
        }

    @classmethod
    def compute_ebbinghaus_retention(cls, user_id: str, db: Session) -> List[Dict[str, Any]]:
        """
        Calculates Ebbinghaus forgetting curve decay: R = exp(-t / S)
        t = elapsed days since last practice
        S = stability factor (increases with correct recall, decreases with lapses)
        """
        masteries = db.query(TopicMastery).filter(TopicMastery.user_id == user_id).all()
        now = datetime.now(timezone.utc)
        results = []

        for m in masteries:
            last_date = m.last_practiced_at
            if last_date and last_date.tzinfo is None:
                last_date = last_date.replace(tzinfo=timezone.utc)
            days_elapsed = (now - last_date).total_seconds() / 86400.0 if last_date else 3.0
            
            # Base stability derived from mastery and attempts
            base_stability = max(1.5, (m.mastery_percentage / 20.0) * (1 + math.log10(max(1, m.total_attempts + 1))))
            retention_pct = max(15.0, min(100.0, math.exp(-days_elapsed / base_stability) * 100.0))
            
            decay_status = "STABLE"
            if retention_pct < 50:
                decay_status = "CRITICAL_DECAY"
            elif retention_pct < 70:
                decay_status = "AT_RISK"

            results.append({
                "topic": m.topic,
                "subject": m.subject,
                "days_since_practice": round(days_elapsed, 1),
                "stability_days": round(base_stability, 1),
                "predicted_retention_pct": round(retention_pct, 1),
                "decay_status": decay_status,
                "needs_recall_drill": retention_pct < 70
            })

        results.sort(key=lambda x: x["predicted_retention_pct"])
        return results
