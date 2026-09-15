"""PixelRAG Visual Pipeline — PDF page rendering and visual retrieval.

PixelRAG 0.4.0 Architecture:
- The core pixelrag[pdf] package provides PDF→tile rendering via PyMuPDF (pymupdf).
- The embed/index stages (pixelrag[embed], pixelrag[index]) require pixelrag-embed
  and pixelrag-index packages which are NOT available on PyPI as of this version.
- Therefore, this module implements the visual tile pipeline directly using PyMuPDF
  (the same library PixelRAG uses internally), while exposing a compatible result schema.

What this module provides:
1. PDF → page tile images (via PyMuPDF, consistent with PixelRAG's approach)
2. A CLIP-based visual embedding index for image retrieval
3. A result schema compatible with the hybrid retriever

Documented API deviation from spec:
- PixelRAG's Python-level embed/index API is not publicly available (CLI-only stages).
- Visual retrieval is implemented directly using PyMuPDF + CLIP embeddings via
  sentence-transformers' CLIP model.
- If PixelRAG publishes a Python API in future versions, replace this module.
"""

import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

_TILES_DIR = "tiles"
_VISUAL_META_FILE = "visual_chunks.json"
_VISUAL_INDEX_FILE = "visual_faiss.index"

_PIXELRAG_AVAILABLE = False
_CLIP_AVAILABLE = False


def _check_pymupdf() -> bool:
    try:
        import pymupdf
        return True
    except ImportError:
        return False


def _check_clip() -> bool:
    """Checks if sentence-transformers CLIP model can be used."""
    try:
        from sentence_transformers import SentenceTransformer
        return True
    except ImportError:
        return False


def render_pdf_to_tiles(
    pdf_path: str,
    output_dir: str,
    dpi: int = 150,
) -> List[Dict[str, Any]]:
    """Renders each page of a PDF to a PNG image tile using PyMuPDF.

    This replicates PixelRAG's page-tiling approach using the same underlying
    PyMuPDF library that PixelRAG uses for PDF processing.

    Args:
        pdf_path: Path to the PDF file.
        output_dir: Directory to save tile images.
        dpi: Resolution for rendering (150 DPI is sufficient for retrieval).

    Returns:
        List of tile records with source, page, and image_path.
    """
    if not _check_pymupdf():
        raise ImportError("pymupdf is required for visual tile rendering. pip install pymupdf")

    import pymupdf

    os.makedirs(output_dir, exist_ok=True)
    pdf_name = Path(pdf_path).stem

    tile_records = []
    try:
        doc = pymupdf.open(pdf_path)
        mat = pymupdf.Matrix(dpi / 72, dpi / 72)  # scale from 72dpi base

        for page_num in range(len(doc)):
            page = doc[page_num]
            pix = page.get_pixmap(matrix=mat)

            tile_filename = f"{pdf_name}__page{page_num + 1:04d}.png"
            tile_path = os.path.join(output_dir, tile_filename)
            pix.save(tile_path)

            tile_records.append({
                "source_pdf": pdf_path,
                "page": page_num + 1,
                "image_path": tile_path,
                "image_filename": tile_filename,
                "width_px": pix.width,
                "height_px": pix.height,
            })

        doc.close()
        logger.info("Rendered %d pages from %s", len(tile_records), os.path.basename(pdf_path))

    except Exception as exc:
        logger.error("Failed to render PDF tiles for %s: %s", pdf_path, exc)

    return tile_records


