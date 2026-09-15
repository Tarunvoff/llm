"""PDF Text Extractor using pdfplumber.

Extracts text, tables, and page metadata from PDF files while preserving
full page-level provenance (source → page → text).

Rules:
- Never merge pages into a single string.
- Never hallucinate subject/grade/chapter metadata.
- Use only structural cues (directory name, PDF metadata) for metadata inference.
- Failures per PDF are logged and reported but do not stop the pipeline.
"""

import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional

import pdfplumber

logger = logging.getLogger(__name__)


def _infer_subject_from_path(pdf_path: str) -> Optional[str]:
    """Infers subject from parent directory name only. Returns None if ambiguous."""
    known_subjects = {
        "mathematics", "math", "maths",
        "physics",
        "chemistry",
        "biology",
        "science",
        "history",
        "geography",
        "english",
        "economics",
    }
    parts = Path(pdf_path).parts
    for part in reversed(parts[:-1]):  # skip filename itself
        clean = part.lower().strip()
        if clean in known_subjects:
            return clean.capitalize()
    return None


def _make_document_id(pdf_path: str, pdf_dir: str) -> str:
    """Creates a stable document ID from relative path."""
    try:
        rel = os.path.relpath(pdf_path, pdf_dir)
    except ValueError:
        rel = os.path.basename(pdf_path)
    # Replace path separators and extension with underscores
    doc_id = re.sub(r"[/\\. ]", "_", rel).lower()
    doc_id = re.sub(r"_pdf$", "", doc_id)
    return doc_id


def extract_page(
    page: Any,
    page_num: int,
    document_id: str,
    source: str,
    subject: Optional[str],
) -> Dict[str, Any]:
    """Extracts content from a single pdfplumber page object.

    Returns a page record preserving full provenance.
    Never raises — returns partial data on extraction failure.
    """
    text = ""
    tables = []
    width = height = None

    try:
        text = page.extract_text() or ""
        width = page.width
        height = page.height

        # Extract tables as list-of-lists for supplementary context
        raw_tables = page.extract_tables()
        if raw_tables:
            for tbl in raw_tables:
                # Flatten table rows to text string
                rows_text = []
                for row in tbl:
                    if row:
                        rows_text.append(" | ".join(str(c) if c else "" for c in row))
                tables.append("\n".join(rows_text))
    except Exception as exc:
        logger.warning("Page %d extraction error in %s: %s", page_num, source, exc)

    return {
        "document_id": document_id,
        "source": source,
        "page": page_num,
        "text": text.strip(),
        "tables": tables,
        "page_width": width,
        "page_height": height,
        "metadata": {
            "subject": subject,
            "grade": None,
            "chapter": None,
            "section": None,
        },
    }


def extract_pdf(
    pdf_path: str,
    pdf_dir: str = "",
) -> List[Dict[str, Any]]:
    """Extracts all pages from a single PDF file using pdfplumber.

    Args:
        pdf_path: Absolute or relative path to the PDF file.
        pdf_dir: Base directory used to compute relative source paths.

    Returns:
        List of page-level records. Empty list if PDF cannot be opened.
    """
    pdf_path = str(Path(pdf_path).resolve())
    source = pdf_path if not pdf_dir else os.path.relpath(pdf_path, pdf_dir)
    document_id = _make_document_id(pdf_path, pdf_dir or os.path.dirname(pdf_path))
    subject = _infer_subject_from_path(pdf_path)

    pages: List[Dict[str, Any]] = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            logger.info("Extracting %s — %d pages", os.path.basename(pdf_path), total_pages)

            for page_num, page in enumerate(pdf.pages, start=1):
                record = extract_page(
                    page=page,
                    page_num=page_num,
                    document_id=document_id,
                    source=source,
                    subject=subject,
                )
                pages.append(record)

    except Exception as exc:
        logger.error("Failed to open PDF %s: %s", pdf_path, exc)
        return []

    non_empty = sum(1 for p in pages if p["text"])
    logger.info(
        "%s: extracted %d pages (%d with text)",
        os.path.basename(pdf_path),
        len(pages),
        non_empty,
    )
    return pages


def discover_pdfs(pdf_dir: str) -> List[str]:
    """Recursively discovers all .pdf files under pdf_dir."""
    pdf_dir = str(Path(pdf_dir).resolve())
    if not os.path.isdir(pdf_dir):
        raise FileNotFoundError(f"PDF directory not found: {pdf_dir}")

    found = []
    for root, _, files in os.walk(pdf_dir):
        for fname in sorted(files):
            if fname.lower().endswith(".pdf"):
                found.append(os.path.join(root, fname))

    found.sort()
    return found


def extract_all_pdfs(
    pdf_dir: str,
) -> Iterator[Dict[str, Any]]:
    """Generator that yields page records from all PDFs in pdf_dir.

    Continues processing if individual PDFs fail.
    Logs a summary of failures at completion.

    Yields:
        Page-level dicts with full provenance.
    """
    pdf_paths = discover_pdfs(pdf_dir)
    if not pdf_paths:
        raise ValueError(f"ERROR: No PDF files found in {pdf_dir}")

    logger.info("Found %d PDF files in %s", len(pdf_paths), pdf_dir)

    failures = []
    total_pages = 0

    for pdf_path in pdf_paths:
        pages = extract_pdf(pdf_path, pdf_dir=pdf_dir)
        if not pages:
            failures.append(pdf_path)
            continue
        for record in pages:
            total_pages += 1
            yield record

    logger.info("Extraction complete: %d total pages from %d PDFs", total_pages, len(pdf_paths))
    if failures:
        logger.warning(
            "Extraction failures (%d PDFs): %s",
            len(failures),
            [os.path.basename(f) for f in failures],
        )
