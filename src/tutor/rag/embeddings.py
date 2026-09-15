"""Dense embeddings and similarity module for curriculum RAG."""

import logging
from typing import List, Optional, Union
import numpy as np

logger = logging.getLogger(__name__)


class DenseEmbedder:
    """Generates dense vector embeddings using SentenceTransformers with fallback support."""

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        device: Optional[str] = None,
    ):
        self.model_name = model_name
        self.device = device
        self._model = None

    @property
    def model(self):
        """Lazy loader for sentence transformer model."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer

                logger.info("Loading dense embedding model: %s", self.model_name)
                self._model = SentenceTransformer(self.model_name, device=self.device)
            except Exception as e:
                logger.warning("Failed to load SentenceTransformer (%s). Using lightweight mock embedder.", e)
                self._model = "mock"
        return self._model

    def encode(
        self,
        texts: Union[str, List[str]],
        batch_size: int = 32,
        normalize_embeddings: bool = True,
    ) -> np.ndarray:
        """Encodes texts into dense float32 vectors.

        Args:
            texts: Single string or list of strings.
            batch_size: Batch size for encoding.
            normalize_embeddings: Whether to L2-normalize vectors for cosine similarity.

        Returns:
            2D numpy array of shape (num_texts, embedding_dim).
        """
        if isinstance(texts, str):
            texts = [texts]

        if not texts:
            return np.empty((0, 384), dtype=np.float32)

        if self.model == "mock" or not hasattr(self.model, "encode"):
            # Deterministic mock hash embedding for fast testing without downloading weights
            dim = 384
            embeddings = []
            for t in texts:
                np.random.seed(abs(hash(t)) % (2**31 - 1))
                vec = np.random.randn(dim).astype(np.float32)
                if normalize_embeddings:
                    vec /= np.linalg.norm(vec) + 1e-10
                embeddings.append(vec)
            return np.vstack(embeddings)

        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            normalize_embeddings=normalize_embeddings,
            show_progress_bar=False,
        )
        return np.array(embeddings, dtype=np.float32)
