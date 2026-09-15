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
# REPOSITORIES
# ============================================================

declare -A REPOS

REPOS["01_NEET/Physics"]="https://github.com/manjunath5496/30-Years-NEET-AIPMT-Chapterwise-Paper-and-Solution-Physics.git"

REPOS["01_NEET/Biology"]="https://github.com/manjunath5496/30-Years-NEET-AIPMT-Chapterwise-Paper-and-Solution-Biology.git"

REPOS["02_JEE/Chemistry"]="https://github.com/manjunath5496/IIT-JEE-Chemistry-Books.git"

REPOS["03_Exam_Study_Material"]="https://github.com/manjunath5496/Exam-Study-Material.git"

REPOS["04_Motion_Revision_Modules"]="https://github.com/manjunath5496/Motion-Final-Revision-Modules-For-JEE.git"

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
# CHECK DEPENDENCIES
# ============================================================

log "Checking dependencies..."

if ! command_exists git; then
    error_log "git is not installed."
    exit 1
fi

if ! command_exists rsync; then
    error_log "rsync is not installed."
    exit 1
fi

# Archive extraction is optional.
EXTRACTOR=""

if command_exists 7z; then
    EXTRACTOR="7z"
elif command_exists 7zz; then
    EXTRACTOR="7zz"
elif command_exists unrar; then
    EXTRACTOR="unrar"
fi

if [[ -z "$EXTRACTOR" ]]; then
    log "WARNING: No archive extractor found."
    log "RAR/ZIP/7Z archives will be downloaded but not automatically extracted."
    log "Install 7-Zip/unrar if you want archive extraction."
fi


# ============================================================
# CLONE / UPDATE REPOSITORIES
# ============================================================

clone_or_update() {

    local category="$1"
    local url="$2"
    local destination="$3"

    local repo_name
    repo_name="$(basename "$url" .git)"

    mkdir -p "$destination"

    if [[ -d "${destination}/.git" ]]; then

        log "Updating: ${repo_name}"

        if git -C "$destination" pull --ff-only >>"$LOG_FILE" 2>>"$ERROR_LOG"; then
            log "Updated: ${repo_name}"
        else
            error_log "Could not update ${repo_name}"
        fi

    else

        log "Cloning: ${repo_name}"

        if git clone --depth 1 "$url" "$destination" >>"$LOG_FILE" 2>>"$ERROR_LOG"; then
            log "Cloned: ${repo_name}"
        else
            error_log "Could not clone ${repo_name}"
        fi

    fi
}


# ============================================================
# COPY PDFs
# ============================================================

copy_pdfs() {

    local category="$1"
    local repo_path="$2"

    local destination="${PDF_DIR}/${category}"

    mkdir -p "$destination"

    log "Collecting PDFs from ${category}"

    find "$repo_path" \
        -type f \
        \( -iname "*.pdf" -o -iname "*.PDF" \) \
        -not -path "*/.git/*" \
        -print0 |
    while IFS= read -r -d '' file; do

        relative="${file#$repo_path/}"

        target="${destination}/${relative}"

        mkdir -p "$(dirname "$target")"

        if [[ -f "$target" ]]; then

            # Avoid overwriting files with identical names.
            if cmp -s "$file" "$target"; then
                log "Already exists: ${category}/${relative}"
            else
                base="$(basename "$target" .pdf)"
                dir="$(dirname "$target")"

                counter=1

                while [[ -f "${dir}/${base}_${counter}.pdf" ]]; do
                    ((counter++))
                done

                cp "$file" "${dir}/${base}_${counter}.pdf"

                log "Duplicate renamed: ${relative}"

            fi

        else

            cp "$file" "$target"

            log "PDF: ${category}/${relative}"

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

        log "Archive: ${category}/${relative}"

    done
}


# ============================================================
# EXTRACT ARCHIVES
# ============================================================

