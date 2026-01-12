#!/bin/bash
# Build Firefox XPI for ProxyAssistant Extension
# Usage: ./script/build-firefox-xpi.sh [version]

set -e

# Get version from argument or use current date
VERSION=${1:-"dev"}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="${PROJECT_DIR}/src"
BUILD_DIR="${PROJECT_DIR}/build"

echo "=========================================="
echo "Building Firefox XPI - v${VERSION}"
echo "=========================================="

# Cleanup previous build
echo "Cleaning up..."
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# Prepare source for Firefox
echo "Preparing Firefox source..."
cp -r "${SRC_DIR}" "${BUILD_DIR}/src-firefox"

# Use Firefox manifest
cp "${BUILD_DIR}/src-firefox/manifest_firefox.json" "${BUILD_DIR}/src-firefox/manifest.json"

# Remove extra manifest files
rm -f "${BUILD_DIR}/src-firefox/manifest_chrome.json" \
      "${BUILD_DIR}/src-firefox/manifest_firefox.json"

# Build XPI using web-ext
echo "Building XPI with web-ext..."
cd "${BUILD_DIR}"

# Create ZIP (for manual install/review)
cd src-firefox
zip -r "../ProxyAssistant_${VERSION}_firefox.zip" .
cd ..

# Build XPI
web-ext build --source-dir src-firefox --artifacts-dir . --overwrite-dest

# Rename generated zip to xpi
XPI_FILE=$(ls *.zip 2>/dev/null | head -1)
if [ -n "$XPI_FILE" ]; then
    mv "$XPI_FILE" "ProxyAssistant_${VERSION}_firefox.xpi"
    echo "Generated: ProxyAssistant_${VERSION}_firefox.xpi"
fi

# Cleanup build source
rm -rf src-firefox

echo "=========================================="
echo "Build completed successfully!"
echo "Output files:"
ls -lh *.zip *.xpi 2>/dev/null || echo "No output files found"
echo "=========================================="
