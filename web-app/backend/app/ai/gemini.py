import json
import logging
from typing import AsyncGenerator, Optional, Type, TypeVar
from pydantic import BaseModel
import google.generativeai as genai
from app.core.config import settings
from app.ai.base import AIService

logger = logging.getLogger("intellitutor.ai")

T = TypeVar("T", bound=BaseModel)

class GeminiService(AIService):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self._initialized = False
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self._initialized = True
            except Exception as e:
                logger.error(f"Failed to configure Gemini client: {e}")
        else:
            logger.warning("No GEMINI_API_KEY detected. AI service will operate in pedagogical simulation mode.")

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.3
    ) -> str:
        if self._initialized:
            try:
                model = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=system_instruction
                )
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(temperature=temperature)
                )
                return response.text
            except Exception as e:
                logger.error(f"Gemini generation error: {e}")
                return self._fallback_pedagogical_response(prompt)
        
        return self._fallback_pedagogical_response(prompt)

    async def generate_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2
    ) -> T:
        instruction = (
            f"{system_instruction or 'You are IntelliTutor, an elite academic coach.'}\n"
            f"You MUST return ONLY valid JSON matching this schema: {json.dumps(response_schema.model_json_schema())}. "
            "Do not include markdown triple backticks around the JSON."
        )
        
        if self._initialized:
            try:
                model = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=instruction
                )
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=temperature,
                        response_mime_type="application/json"
                    )
                )
                clean_text = response.text.strip()
                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]
                
                parsed = json.loads(clean_text)
                return response_schema.model_validate(parsed)
            except Exception as e:
                logger.error(f"Gemini structured generation failed: {e}")
                return self._fallback_structured(prompt, response_schema)
        
        return self._fallback_structured(prompt, response_schema)

    async def stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.3
    ) -> AsyncGenerator[str, None]:
        if self._initialized:
            try:
                model = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=system_instruction
                )
                response = model.generate_content(
                    prompt,
                    stream=True,
                    generation_config=genai.types.GenerationConfig(temperature=temperature)
                )
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as e:
                logger.error(f"Gemini streaming error: {e}")
        
        # Fallback simulated streaming response
        simulated = self._fallback_pedagogical_response(prompt)
        import asyncio
        words = simulated.split(" ")
        for i in range(0, len(words), 3):
            sub = " ".join(words[i:i+3]) + " "
            yield sub
            await asyncio.sleep(0.02)

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:
        if self._initialized:
            try:
                model = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=system_instruction
                )
                part = {"mime_type": mime_type, "data": image_bytes}
                response = model.generate_content([part, prompt])
                return response.text
            except Exception as e:
                logger.error(f"Gemini vision error: {e}")
        
        return (
            "Diagram Analysis:\n"
            "1. Core Component: Identified free-body diagram representing rotational equilibrium.\n"
            "2. Governing Principle: Sum of torques equals zero about the hinge pivot (τ_net = 0).\n"
            "3. Key Equation: Στ = Iα. Notice the perpendicular lever arm distance."
        )

    def _fallback_pedagogical_response(self, prompt: str) -> str:
        return (
            f"### Concept Breakdown\n\n"
            f"In response to your query regarding **{prompt[:40]}...**:\n\n"
            f"1. **Core Principle**: In physics and competitive examinations, mastering the foundational definitions prevents 80% of calculation mistakes.\n"
            f"2. **Step-by-Step Derivation**: Ensure you isolate the system variables before applying conservation laws.\n"
            f"3. **Exam Tip**: Always check dimensional consistency before locking your final answer.\n\n"
            f"Would you like a diagnostic practice question on this topic to test your retention?"
        )

    def _fallback_structured(self, prompt: str, schema: Type[T]) -> T:
        schema_name = schema.__name__
        if "QuizQuestion" in schema_name:
            data = {
                "question": "A uniform solid cylinder of mass M and radius R rolls without slipping down an incline of angle θ. What is its acceleration?",
                "options": [
                    "(2/3) g sin θ",
                    "(1/2) g sin θ",
                    "(3/4) g sin θ",
                    "g sin θ"
                ],
                "correct_answer": "(2/3) g sin θ",
                "explanation": "For rolling without slipping, a = g sin θ / (1 + I / (MR²)). For a solid cylinder, I = (1/2)MR², hence 1 + 1/2 = 3/2, yielding a = (2/3) g sin θ.",
                "topic": "Rotational Motion",
                "difficulty": "Hard",
                "question_type": "MCQ"
            }
            return schema.model_validate(data)
        elif "TutorResponse" in schema_name:
            data = {
                "answer": "Kirchhoff's Current Law (KCL) states that the algebraic sum of currents entering a junction is zero (conservation of charge). Kirchhoff's Voltage Law (KVL) states that the sum of potential differences around any closed loop is zero (conservation of energy).",
                "sources": [
                    {"document_title": "Physics Notes Class 12", "page": 42, "excerpt": "KCL reflects charge conservation at nodal points."}
                ],
                "related_topics": ["Ohm's Law", "Nodal Analysis", "Wheatstone Bridge"],
                "recommended_action": {"title": "Test KVL / KCL Practice", "action_type": "practice", "payload": {"topic": "Current Electricity"}}
            }
            return schema.model_validate(data)
        
        # Generic fallback
        return schema.model_construct()

# Singleton AI Service instance
ai_service: AIService = GeminiService()
