from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, Optional, Type, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

class AIService(ABC):
    """
    Abstract AI Service Interface.
    All educational AI generation, structured extraction, streaming, and vision tasks
    must implement this contract. This guarantees clean pluggability for future Hugging Face
    fine-tuned models without altering upstream APIs or database structures.
    """
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.3
    ) -> str:
        """Generate a raw text response from the model."""
        pass
    
    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2
    ) -> T:
        """Generate a structured response validated against a Pydantic schema."""
        pass
    
    @abstractmethod
    async def stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.3
    ) -> AsyncGenerator[str, None]:
        """Stream response chunks asynchronously for real-time pedagogical dialogue."""
        pass
    
    @abstractmethod
    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:
        """Analyze educational diagram/image input and return grounded explanation."""
        pass
