"""Dense Vector Index using FAISS + sentence-transformers.

Build once, persist to disk (FAISS index + metadata JSON).
Uses BAAI/bge-small-en-v1.5 by default — configurable.

No Qwen3-4B. No external API calls. Fully local.
"""

import json
import logging
import os
import time
from typing import Any, Dict, List, Optional, Tuple

import faiss
import numpy as np

logger = logging.getLogger(__name__)

_FAISS_FILE = "faiss.index"
_METADATA_FILE = "dense_chunks.json"
_CONFIG_FILE = "dense_config.json"


def _get_device(device_str: str = "auto") -> str:
    """Resolves device string."""
    if device_str == "auto":
        try:
            import torch
            return "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            return "cpu"
    return device_str


def _load_embedder(model_name: str, device: str):
    """Loads sentence-transformer embedding model."""
    from sentence_transformers import SentenceTransformer
    logger.info("Loading embedding model: %s (device=%s)", model_name, device)
    t0 = time.time()
    model = SentenceTransformer(model_name, device=device)
    logger.info("Embedding model loaded in %.1fs", time.time() - t0)
    return model


def build_dense_index(
    chunks: List[Dict[str, Any]],
    index_dir: str,
    model_name: str = "BAAI/bge-small-en-v1.5",
    device: str = "auto",
    batch_size: int = 64,
    normalize: bool = True,
) -> None:
    """Encodes all chunks and saves a FAISS flat IP index.

    Args:
        chunks: Chunk records with 'text' and provenance.
        index_dir: Directory to persist the index.
        model_name: Sentence-transformers model identifier.
        device: Compute device ('cpu', 'cuda', or 'auto').
        batch_size: Encoding batch size.
        normalize: If True, L2-normalize embeddings for cosine similarity.
    """
    os.makedirs(index_dir, exist_ok=True)

    if not chunks:
        raise ValueError("Cannot build dense index: no chunks provided.")

    resolved_device = _get_device(device)
    model = _load_embedder(model_name, resolved_device)

    texts = [c["text"] for c in chunks]
    logger.info("Encoding %d chunks with batch_size=%d...", len(texts), batch_size)
    t0 = time.time()

    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=normalize,
        convert_to_numpy=True,
    )
    embeddings = embeddings.astype(np.float32)
    logger.info("Encoding complete in %.1fs — shape: %s", time.time() - t0, embeddings.shape)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)  # Inner product = cosine sim when normalized
    index.add(embeddings)

    # Persist
    faiss_path = os.path.join(index_dir, _FAISS_FILE)
    faiss.write_index(index, faiss_path)

    meta_path = os.path.join(index_dir, _METADATA_FILE)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False)

    cfg_path = os.path.join(index_dir, _CONFIG_FILE)
    with open(cfg_path, "w", encoding="utf-8") as f:
        json.dump({
            "model_name": model_name,
            "dim": dim,
            "normalize": normalize,
            "num_chunks": len(chunks),
        }, f)

    logger.info("Dense index saved to %s (%d vectors, dim=%d)", index_dir, len(chunks), dim)


def load_dense_index(
    index_dir: str,
) -> Tuple[Any, List[Dict[str, Any]], Dict[str, Any]]:
    """Loads FAISS index and chunk metadata from disk.

    Returns:
        (faiss_index, chunks, config) tuple.
    """
    faiss_path = os.path.join(index_dir, _FAISS_FILE)
    meta_path = os.path.join(index_dir, _METADATA_FILE)
    cfg_path = os.path.join(index_dir, _CONFIG_FILE)

    if not os.path.exists(faiss_path):
        raise FileNotFoundError(f"Dense index not found at {faiss_path}. Run build_rag.py first.")

    index = faiss.read_index(faiss_path)

    with open(meta_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    config = {}
    if os.path.exists(cfg_path):
        with open(cfg_path, "r", encoding="utf-8") as f:
            config = json.load(f)

    logger.info("Dense index loaded: %d vectors from %s", index.ntotal, index_dir)
    return index, chunks, config


def search_dense(
    query: str,
    index: Any,
    chunks: List[Dict[str, Any]],
    embedder,
    top_k: int = 20,
    normalize: bool = True,
) -> List[Dict[str, Any]]:
    """Retrieves top-k chunks using dense vector similarity.

    Args:
        query: Search query string.
        index: Loaded FAISS index.
        chunks: Chunk metadata list (parallel to index vectors).
        embedder: Loaded SentenceTransformer model.
        top_k: Number of results.
        normalize: Whether to normalize the query embedding.

    Returns:
        List of result dicts with 'dense_score'.
    """
    query_embedding = embedder.encode(
        [query],
        normalize_embeddings=normalize,
        convert_to_numpy=True,
    ).astype(np.float32)

    scores, indices = index.search(query_embedding, min(top_k, index.ntotal))
    scores = scores[0]
    indices = indices[0]

    results = []
    for rank, (idx, score) in enumerate(zip(indices, scores)):
        if idx < 0:  # FAISS returns -1 for unfilled slots
            continue
        result = {
            **chunks[idx],
            "dense_score": float(score),
            "retrieval_rank": rank + 1,
        }
        results.append(result)

    logger.debug("Dense: %d results for query '%s'", len(results), query[:60])
    return results
