"""Hybrid Retriever — BM25 + Dense + PixelRAG with Reciprocal Rank Fusion (RRF).

Combines results from three retrievers:
  1. BM25 lexical retrieval
  2. Dense semantic retrieval (FAISS + sentence-transformers)
  3. Visual retrieval (PixelRAG tiles via CLIP)

Fusion: Reciprocal Rank Fusion (RRF) — standard approach for multi-list merging.
"""

import logging
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class RetrievedChunk:
    """Dataclass representing a retrieved document chunk with provenance metadata."""

    text: str
    subject: str = ""
    grade: Optional[int] = None
    chapter: str = ""
    topic: str = ""
    source: str = ""
    chunk_id: str = ""
    fusion_score: float = 0.0
    rerank_score: float = 0.0
    page_number: Optional[int] = None
    pdf_name: str = ""
    visual_score: Optional[float] = None
    tile_image_path: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    def to_citation_text(self) -> str:
        parts = []
        if self.subject:
            parts.append(f"Subject: {self.subject}")
        if self.chapter:
            parts.append(f"Chapter: {self.chapter}")
        if self.topic:
            parts.append(f"Topic: {self.topic}")
        if self.pdf_name or self.source:
            parts.append(f"Source: {self.pdf_name or self.source}")
        if self.page_number is not None:
            parts.append(f"Page: {self.page_number}")
        header = f"[{', '.join(parts)}]\n" if parts else ""
        return f"{header}{self.text}"

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RetrievedChunk":
        return cls(
            text=data.get("text", ""),
            subject=data.get("subject", ""),
            grade=data.get("grade"),
            chapter=data.get("chapter", ""),
            topic=data.get("topic", ""),
            source=data.get("source", ""),
            chunk_id=data.get("chunk_id", ""),
            fusion_score=data.get("fusion_score", 0.0),
            rerank_score=data.get("rerank_score", 0.0),
            page_number=data.get("page_number"),
            pdf_name=data.get("pdf_name", ""),
            visual_score=data.get("visual_score"),
            tile_image_path=data.get("tile_image_path"),
            metadata=data.get("metadata"),
        )



def reciprocal_rank_fusion(
    result_lists: List[List[Dict[str, Any]]],
    k: int = 60,
    id_field: str = "chunk_id",
) -> List[Dict[str, Any]]:
    """Merges multiple ranked result lists using Reciprocal Rank Fusion.

    RRF score for a document d across N lists:
        score(d) = sum_{i=1..N} 1 / (k + rank_i(d))

    where rank_i(d) is the 1-based position of d in list i.
    Documents not appearing in a list contribute 0 for that list.

    Args:
        result_lists: List of ranked result lists (each is a list of dicts).
        k: RRF constant (higher = more weight to lower-ranked docs).
        id_field: Field to use as unique document identifier.

    Returns:
        Merged list sorted by RRF score descending, with 'fusion_score' field.
    """
    rrf_scores: Dict[str, float] = defaultdict(float)
    doc_store: Dict[str, Dict[str, Any]] = {}

    for result_list in result_lists:
        for rank, doc in enumerate(result_list, start=1):
            doc_id = doc.get(id_field, "")
            if not doc_id:
                continue
            rrf_scores[doc_id] += 1.0 / (k + rank)
            if doc_id not in doc_store:
                doc_store[doc_id] = doc

    fused = []
    for doc_id, score in sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True):
        doc = dict(doc_store[doc_id])
        doc["fusion_score"] = round(score, 6)
        fused.append(doc)

    return fused


def linear_fusion(
    result_lists: List[List[Dict[str, Any]]],
    score_fields: List[str],
    weights: Optional[List[float]] = None,
    id_field: str = "chunk_id",
) -> List[Dict[str, Any]]:
    """Linear weighted combination of normalized retrieval scores.

    Args:
        result_lists: Result lists from each retriever.
        score_fields: Score field name for each list (e.g. 'bm25_score').
        weights: Weight for each retriever. Defaults to equal weights.
        id_field: Unique document ID field.

    Returns:
        Merged list sorted by fusion_score descending.
    """
    if weights is None:
        weights = [1.0 / len(result_lists)] * len(result_lists)

    doc_store: Dict[str, Dict[str, Any]] = {}
    fusion_scores: Dict[str, float] = defaultdict(float)

    for result_list, field, weight in zip(result_lists, score_fields, weights):
        if not result_list:
            continue
        max_score = max(abs(d.get(field, 0.0)) for d in result_list) or 1.0

        for doc in result_list:
            doc_id = doc.get(id_field, "")
            if not doc_id:
                continue
            norm_score = doc.get(field, 0.0) / max_score
            fusion_scores[doc_id] += weight * norm_score
            if doc_id not in doc_store:
                doc_store[doc_id] = doc

    fused = []
    for doc_id, score in sorted(fusion_scores.items(), key=lambda x: x[1], reverse=True):
        doc = dict(doc_store[doc_id])
        doc["fusion_score"] = round(score, 6)
        fused.append(doc)

    return fused


def hybrid_retrieve(
    query: str,
    bm25_results: List[Dict[str, Any]],
    dense_results: List[Dict[str, Any]],
    visual_results: Optional[List[Dict[str, Any]]] = None,
    fusion: str = "rrf",
    rrf_k: int = 60,
    final_candidates: int = 30,
) -> List[Dict[str, Any]]:
    """Combines results from BM25, dense, and optional visual retrieval.

    Args:
        query: The original query (for logging).
        bm25_results: Results from BM25 search.
        dense_results: Results from dense vector search.
        visual_results: Results from PixelRAG visual search (optional).
        fusion: 'rrf' or 'linear'.
        rrf_k: RRF constant.
        final_candidates: Maximum number of fused candidates to return.

    Returns:
        Fused and sorted candidate list with 'fusion_score'.
    """
    all_lists = [bm25_results, dense_results]
    if visual_results:
        all_lists.append(visual_results)

    logger.debug(
        "Hybrid retrieve: BM25=%d, Dense=%d, Visual=%d",
        len(bm25_results), len(dense_results), len(visual_results or []),
    )

    if fusion == "rrf":
        fused = reciprocal_rank_fusion(all_lists, k=rrf_k)
    elif fusion == "linear":
        fields = ["bm25_score", "dense_score"]
        if visual_results:
            fields.append("visual_score")
        fused = linear_fusion(all_lists, score_fields=fields)
    else:
        logger.warning("Unknown fusion method '%s'. Falling back to RRF.", fusion)
        fused = reciprocal_rank_fusion(all_lists, k=rrf_k)

    result = fused[:final_candidates]
    logger.debug("Hybrid fusion produced %d candidates (requested %d)", len(result), final_candidates)
    return result
