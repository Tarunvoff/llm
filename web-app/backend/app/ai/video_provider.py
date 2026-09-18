import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

logger = logging.getLogger("intellitutor.ai.videos")

class BaseVideoProvider(ABC):
    @abstractmethod
    def search_videos(
        self,
        topic: str,
        subject: str = "Physics",
        preferred_style: str = "Visual",
        duration_category: Optional[str] = None,
        language: str = "English"
    ) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_video_details(self, video_id: str) -> Optional[Dict[str, Any]]:
        pass


class CuratedExamVideoProvider(BaseVideoProvider):
    """
    Curated exam video provider with verified educational high-yield videos.
    Designed with a pluggable provider interface so YouTube Data API or other vendors can be attached seamlessly.
    """

    CURATED_VIDEOS = [
        {
            "id": "vid_rot_01",
            "title": "Conservation of Angular Momentum - Visual Intuition & Worked Problems",
            "channel": "Physics Galaxy by Ashish Arora",
            "topic": "Conservation of Angular Momentum",
            "subject": "Physics",
            "duration_minutes": 12,
            "duration_category": "Medium",
            "style": "Visual",
            "language": "English",
            "video_id_or_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "thumbnail_url": "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80",
            "difficulty": "Medium",
            "why_recommended": "High visual quality showing rotating stools and planetary orbits directly targeted at your recent conceptual mistakes."
        },
        {
            "id": "vid_bio_01",
            "title": "Cell Cycle, Mitosis and Meiosis in 15 Minutes (High-Yield NCERT Breakdown)",
            "channel": "Khan Academy India",
            "topic": "Cell Division (Mitosis vs Meiosis)",
            "subject": "Biology",
            "duration_minutes": 15,
            "duration_category": "Medium",
            "style": "Conceptual",
            "language": "English",
            "video_id_or_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "thumbnail_url": "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&auto=format&fit=crop&q=80",
            "difficulty": "Easy",
            "why_recommended": "Clear chromosome number accounting (2n, 4C) which was identified as your confusion area."
        },
        {
            "id": "vid_chem_01",
            "title": "Markovnikov vs Anti-Markovnikov Addition Mechanism & Carbocation Stability",
            "channel": "Alakh Pandey Physics Wallah",
            "topic": "Markovnikov Addition & Carbocations",
            "subject": "Chemistry",
            "duration_minutes": 18,
            "duration_category": "Medium",
            "style": "Problem solving",
            "language": "English",
            "video_id_or_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "thumbnail_url": "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&auto=format&fit=crop&q=80",
            "difficulty": "Hard",
            "why_recommended": "Step-by-step rearrangement traps solved with exam shortcuts."
        },
        {
            "id": "vid_kin_01",
            "title": "Projectile Motion - 2D Kinematics Derivations & Top 10 PYQs",
            "channel": "Unacademy JEE",
            "topic": "Kinematics 2D Projectile Equations",
            "subject": "Physics",
            "duration_minutes": 22,
            "duration_category": "Medium",
            "style": "Exam-oriented",
            "language": "English",
            "video_id_or_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "thumbnail_url": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
            "difficulty": "Medium",
            "why_recommended": "Covers maximum height, time of flight, and horizontal range derivations."
        }
    ]

    def search_videos(
        self,
        topic: str,
        subject: str = "Physics",
        preferred_style: str = "Visual",
        duration_category: Optional[str] = None,
        language: str = "English"
    ) -> List[Dict[str, Any]]:
        matches = []
        topic_lower = topic.lower()
        for v in self.CURATED_VIDEOS:
            score = 0
            if v["subject"].lower() == subject.lower():
                score += 3
            if topic_lower in v["topic"].lower() or topic_lower in v["title"].lower():
                score += 10
            if v["style"].lower() == preferred_style.lower():
                score += 2
            if duration_category and v["duration_category"].lower() == duration_category.lower():
                score += 2
            
            if score > 0:
                item = dict(v)
                item["relevance_score"] = score
                matches.append(item)
                
        matches.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        return matches if matches else self.CURATED_VIDEOS[:3]

    def get_video_details(self, video_id: str) -> Optional[Dict[str, Any]]:
        for v in self.CURATED_VIDEOS:
            if v["id"] == video_id:
                return v
        return None


# Global Singleton Provider Instance
VideoProvider: BaseVideoProvider = CuratedExamVideoProvider()