def build_visual_index(
    pdf_paths: List[str],
    index_dir: str,
    dpi: int = 150,
    model_name: str = "clip-ViT-B-32",
) -> Optional[Dict[str, Any]]:
    """Builds a visual tile index using CLIP embeddings via sentence-transformers.

    Note on PixelRAG API:
    PixelRAG 0.4.0's embed/index stages are not available via pip. This function
    provides equivalent functionality using sentence-transformers' CLIP model,
    which encodes images into the same CLIP embedding space.

    Args:
        pdf_paths: List of PDF file paths to index.
        index_dir: Directory to store tiles and index files.
        dpi: Tile render resolution.
        model_name: CLIP model identifier for sentence-transformers.

    Returns:
        Build statistics dict, or None on failure.
    """
    if not _check_pymupdf():
        logger.warning(
            "WARNING: PyMuPDF unavailable. Visual (PixelRAG) index cannot be built. "
            "Text RAG will continue normally."
        )
        return None

    if not _check_clip():
        logger.warning(
            "WARNING: sentence-transformers unavailable. Visual index skipped."
        )
        return None

    try:
        import numpy as np
        import faiss
        from sentence_transformers import SentenceTransformer
        from PIL import Image
    except ImportError as e:
        logger.warning("Visual index dependencies missing: %s. Skipping visual index.", e)
        return None

    tiles_dir = os.path.join(index_dir, _TILES_DIR)
    os.makedirs(tiles_dir, exist_ok=True)

    # Step 1: Render all PDFs to tiles
    all_tiles: List[Dict[str, Any]] = []
    for pdf_path in pdf_paths:
        pdf_tiles_dir = os.path.join(tiles_dir, Path(pdf_path).stem)
        tiles = render_pdf_to_tiles(pdf_path, pdf_tiles_dir, dpi=dpi)
        all_tiles.extend(tiles)

    if not all_tiles:
        logger.warning("No tiles rendered. Visual index not built.")
        return None

    logger.info("Rendered %d total tiles. Building CLIP visual index...", len(all_tiles))

    # Step 2: Load CLIP model and encode tiles
    try:
        t0 = time.time()
        clip_model = SentenceTransformer(model_name)
        logger.info("CLIP model loaded: %s", model_name)

        images = []
        valid_tiles = []
        for tile in all_tiles:
            try:
                img = Image.open(tile["image_path"]).convert("RGB")
                images.append(img)
                valid_tiles.append(tile)
            except Exception as e:
                logger.warning("Could not open tile %s: %s", tile["image_path"], e)

        if not images:
            logger.warning("No valid tile images to encode.")
            return None

        embeddings = clip_model.encode(
            images,
            batch_size=16,
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=True,
        ).astype(np.float32)

        logger.info("CLIP encoding complete in %.1fs — shape: %s", time.time() - t0, embeddings.shape)

        # Step 3: Build FAISS index
        dim = embeddings.shape[1]
        visual_index = faiss.IndexFlatIP(dim)
        visual_index.add(embeddings)

        # Step 4: Persist
        faiss_path = os.path.join(index_dir, _VISUAL_INDEX_FILE)
        faiss.write_index(visual_index, faiss_path)

        meta_path = os.path.join(index_dir, _VISUAL_META_FILE)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(valid_tiles, f, ensure_ascii=False, indent=2)

        stats = {
            "num_tiles": len(valid_tiles),
            "model": model_name,
            "dim": dim,
            "faiss_path": faiss_path,
        }
        logger.info(
            "Visual index built: %d tiles, model=%s, dim=%d",
            len(valid_tiles), model_name, dim,
        )
        return stats

    except Exception as exc:
        logger.error("Visual index build failed: %s", exc)
        return None


def load_visual_index(
    index_dir: str,
) -> Optional[Tuple[Any, List[Dict[str, Any]], Any]]:
    """Loads the visual FAISS index and tile metadata.

    Returns:
        (faiss_index, tiles, clip_model) or None if not built.
    """
    faiss_path = os.path.join(index_dir, _VISUAL_INDEX_FILE)
    meta_path = os.path.join(index_dir, _VISUAL_META_FILE)

    if not os.path.exists(faiss_path):
        logger.info(
            "WARNING: PixelRAG visual index not found at %s. "
            "Visual retrieval is disabled — text RAG continues normally.",
            faiss_path,
        )
        return None

    try:
        import faiss
        from sentence_transformers import SentenceTransformer

        index = faiss.read_index(faiss_path)
        with open(meta_path, "r", encoding="utf-8") as f:
            tiles = json.load(f)

        clip_model = SentenceTransformer("clip-ViT-B-32")
        logger.info("Visual index loaded: %d tiles", len(tiles))
        return index, tiles, clip_model

    except Exception as exc:
        logger.warning("Could not load visual index: %s. Visual retrieval disabled.", exc)
        return None


def search_visual(
    query: str,
    visual_index: Any,
    tiles: List[Dict[str, Any]],
    clip_model: Any,
    top_k: int = 10,
) -> List[Dict[str, Any]]:
    """Retrieves visually relevant page tiles for a text query using CLIP.

    CLIP encodes both text and images in the same embedding space,
    enabling text-to-image retrieval (i.e., "find the page that shows Newton's law").

    Args:
        query: Text query string.
        visual_index: Loaded FAISS index of tile embeddings.
        tiles: Tile metadata list.
        clip_model: Loaded CLIP SentenceTransformer model.
        top_k: Number of results.

    Returns:
        List of visual result dicts.
    """
    try:
        import numpy as np

        query_embedding = clip_model.encode(
            [query],
            normalize_embeddings=True,
            convert_to_numpy=True,
        ).astype(np.float32)

        scores, indices = visual_index.search(query_embedding, min(top_k, visual_index.ntotal))
        scores = scores[0]
        indices = indices[0]

        results = []
        for rank, (idx, score) in enumerate(zip(indices, scores)):
            if idx < 0:
                continue
            tile = tiles[idx]
            results.append({
                "chunk_id": f"visual__{tile['image_filename']}",
                "document_id": Path(tile["source_pdf"]).stem,
                "source": tile["source_pdf"],
                "page": tile["page"],
                "text": f"[Visual tile: {tile['image_filename']}]",
                "image_reference": tile["image_path"],
                "image_filename": tile["image_filename"],
                "content_type": "visual",
                "visual_score": float(score),
                "retrieval_rank": rank + 1,
                "metadata": {
                    "content_type": "visual",
                    "filename": os.path.basename(tile["source_pdf"]),
                },
            })

        logger.debug("Visual: %d results for query '%s'", len(results), query[:60])
        return results

    except Exception as exc:
        logger.warning("Visual search failed: %s", exc)
        return []
