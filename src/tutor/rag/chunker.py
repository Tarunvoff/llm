"""Text Chunker with structure-aware splitting.

Prefers natural document boundaries (paragraphs, sections) over
hard character limits. Falls back to size-based splitting when needed.

Every chunk preserves full provenance:
  document_id → source → page → chunk_id → text
"""

import hashlib
import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def _generate_chunk_id(document_id: str, page: int, chunk_index: int) -> str:
    """Generates a stable, unique chunk ID."""
    raw = f"{document_id}::p{page:04d}::c{chunk_index:05d}"
    short_hash = hashlib.md5(raw.encode()).hexdigest()[:8]
    return f"{document_id}__p{page:04d}__c{chunk_index:05d}__{short_hash}"


def _split_into_paragraphs(text: str) -> List[str]:
    """Splits text on paragraph boundaries (two+ newlines or clear breaks)."""
    # Split on 2+ newlines or section-like separators
    paragraphs = re.split(r"\n{2,}", text)
    return [p.strip() for p in paragraphs if p.strip()]


def chunk_text(text: str, chunk_size: int = 800, chunk_overlap: int = 120) -> List[str]:
    """Splits raw text string into a list of chunk strings (for testing/utility)."""
    page_rec = {
        "document_id": "doc_temp",
        "source": "temp",
        "page": 1,
        "text": text,
    }
    records = chunk_page(page_rec, chunk_size=chunk_size, chunk_overlap=chunk_overlap, min_chunk_size=1)
    return [r["text"] for r in records]



def _split_by_size(
    text: str,
    chunk_size: int,
    chunk_overlap: int,
) -> List[str]:
    """Splits text by character count with overlap, respecting word boundaries."""
    if not text:
        return []

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size

        if end >= text_len:
            chunk = text[start:].strip()
            if chunk:
                chunks.append(chunk)
            break

        # Walk back to nearest word boundary
        boundary = end
        while boundary > start and text[boundary] not in " \n\t":
            boundary -= 1

        if boundary == start:
            boundary = end  # No word boundary found — hard cut

        chunk = text[start:boundary].strip()
        if chunk:
            chunks.append(chunk)

        # Advance with overlap
        advance = max(1, boundary - chunk_overlap)
        start = start + advance

    return chunks


def chunk_page(
    page_record: Dict[str, Any],
    chunk_size: int = 800,
    chunk_overlap: int = 120,
    min_chunk_size: int = 100,
    chunk_counter_start: int = 0,
) -> List[Dict[str, Any]]:
    """Produces chunks from a single page record.

    Strategy:
    1. Split by paragraphs first (structure-aware).
    2. For large paragraphs, apply size-based splitting.
    3. Merge tiny fragments with the previous chunk.

    Args:
        page_record: A page dict from pdf_extractor with text + provenance.
        chunk_size: Target maximum characters per chunk.
        chunk_overlap: Character overlap between consecutive size-based chunks.
        min_chunk_size: Discard chunks smaller than this (after stripping).
        chunk_counter_start: Starting index for chunk ID generation.

    Returns:
        List of chunk dicts preserving full provenance.
    """
    text = page_record.get("text", "").strip()
    document_id = page_record["document_id"]
    source = page_record["source"]
    page_num = page_record["page"]
    metadata = page_record.get("metadata", {})

    if not text:
        return []

    # Step 1: Paragraph-level split
    paragraphs = _split_into_paragraphs(text)

    raw_chunks: List[str] = []
    for para in paragraphs:
        if len(para) <= chunk_size:
            raw_chunks.append(para)
        else:
            # Step 2: Size-based split for large paragraphs
            sub_chunks = _split_by_size(para, chunk_size, chunk_overlap)
            raw_chunks.extend(sub_chunks)

    # Step 3: Merge tiny trailing fragments with previous chunk
    merged: List[str] = []
    for raw in raw_chunks:
        raw = raw.strip()
        if not raw:
            continue
        if len(raw) < min_chunk_size and merged:
            merged[-1] = merged[-1] + " " + raw
        else:
            merged.append(raw)

    # Step 4: Build chunk records
    chunk_records = []
    for idx, chunk_text in enumerate(merged):
        if not chunk_text.strip():
            continue
        if len(chunk_text.strip()) < min_chunk_size:
            logger.debug("Discarding short chunk (%d chars) from page %d", len(chunk_text), page_num)
            continue

        chunk_id = _generate_chunk_id(document_id, page_num, chunk_counter_start + idx)
        chunk_records.append({
            "chunk_id": chunk_id,
            "document_id": document_id,
            "source": source,
            "page": page_num,
            "chunk_index": chunk_counter_start + idx,
            "text": chunk_text.strip(),
            "char_count": len(chunk_text.strip()),
            "metadata": {
                **metadata,
                "content_type": "text",
                "filename": source.split("/")[-1].split("\\")[-1],
            },
        })

    return chunk_records


def chunk_pages(
    pages: List[Dict[str, Any]],
    chunk_size: int = 800,
    chunk_overlap: int = 120,
    min_chunk_size: int = 100,
) -> List[Dict[str, Any]]:
    """Converts all page records into chunks.

    Chunk IDs are globally unique across all pages.

    Args:
        pages: List of page records from pdf_extractor (after cleaning).
        chunk_size: Target characters per chunk.
        chunk_overlap: Overlap between size-split chunks.
        min_chunk_size: Minimum viable chunk character count.

    Returns:
        List of chunk dicts, globally ordered.
    """
    all_chunks: List[Dict[str, Any]] = []
    global_counter = 0

    for page in pages:
        chunks = chunk_page(
            page_record=page,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            min_chunk_size=min_chunk_size,
            chunk_counter_start=global_counter,
        )
        all_chunks.extend(chunks)
        global_counter += len(chunks)

    # Verify uniqueness
    ids = [c["chunk_id"] for c in all_chunks]
    if len(ids) != len(set(ids)):
        logger.warning("Duplicate chunk IDs detected — check chunking logic.")

    logger.info(
        "Chunking complete: %d chunks from %d pages",
        len(all_chunks), len(pages),
    )
    return all_chunks
