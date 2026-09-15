"""End-to-End Curriculum RAG Pipeline.

Handles document chunking, metadata attachment, index persistence,
and hybrid query execution.
"""

import argparse
import json
import logging
import os
from typing import Any, Dict, List, Optional

import numpy as np

from tutor.rag.embeddings import DenseEmbedder
from tutor.rag.retriever import HybridRetriever, RetrievedChunk

logger = logging.getLogger(__name__)


def chunk_text(
    text: str,
    chunk_size: int = 512,
    chunk_overlap: int = 64,
) -> List[str]:
    """Splits text into overlapping word chunks."""
    words = text.split()
    if not words:
        return []

    chunks = []
    step = max(1, chunk_size - chunk_overlap)
    for i in range(0, len(words), step):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk.strip())
    return chunks


class CurriculumRAG:
    """High-level interface for curriculum document indexing and hybrid retrieval."""

    def __init__(
        self,
        embedder: Optional[DenseEmbedder] = None,
        use_cross_encoder: bool = False,
    ):
        self.retriever = HybridRetriever(
            dense_embedder=embedder or DenseEmbedder(),
            use_cross_encoder=use_cross_encoder,
        )

    def load_documents_and_index(
        self,
        documents: List[Dict[str, Any]],
        chunk_size: int = 512,
        chunk_overlap: int = 64,
    ):
        """Processes raw document dicts into chunks and builds hybrid index."""
        all_chunks: List[RetrievedChunk] = []

        for doc_idx, doc in enumerate(documents):
            raw_text = doc.get("content", "")
            source = doc.get("source", "NCERT STEM")
            subject = doc.get("subject", "Science")
            grade = doc.get("grade", 10)
            chapter = doc.get("chapter", "General")
            topic = doc.get("topic", "Concepts")
            doc_license = doc.get("license", "CC-BY-NC 4.0")

            text_chunks = chunk_text(raw_text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

            for c_idx, txt in enumerate(text_chunks):
                chunk_id = f"doc_{doc_idx:04d}_chk_{c_idx:03d}"
                all_chunks.append(
                    RetrievedChunk(
                        chunk_id=chunk_id,
                        text=txt,
                        subject=subject,
                        grade=grade,
                        chapter=chapter,
                        topic=topic,
                        source=source,
                        license=doc_license,
                    )
                )

        self.retriever.index(all_chunks)
        logger.info("RAG pipeline indexed %d total chunks from %d documents.", len(all_chunks), len(documents))

    def save_index(self, output_dir: str):
        """Serializes chunks and dense vectors to disk."""
        os.makedirs(output_dir, exist_ok=True)

        chunks_data = [
            {
                "chunk_id": c.chunk_id,
                "text": c.text,
                "subject": c.subject,
                "grade": c.grade,
                "chapter": c.chapter,
                "topic": c.topic,
                "source": c.source,
                "license": c.license,
            }
            for c in self.retriever.chunks
        ]

        chunks_path = os.path.join(output_dir, "chunks.json")
        with open(chunks_path, "w", encoding="utf-8") as f:
            json.dump(chunks_data, f, indent=2, ensure_ascii=False)

        if self.retriever.dense_vectors is not None:
            vecs_path = os.path.join(output_dir, "vectors.npy")
            np.save(vecs_path, self.retriever.dense_vectors)

        logger.info("RAG index saved to %s", output_dir)

    def load_index(self, index_dir: str):
        """Loads serialized chunks and dense vectors from disk."""
        chunks_path = os.path.join(index_dir, "chunks.json")
        if not os.path.exists(chunks_path):
            raise FileNotFoundError(f"Chunks file not found at: {chunks_path}")

        with open(chunks_path, "r", encoding="utf-8") as f:
            chunks_data = json.load(f)

        chunks = [
            RetrievedChunk(
                chunk_id=d["chunk_id"],
                text=d["text"],
                subject=d.get("subject", "General"),
                grade=d.get("grade", 10),
                chapter=d.get("chapter", ""),
                topic=d.get("topic", ""),
                source=d.get("source", "NCERT"),
                license=d.get("license", "CC-BY-NC"),
            )
            for d in chunks_data
        ]

        self.retriever.chunks = chunks
        self.retriever.bm25 = HybridRetriever._tokenize and self.retriever.bm25
        # Rebuild BM25 and load/compute vectors
        tokenized_corpus = [HybridRetriever._tokenize(c.text) for c in chunks]
        from rank_bm25 import BM25Okapi
        self.retriever.bm25 = BM25Okapi(tokenized_corpus)

        vecs_path = os.path.join(index_dir, "vectors.npy")
        if os.path.exists(vecs_path):
            self.retriever.dense_vectors = np.load(vecs_path)
        else:
            texts = [c.text for c in chunks]
            self.retriever.dense_vectors = self.retriever.dense_embedder.encode(texts, normalize_embeddings=True)

        logger.info("Loaded %d chunks from %s", len(chunks), index_dir)

    def query(
        self,
        query_text: str,
        top_k: int = 3,
        subject_filter: Optional[str] = None,
    ) -> List[RetrievedChunk]:
        """Retrieves top relevant curriculum passages for a query."""
        results = self.retriever.retrieve_hybrid(query_text, top_k_final=top_k * 2)
        if subject_filter:
            results = [r for r in results if r.subject.lower() == subject_filter.lower()]
        return results[:top_k]
