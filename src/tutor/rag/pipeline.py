"""End-to-End RAG Pipeline Orchestrator.

Public interface:
    rag = RAGPipeline(config_path="configs/rag.yaml")
    rag.build()   # extract → clean → chunk → index
    results = rag.retrieve("What is Newton's second law?", top_k=5)

This file supersedes the previous stub pipeline.py.
All parameters come from configs/rag.yaml — nothing is hard-coded.
"""

import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from tutor.rag.bm25_index import (
    build_bm25_index,
    load_bm25_index,
    search_bm25,
)
from tutor.rag.chunker import chunk_pages, chunk_text
from tutor.rag.cleaner import clean_pages
from tutor.rag.dense_index import (
    build_dense_index,
    load_dense_index,
    search_dense,
)
from tutor.rag.pdf_extractor import discover_pdfs, extract_all_pdfs
from tutor.rag.pixelrag_pipeline import (
    build_visual_index,
    load_visual_index,
    search_visual,
)
from tutor.rag.reranker import load_reranker, rerank
from tutor.rag.retriever import hybrid_retrieve

logger = logging.getLogger(__name__)


def _load_config(config_path: str) -> Dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _save_jsonl(records: List[Dict[str, Any]], path: str) -> None:
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")


def _load_jsonl(path: str) -> List[Dict[str, Any]]:
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


