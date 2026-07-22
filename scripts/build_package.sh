#!/bin/bash
# Zero Apex Engine — package builder
# Produces an Operit-compatible zip with 零.md at the root.
# Usage: bash scripts/build_package.sh [VERSION_TAG]
# Output: dist/zero_apex-<TAG>.zip

set -euo pipefail

VERSION="${1:-$(grep -oP '"version"\s*:\s*"\K[^"]+' manifest.json)}"
OUT_DIR="dist"
OUT_FILE="${OUT_DIR}/zero_apex-${VERSION}.zip"
STAGE_DIR="${OUT_DIR}/stage_zero_apex"

echo "=== Building Zero Apex package v${VERSION} ==="

# Clean stage
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"

# Copy needed files (no tests, no CI, no .trash, no node_modules)
cp "零.md" "${STAGE_DIR}/零.md"
cp "零.skill" "${STAGE_DIR}/零.skill"
cp "manifest.json" "${STAGE_DIR}/manifest.json"
cp "README.md" "${STAGE_DIR}/README.md"
cp "install.sh" "${STAGE_DIR}/install.sh"
chmod +x "${STAGE_DIR}/install.sh"

mkdir -p "${STAGE_DIR}/engine"
cp "engine/zero_apex.js" "${STAGE_DIR}/engine/zero_apex.js"

mkdir -p "${STAGE_DIR}/references"
cp references/*.md "${STAGE_DIR}/references/"

mkdir -p "${OUT_DIR}"

# Build the zip
if command -v zip >/dev/null 2>&1; then
  (cd "$STAGE_DIR" && zip -r "../$(basename "$OUT_FILE")" .) >/dev/null
else
  # Fallback: python zipfile
  python3 -c "
import zipfile, os
src = '${STAGE_DIR}'
out = '${OUT_FILE}'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(src):
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.relpath(full, src)
            zf.write(full, arc)
            print('  added:', arc)
"
fi

# Cleanup stage
rm -rf "$STAGE_DIR"

echo ""
echo "Built: $OUT_FILE"
echo "Size: $(ls -lh "$OUT_FILE" | awk '{print $5}')"
echo ""
echo "Upload to GitHub release:"
echo "  gh release upload v${VERSION} '$OUT_FILE'"
