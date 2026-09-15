"""Conservative Text Cleaner for extracted PDF pages.

Handles:
- Repeated whitespace and blank lines
- Broken line wrapping (heuristic re-joining)
- Page-number artifacts (isolated digit lines)
- Repeated headers/footers (detected by frequency across pages)
- Obvious OCR noise patterns

Does NOT:
- Summarize or rewrite text
- Use an LLM
- Aggressively strip educational content
"""

import logging
import re
from collections import Counter
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Lines shorter than this and matching artifact patterns are candidates for removal
_SHORT_LINE_THRESHOLD = 15


def _is_page_number_line(line: str) -> bool:
    """True if a line is just a page number (e.g. '42', '- 42 -', 'Page 42')."""
    stripped = line.strip()
    return bool(re.fullmatch(r"[-–—]?\s*\d{1,4}\s*[-–—]?", stripped)) or \
           bool(re.fullmatch(r"[Pp]age\s+\d{1,4}", stripped))


def _normalize_whitespace(text: str) -> str:
    """Collapses multiple spaces to one; strips trailing spaces per line."""
    lines = text.splitlines()
    lines = [re.sub(r"[ \t]+", " ", line).rstrip() for line in lines]
    return "\n".join(lines)


def _remove_excessive_blank_lines(text: str, max_consecutive: int = 2) -> str:
    """Reduces runs of blank lines to at most max_consecutive."""
    result = re.sub(r"\n{%d,}" % (max_consecutive + 1), "\n" * max_consecutive, text)
    return result


def _rejoin_broken_lines(text: str) -> str:
    """Re-joins lines that appear to be mid-sentence breaks from PDF layout.

    Heuristic: if a line does not end with a sentence-terminator and the
    next line starts with a lowercase letter, join them.
    """
    lines = text.splitlines()
    joined = []
    i = 0
    while i < len(lines):
        current = lines[i].strip()
        if not current:
            joined.append("")
            i += 1
            continue

        # Look ahead
        if i + 1 < len(lines):
            nxt = lines[i + 1].strip()
            # Join if: current doesn't end sentence & next starts lowercase
            ends_incomplete = current and current[-1] not in ".!?:;\"'"
            next_starts_lower = nxt and nxt[0].islower()
            if ends_incomplete and next_starts_lower and len(current) > 20:
                current = current + " " + nxt
                i += 2
                joined.append(current)
                continue

        joined.append(current)
        i += 1

    return "\n".join(joined)


def _remove_page_number_artifacts(text: str) -> str:
    """Removes lines that are solely page-number artifacts."""
    lines = text.splitlines()
    filtered = [line for line in lines if not _is_page_number_line(line)]
    return "\n".join(filtered)


def detect_repeated_lines(
    pages: List[Dict[str, Any]],
    min_freq_ratio: float = 0.4,
    min_pages: int = 5,
) -> List[str]:
    """Detects lines that appear frequently across pages (likely headers/footers).

    Only runs header/footer detection when there are enough pages (min_pages)
    to make frequency analysis meaningful.

    Args:
        pages: List of page records with 'text' field.
        min_freq_ratio: Fraction of pages a line must appear on to be flagged.
        min_pages: Minimum number of pages required to attempt detection.

    Returns:
        Set of line strings likely to be headers/footers.
    """
    if len(pages) < min_pages:
        return []

    line_counts: Counter = Counter()
    for page in pages:
        text = page.get("text", "")
        seen_this_page = set()
        for line in text.splitlines():
            stripped = line.strip()
            if stripped and len(stripped) > 3 and stripped not in seen_this_page:
                line_counts[stripped] += 1
                seen_this_page.add(stripped)

    threshold = max(3, int(len(pages) * min_freq_ratio))
    repeated = [line for line, count in line_counts.items() if count >= threshold]
    if repeated:
        logger.info(
            "Detected %d likely header/footer lines (threshold=%d/%d pages)",
            len(repeated), threshold, len(pages),
        )
    return repeated


def clean_page_text(
    text: str,
    repeated_lines: Optional[List[str]] = None,
) -> str:
    """Applies conservative cleaning to a single page's extracted text.

    Args:
        text: Raw text from pdfplumber.
        repeated_lines: Lines detected as likely headers/footers to remove.

    Returns:
        Cleaned text string.
    """
    if not text or not text.strip():
        return ""

    # 1. Remove page-number-only lines
    text = _remove_page_number_artifacts(text)

    # 2. Remove detected repeated header/footer lines
    if repeated_lines:
        lines = text.splitlines()
        filtered = [ln for ln in lines if ln.strip() not in set(repeated_lines)]
        text = "\n".join(filtered)

    # 3. Normalize whitespace
    text = _normalize_whitespace(text)

    # 4. Re-join broken wrapped lines (heuristic)
    text = _rejoin_broken_lines(text)

    # 5. Collapse excessive blank lines
    text = _remove_excessive_blank_lines(text, max_consecutive=2)

    return text.strip()


def clean_page(
    page_record: Dict[str, Any],
    detect_headers_footers: bool = False,
) -> Dict[str, Any]:
    """Cleans a single page record dict and returns a new page dict."""
    new_page = dict(page_record)
    new_page["text"] = clean_page_text(page_record.get("text", ""))
    return new_page



def clean_pages(
    pages: List[Dict[str, Any]],
    detect_headers_footers: bool = True,
) -> List[Dict[str, Any]]:
    """Applies cleaning to all pages in a document, with header/footer detection.

    Args:
        pages: List of page records (from pdf_extractor).
        detect_headers_footers: Whether to detect and remove repeated lines.

    Returns:
        Pages with 'text' replaced by cleaned version.
        Original page records are not mutated.
    """
    repeated_lines: List[str] = []
    if detect_headers_footers:
        repeated_lines = detect_repeated_lines(pages)

    cleaned = []
    for page in pages:
        new_page = dict(page)
        new_page["text"] = clean_page_text(
            page.get("text", ""),
            repeated_lines=repeated_lines,
        )
        cleaned.append(new_page)

    non_empty = sum(1 for p in cleaned if p["text"])
    logger.debug("Cleaned %d pages (%d non-empty)", len(cleaned), non_empty)
    return cleaned
