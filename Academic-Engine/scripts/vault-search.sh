#!/usr/bin/env bash
# vault-search.sh - Lean in-memory hybrid search for Academic Vault & Context
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node --experimental-strip-types "$SCRIPT_DIR/vault-search.ts" "$@"
