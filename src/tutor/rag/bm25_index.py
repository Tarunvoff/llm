"""BM25 Index — persistent build and search using rank_bm25.

Build once, persist to disk, reload on query.
Never rebuilds the index on every query call.
"""

import json
import logging
import os
import pickle
import re
from typing import Any, Dict, List, Optional, Tuple

from rank_bm25 import BM25Okapi

logger = logging.getLogger(__name__)

_INDEX_FILE = "bm25_index.pkl"
_CHUNKS_FILE = "bm25_chunks.json"


def _tokenize(text: str) -> List[str]:
    """Lowercases and splits into word tokens; removes non-alphanumeric."""
    text = text.lower()
    return re.findall(r"[a-z0-9]+", text)


def build_bm25_index(
    chunks: List[Dict[str, Any]],
    index_dir: str,
) -> None:
    """Builds and saves a BM25 index from chunk records.

    Args:
        chunks: List of chunk dicts with 'text' and full provenance.
        index_dir: Directory to persist the index files.
    """
    os.makedirs(index_dir, exist_ok=True)

    if not chunks:
        raise ValueError("Cannot build BM25 index: no chunks provided.")

    logger.info("Building BM25 index from %d chunks...", len(chunks))

    corpus = [_tokenize(c["text"]) for c in chunks]
    bm25 = BM25Okapi(corpus)

    # Persist index object
    index_path = os.path.join(index_dir, _INDEX_FILE)
    with open(index_path, "wb") as f:
        pickle.dump(bm25, f)

    # Persist metadata for result reconstruction
    chunks_path = os.path.join(index_dir, _CHUNKS_FILE)
    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False)

    logger.info("BM25 index saved to %s (%d chunks)", index_dir, len(chunks))


def load_bm25_index(
    index_dir: str,
) -> Tuple[BM25Okapi, List[Dict[str, Any]]]:
    """Loads a previously built BM25 index from disk.

    Returns:
        (bm25, chunks) tuple.

    Raises:
        FileNotFoundError if index files are missing.
    """
    index_path = os.path.join(index_dir, _INDEX_FILE)
    chunks_path = os.path.join(index_dir, _CHUNKS_FILE)

    if not os.path.exists(index_path):
        raise FileNotFoundError(f"BM25 index not found at {index_path}. Run build_rag.py first.")
    if not os.path.exists(chunks_path):
        raise FileNotFoundError(f"BM25 chunks file not found at {chunks_path}.")

    with open(index_path, "rb") as f:
        bm25 = pickle.load(f)

    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    logger.info("BM25 index loaded: %d chunks from %s", len(chunks), index_dir)
    return bm25, chunks


def search_bm25(
    query: str,
    bm25: BM25Okapi,
    chunks: List[Dict[str, Any]],
    top_k: int = 20,
) -> List[Dict[str, Any]]:
    """Retrieves top-k chunks using BM25 scoring.

    Args:
        query: The search query string.
        bm25: Loaded BM25Okapi object.
        chunks: Parallel list of chunk dicts.
        top_k: Number of results to return.

    Returns:
        List of result dicts sorted by descending BM25 score.
    """
    tokenized_query = _tokenize(query)
    if not tokenized_query:
        logger.warning("BM25 query tokenized to empty list.")
        return []

    scores = bm25.get_scores(tokenized_query)

    # Get top-k indices sorted by score descending
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

    results = []
    for idx in top_indices:
        if scores[idx] <= 0.0:
            continue
        result = {
            **chunks[idx],
            "bm25_score": float(scores[idx]),
            "retrieval_rank": len(results) + 1,
        }
        results.append(result)

    logger.debug("BM25: %d results for query '%s'", len(results), query[:60])
    return results
