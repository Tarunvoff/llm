"""Cross-Encoder Reranker using sentence-transformers.

Receives query + candidate texts and produces relevance scores.
Does NOT use the generation LLM.
"""

import logging
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def load_reranker(
    model_name: str = "BAAI/bge-reranker-base",
    device: str = "auto",
):
    """Loads a cross-encoder reranker model.

    Args:
        model_name: HuggingFace model identifier.
        device: 'cpu', 'cuda', or 'auto'.

    Returns:
        Loaded CrossEncoder model.
    """
    from sentence_transformers import CrossEncoder

    resolved = device
    if device == "auto":
        try:
            import torch
            resolved = "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            resolved = "cpu"

    logger.info("Loading reranker: %s (device=%s)", model_name, resolved)
    t0 = time.time()
    model = CrossEncoder(model_name, device=resolved)
    logger.info("Reranker loaded in %.1fs", time.time() - t0)
    return model


def rerank(
    query: str,
    candidates: List[Dict[str, Any]],
    reranker,
    top_k: int = 5,
    text_field: str = "text",
) -> List[Dict[str, Any]]:
    """Reranks candidate results using cross-encoder relevance scores.

    Visual-only results (no text) are passed through with their visual_score
    as a proxy, since cross-encoders require text input.

    Args:
        query: The original user query.
        candidates: List of result dicts from hybrid retrieval.
        reranker: Loaded CrossEncoder model.
        top_k: Number of top results to return after reranking.
        text_field: Field name containing the text to score against.

    Returns:
        Top-k results sorted by reranker_score descending.
    """
    if not candidates:
        return []

    # Separate text-bearing and visual-only candidates
    text_candidates = [c for c in candidates if c.get(text_field, "").strip()
                       and not c.get("text", "").startswith("[Visual tile:")]
    visual_candidates = [c for c in candidates if c not in text_candidates]

    scored = []

    if text_candidates:
        pairs = [[query, c[text_field]] for c in text_candidates]
        try:
            scores = reranker.predict(pairs, show_progress_bar=False)
            for cand, score in zip(text_candidates, scores):
                result = dict(cand)
                result["reranker_score"] = float(score)
                scored.append(result)
        except Exception as exc:
            logger.error("Reranker scoring failed: %s", exc)
            # Fall back to fusion score
            for cand in text_candidates:
                result = dict(cand)
                result["reranker_score"] = cand.get("fusion_score", 0.0)
                scored.append(result)

    # Visual candidates use visual_score as proxy
    for cand in visual_candidates:
        result = dict(cand)
        result["reranker_score"] = cand.get("visual_score", 0.0)
        scored.append(result)

    # Sort all by reranker score
    scored.sort(key=lambda x: x.get("reranker_score", 0.0), reverse=True)
    return scored[:top_k]
