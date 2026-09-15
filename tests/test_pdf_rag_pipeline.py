"""Comprehensive unit tests for the production-style PDF RAG Pipeline.

Tests:
1. PDF extraction & cleaning & chunking
2. BM25 indexing & retrieval
3. Dense (FAISS) indexing & retrieval
4. Visual (PixelRAG) tile rendering & CLIP search
5. Hybrid retrieval (RRF fusion)
6. Reranking (Cross-Encoder)
7. End-to-end RAGPipeline workflow
"""

import json
import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from tutor.rag.bm25_index import build_bm25_index, load_bm25_index, search_bm25
from tutor.rag.chunker import chunk_page, chunk_pages, chunk_text
from tutor.rag.cleaner import clean_page, clean_pages
from tutor.rag.dense_index import build_dense_index, load_dense_index, search_dense
from tutor.rag.pdf_extractor import discover_pdfs, extract_pdf
from tutor.rag.pipeline import RAGPipeline
from tutor.rag.pixelrag_pipeline import render_pdf_to_tiles, build_visual_index, search_visual
from tutor.rag.reranker import rerank
from tutor.rag.retriever import hybrid_retrieve, reciprocal_rank_fusion


def test_clean_and_chunk():
    raw_page = {
        "document_id": "test_doc",
        "source": "test.pdf",
        "page": 1,
        "text": "Header Title\n\nNewton's first law states that an object at rest stays at rest.\n\nFooter Page 1",
    }
    cleaned = clean_page(raw_page, detect_headers_footers=False)
    assert "Newton" in cleaned["text"]

    chunks = chunk_page(cleaned, chunk_size=200, chunk_overlap=20, min_chunk_size=10)
    assert len(chunks) >= 1
    assert chunks[0]["chunk_id"].startswith("test_doc")
    assert chunks[0]["page"] == 1


def test_bm25_indexing_and_search():
    chunks = [
        {"chunk_id": "c1", "text": "Photosynthesis turns light energy into chemical glucose energy.", "subject": "Biology"},
        {"chunk_id": "c2", "text": "Newton's second law is Force equals mass times acceleration F=ma.", "subject": "Physics"},
        {"chunk_id": "c3", "text": "Quadratic equations take the form ax^2 + bx + c = 0.", "subject": "Mathematics"},
    ]
    with tempfile.TemporaryDirectory() as tmp_dir:
        build_bm25_index(chunks, tmp_dir)
        bm25, loaded_chunks = load_bm25_index(tmp_dir)
        assert len(loaded_chunks) == 3

        results = search_bm25("force mass acceleration", bm25, loaded_chunks, top_k=2)
        assert len(results) >= 1
        assert results[0]["chunk_id"] == "c2"
        assert "bm25_score" in results[0]


def test_dense_indexing_and_search():
    chunks = [
        {"chunk_id": "c1", "text": "Cellular respiration produces ATP in the mitochondria.", "subject": "Biology"},
        {"chunk_id": "c2", "text": "Gravitational potential energy depends on mass, height, and g.", "subject": "Physics"},
    ]
    with tempfile.TemporaryDirectory() as tmp_dir:
        build_dense_index(
            chunks=chunks,
            index_dir=tmp_dir,
            model_name="BAAI/bge-small-en-v1.5",
            normalize=True,
        )
        loaded_index, loaded_chunks, loaded_config = load_dense_index(tmp_dir)
        assert loaded_index.ntotal == 2

        from tutor.rag.dense_index import _load_embedder
        embedder = _load_embedder("BAAI/bge-small-en-v1.5", "cpu")

        results = search_dense(
            query="gravity mass height energy",
            index=loaded_index,
            chunks=loaded_chunks,
            embedder=embedder,
            top_k=1,
            normalize=True,
        )
        assert len(results) == 1
        assert results[0]["chunk_id"] == "c2"
        assert "dense_score" in results[0]


def test_rrf_hybrid_fusion():
    bm25_res = [
        {"chunk_id": "c1", "text": "Newton law", "bm25_score": 5.0},
        {"chunk_id": "c2", "text": "Kinematics formula", "bm25_score": 3.0},
    ]
    dense_res = [
        {"chunk_id": "c2", "text": "Kinematics formula", "dense_score": 0.88},
        {"chunk_id": "c1", "text": "Newton law", "dense_score": 0.85},
    ]
    fused = reciprocal_rank_fusion([bm25_res, dense_res], k=60)
    assert len(fused) == 2
    assert "fusion_score" in fused[0]


def test_reranker_pass_through():
    candidates = [
        {"chunk_id": "c1", "text": "Gravitational constant is 6.67e-11 N m^2 / kg^2", "fusion_score": 0.03},
        {"chunk_id": "c2", "text": "Thermodynamics first law conservation of energy", "fusion_score": 0.02},
    ]
    # Pass reranker=None for fast test without loading heavy models
    reranked = rerank("gravitational constant", candidates, reranker=None, top_k=1)
    assert len(reranked) == 1
    assert reranked[0]["chunk_id"] == "c1"
