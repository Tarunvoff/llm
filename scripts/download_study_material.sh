#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# CONFIGURATION
# ============================================================

# Target download directory can be supplied as:
# 1. First argument:  ./scripts/download_study_material.sh /custom/path
# 2. Environment variable: STUDY_MATERIAL_DIR=/custom/path
# 3. Default: ${HOME}/NEET_JEE_STUDY_MATERIAL
TARGET_DIR="${1:-${STUDY_MATERIAL_DIR:-${HOME}/NEET_JEE_STUDY_MATERIAL}}"

# Resolve absolute path
mkdir -p "$TARGET_DIR"
BASE_DIR="$(cd "$TARGET_DIR" && pwd)"

REPO_DIR="${BASE_DIR}/_repositories"
PDF_DIR="${BASE_DIR}/PDF_LIBRARY"
ARCHIVE_DIR="${BASE_DIR}/_archives"
LOG_DIR="${BASE_DIR}/_DOWNLOAD_LOGS"

mkdir -p "$REPO_DIR" "$PDF_DIR" "$ARCHIVE_DIR" "$LOG_DIR"

LOG_FILE="${LOG_DIR}/download.log"
ERROR_LOG="${LOG_DIR}/errors.log"

touch "$LOG_FILE" "$ERROR_LOG"

# ============================================================
# REPOSITORIES (Categorized & Labeled)
# ============================================================

declare -A REPOS

REPOS["01_NEET_Physics"]="https://github.com/manjunath5496/30-Years-NEET-AIPMT-Chapterwise-Paper-and-Solution-Physics.git"
REPOS["01_NEET_Biology"]="https://github.com/manjunath5496/30-Years-NEET-AIPMT-Chapterwise-Paper-and-Solution-Biology.git"
REPOS["02_JEE_Chemistry"]="https://github.com/manjunath5496/IIT-JEE-Chemistry-Books.git"
REPOS["03_Exam_Study_Material"]="https://github.com/manjunath5496/Exam-Study-Material.git"
REPOS["04_JEE_Motion_Modules"]="https://github.com/manjunath5496/Motion-Final-Revision-Modules-For-JEE.git"
REPOS["05_Class12_Study_Materials"]="https://github.com/yashitanamdeo/class12_study_materials.git"

# ============================================================
# FUNCTIONS
# ============================================================

timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

log() {
    echo "[$(timestamp)] $*" | tee -a "$LOG_FILE" >&2
}