extract_archives() {

    if [[ -z "$EXTRACTOR" ]]; then
        return
    fi

    log "Starting archive extraction..."

    find "$ARCHIVE_DIR" \
        -type f \
        \( \
            -iname "*.rar" \
            -o -iname "*.zip" \
            -o -iname "*.7z" \
        \) \
        -print0 |
    while IFS= read -r -d '' archive; do

        relative="${archive#$ARCHIVE_DIR/}"

        # Remove archive extension.
        output_dir="${PDF_DIR}/EXTRACTED/${relative}"

        output_dir="${output_dir%.rar}"
        output_dir="${output_dir%.zip}"
        output_dir="${output_dir%.7z}"

        mkdir -p "$output_dir"

        log "Extracting: ${relative}"

        case "$EXTRACTOR" in

            7z|7zz)

                if "$EXTRACTOR" x \
                    -y \
                    "-o${output_dir}" \
                    "$archive" \
                    >>"$LOG_FILE" 2>>"$ERROR_LOG"; then

                    log "Extracted: ${relative}"

                else

                    error_log "Failed extraction: ${relative}"

                fi
                ;;

            unrar)

                if unrar x \
                    -o+ \
                    "$archive" \
                    "$output_dir/" \
                    >>"$LOG_FILE" 2>>"$ERROR_LOG"; then

                    log "Extracted: ${relative}"

                else

                    error_log "Failed extraction: ${relative}"

                fi
                ;;

        esac

    done
}


# ============================================================
# COLLECT PDFs FROM EXTRACTED ARCHIVES
# ============================================================

collect_extracted_pdfs() {

    local extracted="${PDF_DIR}/EXTRACTED"

    [[ -d "$extracted" ]] || return

    log "Collecting PDFs extracted from archives..."

    find "$extracted" \
        -type f \
        \( -iname "*.pdf" -o -iname "*.PDF" \) \
        -print0 |
    while IFS= read -r -d '' file; do

        relative="${file#$extracted/}"

        target="${PDF_DIR}/${relative}"

        mkdir -p "$(dirname "$target")"

        if [[ ! -f "$target" ]]; then

            cp "$file" "$target"

            log "Extracted PDF: ${relative}"

        fi

    done
}


# ============================================================
# CREATE INVENTORY
# ============================================================

create_inventory() {

    local inventory="${BASE_DIR}/FILE_INVENTORY.txt"

    log "Creating file inventory..."

    {
        echo "============================================================"
        echo "NEET / JEE STUDY MATERIAL"
        echo "Generated: $(date)"
        echo "============================================================"
        echo
        echo "PDF COUNT:"
        find "$PDF_DIR" -type f -iname "*.pdf" | wc -l
        echo
        echo "ARCHIVE COUNT:"
        find "$ARCHIVE_DIR" -type f | wc -l
        echo
        echo "============================================================"
        echo "PDF FILES"
        echo "============================================================"
        find "$PDF_DIR" \
            -type f \
            -iname "*.pdf" \
            -printf "%p\n" \
            | sort
        echo
        echo "============================================================"
        echo "ARCHIVES"
        echo "============================================================"
        find "$ARCHIVE_DIR" \
            -type f \
            -printf "%p\n" \
            | sort

    } > "$inventory"

    log "Inventory created: ${inventory}"
}


# ============================================================
# SUMMARY
# ============================================================

summary() {

    local pdf_count
    local archive_count

    pdf_count="$(find "$PDF_DIR" -type f -iname "*.pdf" | wc -l)"
    archive_count="$(find "$ARCHIVE_DIR" -type f | wc -l)"

    echo
    echo "============================================================"
    echo "DOWNLOAD COMPLETE"
    echo "============================================================"
    echo
    echo "Main directory:"
    echo "  $BASE_DIR"
    echo
    echo "PDFs:"
    echo "  $PDF_DIR"
    echo "  Count: $pdf_count"
    echo
    echo "Archives:"
    echo "  $ARCHIVE_DIR"
    echo "  Count: $archive_count"
    echo
    echo "Logs:"
    echo "  $LOG_FILE"
    echo "  $ERROR_LOG"
    echo
    echo "Inventory:"
    echo "  ${BASE_DIR}/FILE_INVENTORY.txt"
    echo
    echo "============================================================"
}


# ============================================================
# MAIN
# ============================================================

log "============================================================"
log "Starting study material downloader"
log "Target Directory: ${BASE_DIR}"
log "============================================================"

for category in "${!REPOS[@]}"; do

    url="${REPOS[$category]}"
    repo_name="$(basename "$url" .git)"
    repo_path="${REPO_DIR}/${repo_name}"

    log "Processing: ${category}"
    log "Repository: ${url}"

    clone_or_update "$category" "$url" "$repo_path"

    copy_pdfs "$category" "$repo_path"

    copy_archives "$category" "$repo_path"

done

extract_archives

collect_extracted_pdfs

create_inventory

summary

log "Finished."
