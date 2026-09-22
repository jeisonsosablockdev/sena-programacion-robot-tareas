#!/usr/bin/env bash
# ==============================================================================
# Script: sync-content-grid.sh
# Purpose: Synchronizes the 15-day Content Grid with deliverable notes and visual assets
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/sync-content-grid.js"

if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado o no se encuentra en el PATH."
    exit 1
fi

node "$NODE_SCRIPT" "$@"