error_log() {
    echo "[$(timestamp)] ERROR: $*" | tee -a "$ERROR_LOG" >&2
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================
# CHECK DEPENDENCIES & EXTRACTORS
# ============================================================

log "Checking dependencies..."

if ! command_exists git; then
    error_log "git is not installed."
    exit 1
fi

EXTRACTOR=""
if command_exists 7z; then
    EXTRACTOR="7z"
elif command_exists 7zz; then
    EXTRACTOR="7zz"
elif command_exists unrar; then
    EXTRACTOR="unrar"
elif command_exists unzip; then
    EXTRACTOR="unzip"
elif command_exists python3 || command_exists python; then
    EXTRACTOR="python"
fi

if [[ -z "$EXTRACTOR" ]]; then
    log "WARNING: No archive extractor found. Raw archives will be kept."
else
    log "Archive extractor available: ${EXTRACTOR}"
fi

# ============================================================
# CLONE / UPDATE REPOSITORIES WITH LFS SUPPORT
# ============================================================

clone_or_update() {
    local category="$1"
    local url="$2"
    local destination="$3"

    local repo_name
    repo_name="$(basename "$url" .git)"

    mkdir -p "$destination"

    if [[ -d "${destination}/.git" ]]; then
        log "Updating: ${repo_name} (${category})"
        if git -C "$destination" pull --ff-only >>"$LOG_FILE" 2>>"$ERROR_LOG"; then
            log "Updated: ${repo_name}"
        else
            error_log "Could not fast-forward update ${repo_name}. Continuing with existing files."
        fi
    else
        log "Cloning: ${repo_name} (${category})"
        if git clone --depth 1 "$url" "$destination" >>"$LOG_FILE" 2>>"$ERROR_LOG"; then
            log "Cloned: ${repo_name}"
        else
            error_log "Git clone failed for ${repo_name} (${url})."
            return 1
        fi
    fi

    # Attempt Git LFS pull if large files are tracked via LFS
    if command_exists git-lfs || git lfs version >/dev/null 2>&1; then
        log "Checking Git LFS for ${repo_name}..."
        git -C "$destination" lfs pull >>"$LOG_FILE" 2>>"$ERROR_LOG" || true
    fi

    return 0
}

# ============================================================
# COPY STUDY MATERIALS (PDFs, Docs, Ebooks)
# ============================================================

copy_materials() {
    local category="$1"
    local repo_path="$2"
    local destination="${PDF_DIR}/${category}"

    [[ -d "$repo_path" ]] || return 0

    mkdir -p "$destination"
    log "Collecting documents and PDFs from ${category}"

    find "$repo_path" \
        -type f \
        \( \
            -iname "*.pdf" \
            -o -iname "*.epub" \
            -o -iname "*.djvu" \
            -o -iname "*.docx" \
            -o -iname "*.doc" \
        \) \
        -not -path "*/.git/*" \
        -print0 |
    while IFS= read -r -d '' file; do
        relative="${file#$repo_path/}"
        target="${destination}/${relative}"

        mkdir -p "$(dirname "$target")"

        if [[ -f "$target" ]]; then
            if cmp -s "$file" "$target"; then
                log "Already exists: ${category}/${relative}"
            else
                ext="${file##*.}"
                base="$(basename "$target" ".${ext}")"
                dir="$(dirname "$target")"

                counter=1
                while [[ -f "${dir}/${base}_${counter}.${ext}" ]]; do
                    ((counter++))
                done

                cp "$file" "${dir}/${base}_${counter}.${ext}"
                log "Duplicate renamed: ${category}/${relative} -> ${base}_${counter}.${ext}"
            fi
        else
            cp "$file" "$target"
            log "Saved: ${category}/${relative}"
        fi
    done
}

# ============================================================
# COPY ARCHIVES
# ============================================================

copy_archives() {
    local category="$1"
    local repo_path="$2"
    local destination="${ARCHIVE_DIR}/${category}"

    [[ -d "$repo_path" ]] || return 0

    mkdir -p "$destination"

    find "$repo_path" \
        -type f \
        \( \
            -iname "*.rar" \
            -o -iname "*.zip" \
            -o -iname "*.7z" \
            -o -iname "*.tar" \
            -o -iname "*.tar.gz" \
            -o -iname "*.tgz" \
        \) \
        -not -path "*/.git/*" \
        -print0 |
    while IFS= read -r -d '' file; do
        relative="${file#$repo_path/}"
        target="${destination}/${relative}"

        mkdir -p "$(dirname "$target")"
        cp -n "$file" "$target" 2>/dev/null || true
        log "Archive collected: ${category}/${relative}"
    done
}

# ============================================================
# EXTRACT ARCHIVES
# ============================================================

extract_archives() {
    if [[ -z "$EXTRACTOR" ]]; then
        return 0
    fi

    log "Starting archive extraction..."

    find "$ARCHIVE_DIR" \
        -type f \
        \( \
            -iname "*.rar" \
            -o -iname "*.zip" \
            -o -iname "*.7z" \
            -o -iname "*.tar" \
            -o -iname "*.tar.gz" \
            -o -iname "*.tgz" \
        \) \
        -print0 |
    while IFS= read -r -d '' archive; do
        relative="${archive#$ARCHIVE_DIR/}"
        ext="${archive##*.}"

        output_dir="${PDF_DIR}/EXTRACTED/${relative%.*}"
        mkdir -p "$output_dir"

        log "Extracting archive: ${relative}"

        case "$EXTRACTOR" in
            7z|7zz)
                "$EXTRACTOR" x -y "-o${output_dir}" "$archive" >>"$LOG_FILE" 2>>"$ERROR_LOG" || error_log "Failed extraction: ${relative}"
                ;;
            unrar)
                if [[ "$ext" =~ ^(rar|RAR)$ ]]; then
                    unrar x -o+ "$archive" "$output_dir/" >>"$LOG_FILE" 2>>"$ERROR_LOG" || error_log "Failed unrar: ${relative}"
                fi
                ;;
            unzip)
                if [[ "$ext" =~ ^(zip|ZIP)$ ]]; then
                    unzip -o -q "$archive" -d "$output_dir" >>"$LOG_FILE" 2>>"$ERROR_LOG" || error_log "Failed unzip: ${relative}"
                fi
                ;;
            python)
                python3 -c "
import sys, zipfile, tarfile
archive = sys.argv[1]
out_dir = sys.argv[2]
try:
    if zipfile.is_zipfile(archive):
        with zipfile.ZipFile(archive, 'r') as z:
            z.extractall(out_dir)
    elif tarfile.is_tarfile(archive):
        with tarfile.open(archive, 'r:*') as t:
            t.extractall(out_dir)
except Exception as e:
    sys.exit(1)
" "$archive" "$output_dir" >>"$LOG_FILE" 2>>"$ERROR_LOG" || error_log "Failed extraction with Python: ${relative}"
                ;;
        esac
    done
}

