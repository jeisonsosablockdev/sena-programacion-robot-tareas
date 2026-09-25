#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOL_DIR="$(cd "$SCRIPT_DIR/../tools/drive-ingest" && pwd)"

npx --prefix "$TOOL_DIR" tsx "$TOOL_DIR/src/index.ts" "$@"