class RAGPipeline:
    """Production-style hybrid RAG pipeline.

    Separates build (indexing) from retrieve (query-time) operations.
    All state is persisted to disk — no re-indexing on each query.
    """

    def __init__(self, config_path: str = "configs/rag.yaml"):
        self.config_path = config_path
        self.cfg = _load_config(config_path)

        self.pdf_dir = self.cfg["paths"]["pdf_dir"]
        self.processed_dir = self.cfg["paths"]["processed_dir"]
        self.index_dir = self.cfg["paths"]["index_dir"]

        self.bm25_index_dir = os.path.join(self.index_dir, "bm25")
        self.dense_index_dir = os.path.join(self.index_dir, "dense")
        self.visual_index_dir = os.path.join(self.index_dir, "pixelrag")

        # Runtime state (loaded on first retrieve or after build)
        self._bm25 = None
        self._bm25_chunks: List[Dict[str, Any]] = []
        self._dense_index = None
        self._dense_chunks: List[Dict[str, Any]] = []
        self._dense_config: Dict[str, Any] = {}
        self._embedder = None
        self._visual_loaded = None  # (faiss_index, tiles, clip_model) or None
        self._reranker = None

        self._indexes_built = False

    def build(self) -> Dict[str, Any]:
        """Executes the full build pipeline:
            1. Discover PDFs
            2. Extract pages (pdfplumber)
            3. Clean text
            4. Chunk
            5. Save JSONL
            6. Build BM25 index
            7. Build dense (FAISS + embedding) index
            8. Build PixelRAG visual index
            9. Save build manifest

        Returns:
            Build statistics dict.
        """
        t_start = time.time()
        cfg = self.cfg
        chunk_cfg = cfg.get("chunking", {})
        embed_cfg = cfg.get("embedding", {})
        pixelrag_cfg = cfg.get("pixelrag", {})

        # ── Step 1: Discover PDFs ─────────────────────────────────────────────
        pdf_paths = discover_pdfs(self.pdf_dir)
        if not pdf_paths:
            raise FileNotFoundError(f"ERROR: No PDF files found in {self.pdf_dir}")
        print(f"\nFound {len(pdf_paths)} PDF files")

        # ── Step 2: Extract pages ─────────────────────────────────────────────
        print("\nExtracting PDFs...")
        all_pages: List[Dict[str, Any]] = []
        for i, pdf_path in enumerate(pdf_paths, 1):
            from tutor.rag.pdf_extractor import extract_pdf
            pages = extract_pdf(pdf_path, pdf_dir=self.pdf_dir)
            all_pages.extend(pages)
            print(f"  [{i}/{len(pdf_paths)}] {os.path.basename(pdf_path)} — {len(pages)} pages")

        print(f"\nPages extracted: {len(all_pages):,}")

        # ── Step 3: Clean ─────────────────────────────────────────────────────
        print("\nCleaning text...")
        cleaned_pages = clean_pages(all_pages, detect_headers_footers=True)
        non_empty = sum(1 for p in cleaned_pages if p.get("text", "").strip())
        print(f"  Non-empty pages after cleaning: {non_empty:,}")

        # ── Step 4: Chunk ─────────────────────────────────────────────────────
        print("\nChunking...")
        chunks = chunk_pages(
            pages=cleaned_pages,
            chunk_size=chunk_cfg.get("chunk_size", 800),
            chunk_overlap=chunk_cfg.get("chunk_overlap", 120),
            min_chunk_size=chunk_cfg.get("min_chunk_size", 100),
        )
        print(f"Chunks created: {len(chunks):,}")

        # ── Step 5: Save JSONL ────────────────────────────────────────────────
        pages_path = os.path.join(self.processed_dir, "pages.jsonl")
        chunks_path = os.path.join(self.processed_dir, "chunks.jsonl")
        _save_jsonl(cleaned_pages, pages_path)
        _save_jsonl(chunks, chunks_path)
        print(f"\nSaved pages → {pages_path}")
        print(f"Saved chunks → {chunks_path}")

        # ── Step 6: BM25 Index ────────────────────────────────────────────────
        print("\nBuilding BM25 index...")
        build_bm25_index(chunks, self.bm25_index_dir)
        print("BM25 index done.")

        # ── Step 7: Dense Index ───────────────────────────────────────────────
        print("\nBuilding dense embedding index...")
        build_dense_index(
            chunks=chunks,
            index_dir=self.dense_index_dir,
            model_name=embed_cfg.get("model_name", "BAAI/bge-small-en-v1.5"),
            device=embed_cfg.get("device", "auto"),
            batch_size=embed_cfg.get("batch_size", 64),
            normalize=embed_cfg.get("normalize", True),
        )
        print("Dense index done.")

        # ── Step 8: PixelRAG Visual Index ─────────────────────────────────────
        visual_stats = None
        if pixelrag_cfg.get("enabled", True):
            print("\nBuilding PixelRAG visual index...")
            visual_stats = build_visual_index(
                pdf_paths=pdf_paths,
                index_dir=self.visual_index_dir,
                dpi=150,
            )
            if visual_stats:
                print(f"Visual index done ({visual_stats.get('num_tiles', 0)} tiles).")
            else:
                print("WARNING: PixelRAG visual index could not be built. Text RAG continues.")
        else:
            print("\nPixelRAG disabled in config — skipping visual index.")

        # ── Step 9: Build Manifest ────────────────────────────────────────────
        elapsed = time.time() - t_start
        manifest = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "config": self.config_path,
            "embedding_model": embed_cfg.get("model_name", "BAAI/bge-small-en-v1.5"),
            "reranker_model": cfg.get("reranker", {}).get("model_name", "BAAI/bge-reranker-base"),
            "num_pdfs": len(pdf_paths),
            "num_pages": len(all_pages),
            "num_pages_non_empty": non_empty,
            "num_chunks": len(chunks),
            "visual_tiles": visual_stats.get("num_tiles", 0) if visual_stats else 0,
            "pixelrag_status": "built" if visual_stats else "unavailable",
            "build_time_seconds": round(elapsed, 1),
            "pdf_dir": self.pdf_dir,
        }
        manifest_path = os.path.join(self.processed_dir, "build_manifest.json")
        os.makedirs(self.processed_dir, exist_ok=True)
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        print(f"\n{'='*50}")
        print(f"RAG build completed in {elapsed:.1f}s")
        print(f"  PDFs:   {len(pdf_paths)}")
        print(f"  Pages:  {len(all_pages):,}")
        print(f"  Chunks: {len(chunks):,}")
        print(f"  Visual: {manifest['visual_tiles']} tiles")
        print(f"  Manifest: {manifest_path}")
        print(f"{'='*50}\n")

        self._indexes_built = True
        return manifest

    def _load_indexes(self):
        """Loads all built indexes into memory (lazy, called on first retrieve)."""
        logger.info("Loading RAG indexes...")

        self._bm25, self._bm25_chunks = load_bm25_index(self.bm25_index_dir)

        self._dense_index, self._dense_chunks, self._dense_config = load_dense_index(
            self.dense_index_dir
        )

        # Load embedding model for query time
        from sentence_transformers import SentenceTransformer
        embed_cfg = self.cfg.get("embedding", {})
        model_name = self._dense_config.get(
            "model_name", embed_cfg.get("model_name", "BAAI/bge-small-en-v1.5")
        )
        device = embed_cfg.get("device", "auto")
        if device == "auto":
            try:
                import torch
                device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                device = "cpu"
        self._embedder = SentenceTransformer(model_name, device=device)

        # Visual index (optional)
        pixelrag_cfg = self.cfg.get("pixelrag", {})
        if pixelrag_cfg.get("enabled", True):
            self._visual_loaded = load_visual_index(self.visual_index_dir)
        else:
            self._visual_loaded = None

        # Reranker
        reranker_cfg = self.cfg.get("reranker", {})
        self._reranker = load_reranker(
            model_name=reranker_cfg.get("model_name", "BAAI/bge-reranker-base"),
            device=reranker_cfg.get("device", "auto"),
        )

        self._indexes_built = True
        logger.info("All RAG indexes loaded.")

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        subject_filter: Optional[str] = None,
        grade_filter: Optional[int] = None,
        **kwargs,
    ) -> List[Dict[str, Any]]:
        """Executes full hybrid retrieval for a query.

        Steps:
            1. BM25 retrieval
            2. Dense vector retrieval (FAISS)
            3. PixelRAG visual retrieval (if enabled)
            4. Hybrid Reciprocal Rank Fusion (RRF)
            5. Cross-Encoder reranking
            6. Metadata filtering (subject/grade if requested)

        Args:
            query: The student's question or search query.
            top_k: Override the config's reranker top_k.
            subject_filter: Optional subject string to filter results.
            grade_filter: Optional grade integer to filter results.

        Returns:
            List of result dicts with full provenance and scores.
        """
        if not self._indexes_built or self._bm25 is None:
            self._load_indexes()

        ret_cfg = self.cfg.get("retrieval", {})
        reranker_cfg = self.cfg.get("reranker", {})

        bm25_k = ret_cfg.get("bm25_top_k", 20)
        dense_k = ret_cfg.get("dense_top_k", 20)
        visual_k = ret_cfg.get("visual_top_k", 10)
        fusion = ret_cfg.get("fusion", "rrf")
        rrf_k = ret_cfg.get("rrf_k", 60)
        final_cands = ret_cfg.get("final_candidates", 30)
        final_top_k = top_k or reranker_cfg.get("top_k", 5)

        normalize = self._dense_config.get("normalize", True)

        # ── BM25 ──────────────────────────────────────────────────────────────
        bm25_results = search_bm25(query, self._bm25, self._bm25_chunks, top_k=bm25_k)

        # ── Dense ─────────────────────────────────────────────────────────────
        dense_results = search_dense(
            query, self._dense_index, self._dense_chunks, self._embedder,
            top_k=dense_k, normalize=normalize,
        )

        # ── Visual (PixelRAG) ─────────────────────────────────────────────────
        visual_results: List[Dict[str, Any]] = []
        if self._visual_loaded is not None:
            visual_index, tiles, clip_model = self._visual_loaded
            visual_results = search_visual(query, visual_index, tiles, clip_model, top_k=visual_k)

        # ── Hybrid Fusion (RRF) ───────────────────────────────────────────────
        fused = hybrid_retrieve(
            query=query,
            bm25_results=bm25_results,
            dense_results=dense_results,
            visual_results=visual_results if visual_results else None,
            fusion=fusion,
            rrf_k=rrf_k,
            final_candidates=final_cands,
        )

        # ── Cross-Encoder Reranking ───────────────────────────────────────────
        results = rerank(
            query=query,
            candidates=fused,
            reranker=self._reranker,
            top_k=final_top_k,
        )

        # ── Optional Metadata Filtering ─────────────────────────────────────
        if subject_filter:
            results = [r for r in results if r.get("subject", "").lower() == subject_filter.lower()]
        if grade_filter is not None:
            results = [r for r in results if r.get("grade") == grade_filter]

        return results


