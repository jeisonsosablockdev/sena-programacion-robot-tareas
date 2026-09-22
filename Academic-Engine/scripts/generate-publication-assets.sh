#!/usr/bin/env bash
# ==============================================================================
# Script: generate-publication-assets.sh
# Purpose: Context-Aware Publication Asset Generator for BRIDS
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/generate-publication-assets.js"

if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado o no se encuentra en el PATH."
    exit 1
fi

node "$NODE_SCRIPT" "$@"
