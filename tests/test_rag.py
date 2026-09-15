"""Unit tests for Curriculum RAG pipeline, chunking, and hybrid retrieval."""

import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from tutor.rag.pipeline import chunk_text, CurriculumRAG
from tutor.rag.retriever import RetrievedChunk


def test_chunk_text():
    text = "Word " * 1000
    chunks = chunk_text(text, chunk_size=200, chunk_overlap=50)
    assert len(chunks) > 1
    assert all(len(c.split()) <= 200 for c in chunks)


def test_rag_indexing_and_hybrid_retrieval():
    docs = [
        {
            "content": "Newton's second law of motion states that force is equal to the rate of change of momentum: F = ma.",
            "subject": "Physics",
            "grade": 9,
            "chapter": "Laws of Motion",
            "topic": "Newton's Second Law",
            "source": "NCERT Physics",
        },
        {
            "content": "Quadratic equations can be solved using the quadratic formula: x = (-b +- sqrt(b^2 - 4ac)) / (2a).",
            "subject": "Mathematics",
            "grade": 10,
            "chapter": "Quadratic Equations",
            "topic": "Formula Method",
            "source": "NCERT Math",
        },
        {
            "content": "Photosynthesis occurs in chloroplasts where chlorophyll pigments absorb light energy to synthesize glucose from CO2 and water.",
            "subject": "Biology",
            "grade": 10,
            "chapter": "Life Processes",
            "topic": "Photosynthesis",
            "source": "NCERT Biology",
        },
    ]

    rag = CurriculumRAG()
    rag.load_documents_and_index(docs, chunk_size=100, chunk_overlap=20)

    # Query physics
    results_phys = rag.query("What is the formula for force and mass acceleration?", top_k=1)
    assert len(results_phys) == 1
    assert "Newton" in results_phys[0].text or "force" in results_phys[0].text
    assert results_phys[0].subject == "Physics"

    # Query math
    results_math = rag.query("quadratic formula square root discriminant", top_k=1)
    assert len(results_math) == 1
    assert "Quadratic" in results_math[0].text


def test_rag_save_and_load_index():
    docs = [
        {
            "content": "An acid is a substance that produces hydrogen ions H+ in aqueous solution.",
            "subject": "Chemistry",
            "grade": 10,
            "chapter": "Acids, Bases and Salts",
            "topic": "Acid Definition",
            "source": "NCERT Chemistry",
        }
    ]

    rag = CurriculumRAG()
    rag.load_documents_and_index(docs)

    with tempfile.TemporaryDirectory() as tmp_dir:
        rag.save_index(tmp_dir)
        assert os.path.exists(os.path.join(tmp_dir, "chunks.json"))

        loaded_rag = CurriculumRAG()
        loaded_rag.load_index(tmp_dir)
        results = loaded_rag.query("hydrogen ions H+ solution", top_k=1)
        assert len(results) == 1
        assert "hydrogen ions" in results[0].text
