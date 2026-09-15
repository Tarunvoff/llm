"""Hybrid Retriever combining BM25 lexical search and dense semantic search with reranking."""

from dataclasses import dataclass, field
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from rank_bm25 import BM25Okapi

from tutor.rag.embeddings import DenseEmbedder

logger = logging.getLogger(__name__)


@dataclass
class RetrievedChunk:
    """Represents a curriculum passage with rich metadata provenance."""

    chunk_id: str
    text: str
    score: float = 0.0
    subject: str = "General STEM"
    grade: int = 10
    chapter: str = ""
    topic: str = ""
    source: str = "Curriculum"
    license: str = "Educational CC-BY-NC"
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_citation_text(self) -> str:
        """Formats chunk for inclusion in LLM prompt with provenance."""
        header = f"[{self.source} | Grade {self.grade} {self.subject} | {self.chapter} - {self.topic}]"
        return f"{header}\n{self.text.strip()}"


class HybridRetriever:
    """Combines BM25 lexical search with dense embeddings and reciprocal rank fusion."""

    def __init__(
        self,
        dense_embedder: Optional[DenseEmbedder] = None,
        use_cross_encoder: bool = False,
    ):
        self.dense_embedder = dense_embedder or DenseEmbedder()
        self.use_cross_encoder = use_cross_encoder
        self.chunks: List[RetrievedChunk] = []
        self.bm25: Optional[BM25Okapi] = None
        self.dense_vectors: Optional[np.ndarray] = None
        self._reranker = None

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        """Simple whitespace and punctuation tokenizer for BM25."""
        return re.findall(r"\w+", text.lower())

    def index(self, chunks: List[RetrievedChunk]):
        """Indexes a list of RetrievedChunk objects for hybrid search."""
        self.chunks = chunks
        if not chunks:
            self.bm25 = None
            self.dense_vectors = None
            return

        # Build BM25 Index
        tokenized_corpus = [self._tokenize(c.text) for c in chunks]
        self.bm25 = BM25Okapi(tokenized_corpus)

        # Build Dense Embeddings Index
        texts = [c.text for c in chunks]
        self.dense_vectors = self.dense_embedder.encode(texts, normalize_embeddings=True)
        logger.info("Indexed %d curriculum chunks.", len(chunks))

    def retrieve_bm25(self, query: str, top_k: int = 10) -> List[Tuple[int, float]]:
        """Performs lexical search using BM25."""
        if self.bm25 is None or not self.chunks:
            return []
        tokenized_query = self._tokenize(query)
        scores = self.bm25.get_scores(tokenized_query)
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [(int(idx), float(scores[idx])) for idx in top_indices if scores[idx] > 0]

    def retrieve_dense(self, query: str, top_k: int = 10) -> List[Tuple[int, float]]:
        """Performs semantic vector search using cosine similarity."""
        if self.dense_vectors is None or not self.chunks:
            return []
        query_vec = self.dense_embedder.encode(query, normalize_embeddings=True)[0]
        scores = np.dot(self.dense_vectors, query_vec)
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [(int(idx), float(scores[idx])) for idx in top_indices]

    def retrieve_hybrid(
        self,
        query: str,
        top_k_bm25: int = 10,
        top_k_dense: int = 10,
        top_k_final: int = 3,
        rrf_k: int = 60,
    ) -> List[RetrievedChunk]:
        """Performs hybrid retrieval using Reciprocal Rank Fusion (RRF)."""
        if not self.chunks:
            return []

        bm25_results = self.retrieve_bm25(query, top_k=top_k_bm25)
        dense_results = self.retrieve_dense(query, top_k=top_k_dense)

        # Reciprocal Rank Fusion (RRF)
        rrf_scores: Dict[int, float] = {}

        for rank, (idx, _) in enumerate(bm25_results):
            rrf_scores[idx] = rrf_scores.get(idx, 0.0) + (1.0 / (rrf_k + rank + 1))

        for rank, (idx, _) in enumerate(dense_results):
            rrf_scores[idx] = rrf_scores.get(idx, 0.0) + (1.0 / (rrf_k + rank + 1))

        sorted_indices = sorted(rrf_scores.keys(), key=lambda i: rrf_scores[i], reverse=True)[
            :top_k_final
        ]

        results = []
        for idx in sorted_indices:
            orig = self.chunks[idx]
            chunk = RetrievedChunk(
                chunk_id=orig.chunk_id,
                text=orig.text,
                score=rrf_scores[idx],
                subject=orig.subject,
                grade=orig.grade,
                chapter=orig.chapter,
                topic=orig.topic,
                source=orig.source,
                license=orig.license,
                metadata=orig.metadata,
            )
            results.append(chunk)

        return results