class CurriculumRAG:
    """Legacy interface wrapper for in-memory document testing & backward compatibility."""

    def __init__(self, config_path: str = "configs/rag.yaml"):
        self.pipeline = RAGPipeline(config_path=config_path)
        self.chunks: List[Dict[str, Any]] = []

    def load_documents_and_index(
        self,
        docs: List[Dict[str, Any]],
        chunk_size: int = 800,
        chunk_overlap: int = 120,
    ) -> None:
        from tutor.rag.chunker import chunk_text
        from tutor.rag.retriever import RetrievedChunk

        self.chunks = []
        for doc in docs:
            content = doc.get("content", doc.get("text", ""))
            text_chunks = chunk_text(content, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
            for i, chunk_str in enumerate(text_chunks):
                chunk_rec = {
                    "chunk_id": f"{doc.get('subject', 'doc')}_{i}",
                    "text": chunk_str,
                    "subject": doc.get("subject", ""),
                    "grade": doc.get("grade"),
                    "chapter": doc.get("chapter", ""),
                    "topic": doc.get("topic", ""),
                    "source": doc.get("source", ""),
                }
                self.chunks.append(chunk_rec)

    def save_index(self, index_dir: str) -> None:
        os.makedirs(index_dir, exist_ok=True)
        chunks_path = os.path.join(index_dir, "chunks.json")
        with open(chunks_path, "w", encoding="utf-8") as f:
            json.dump(self.chunks, f, ensure_ascii=False)

    def load_index(self, index_dir: str) -> None:
        chunks_path = os.path.join(index_dir, "chunks.json")
        if os.path.exists(chunks_path):
            with open(chunks_path, "r", encoding="utf-8") as f:
                self.chunks = json.load(f)

    def query(
        self,
        query_text: str,
        top_k: int = 5,
        subject_filter: Optional[str] = None,
        grade_filter: Optional[int] = None,
        **kwargs,
    ) -> List[Any]:
        from tutor.rag.retriever import RetrievedChunk

        query_words = set(query_text.lower().split())
        scored = []
        for chunk in self.chunks:
            if subject_filter and chunk.get("subject") and chunk.get("subject").lower() != subject_filter.lower():
                continue
            if grade_filter is not None and chunk.get("grade") is not None and chunk.get("grade") != grade_filter:
                continue
            chunk_words = set(chunk["text"].lower().split())
            score = len(query_words.intersection(chunk_words))
            scored.append((score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, chunk in scored[:top_k]:
            rec = dict(chunk)
            rec["rerank_score"] = float(score)
            results.append(RetrievedChunk.from_dict(rec))
        return results