# ============================================================
# COLLECT EXTRACTED DOCUMENTS
# ============================================================

collect_extracted_documents() {
    local extracted="${PDF_DIR}/EXTRACTED"
    [[ -d "$extracted" ]] || return 0

    log "Organizing extracted materials into library..."

    find "$extracted" \
        -type f \
        \( \
            -iname "*.pdf" \
            -o -iname "*.epub" \
            -o -iname "*.djvu" \
            -o -iname "*.docx" \
        \) \
        -print0 |
    while IFS= read -r -d '' file; do
        relative="${file#$extracted/}"
        target="${PDF_DIR}/${relative}"

        mkdir -p "$(dirname "$target")"
        if [[ ! -f "$target" ]]; then
            cp "$file" "$target"
            log "Extracted material saved: ${relative}"
        fi
    done
}

# ============================================================
# CREATE INVENTORY REPORT
# ============================================================

create_inventory() {
    local inventory="${BASE_DIR}/FILE_INVENTORY.txt"
    log "Generating comprehensive inventory report..."

    {
        echo "============================================================"
        echo "NEET / JEE STUDY MATERIAL INVENTORY"
        echo "Generated: $(date)"
        echo "Root Path: ${BASE_DIR}"
        echo "============================================================"
        echo
        echo "DOCUMENT COUNT (PDF / EPUB / DOCX):"
        find "$PDF_DIR" -type f \( -iname "*.pdf" -o -iname "*.epub" -o -iname "*.docx" \) 2>/dev/null | wc -l || echo 0
        echo
        echo "ARCHIVE COUNT:"
        find "$ARCHIVE_DIR" -type f 2>/dev/null | wc -l || echo 0
        echo
        echo "============================================================"
        echo "DOCUMENT LIBRARY"
        echo "============================================================"
        find "$PDF_DIR" -type f \( -iname "*.pdf" -o -iname "*.epub" -o -iname "*.docx" \) 2>/dev/null | sort || true
        echo
        echo "============================================================"
        echo "ARCHIVES"
        echo "============================================================"
        find "$ARCHIVE_DIR" -type f 2>/dev/null | sort || true

    } > "$inventory"

    log "Inventory created at: ${inventory}"
}

# ============================================================
# SUMMARY
# ============================================================

summary() {
    local doc_count
    local archive_count

    doc_count="$(find "$PDF_DIR" -type f \( -iname "*.pdf" -o -iname "*.epub" -o -iname "*.docx" \) 2>/dev/null | wc -l || echo 0)"
    archive_count="$(find "$ARCHIVE_DIR" -type f 2>/dev/null | wc -l || echo 0)"

    echo
    echo "============================================================"
    echo "STUDY MATERIAL DOWNLOAD COMPLETED SUCCESSFULLY"
    echo "============================================================"
    echo
    echo "Destination Root Directory:"
    echo "  $BASE_DIR"
    echo
    echo "Document Library (PDFs, Books, Notes):"
    echo "  $PDF_DIR"
    echo "  Total Documents: $doc_count"
    echo
    echo "Archives Directory:"
    echo "  $ARCHIVE_DIR"
    echo "  Total Archives: $archive_count"
    echo
    echo "Logs Directory:"
    echo "  $LOG_FILE"
    echo "  $ERROR_LOG"
    echo
    echo "Inventory Report:"
    echo "  ${BASE_DIR}/FILE_INVENTORY.txt"
    echo
    echo "============================================================"
}

# ============================================================
# MAIN EXECUTION
# ============================================================

log "============================================================"
log "Starting NEET / JEE Study Material Downloader"
log "Target Destination: ${BASE_DIR}"
log "============================================================"

for category in "01_NEET_Physics" "01_NEET_Biology" "02_JEE_Chemistry" "03_Exam_Study_Material" "04_JEE_Motion_Modules" "05_Class12_Study_Materials"; do
    if [[ -z "${REPOS[$category]:-}" ]]; then
        continue
    fi

    url="${REPOS[$category]}"
    repo_name="$(basename "$url" .git)"
    repo_path="${REPO_DIR}/${category}_${repo_name}"

    log "------------------------------------------------------------"
    log "Processing category : ${category}"
    log "Repository URL      : ${url}"
    log "Target Folder       : ${repo_path}"

    if clone_or_update "$category" "$url" "$repo_path"; then
        copy_materials "$category" "$repo_path"
        copy_archives "$category" "$repo_path"
    else
        error_log "Failed processing ${category}. Skipping to next repository."
    fi
done

extract_archives
collect_extracted_documents
create_inventory
summary

log "All operations completed successfully."
