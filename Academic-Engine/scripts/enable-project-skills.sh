#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CODEX_SKILLS_DIR="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"
LOCAL_DIR="$ROOT/Academic-Engine/skills"

MODE="${1:-safe}"

mkdir -p "$CODEX_SKILLS_DIR"

link_skill() {
  local source_dir="$1"
  local skill_name="$2"
  local target="$CODEX_SKILLS_DIR/$skill_name"

  if [[ -e "$target" || -L "$target" ]]; then
    if [[ "$MODE" == "--force" ]]; then
      rm -rf "$target"
    else
      echo "skip  $skill_name (already exists in ~/.codex/skills)"
      return
    fi
  fi

  ln -s "$source_dir" "$target"
  echo "link  $skill_name -> $source_dir"
}

echo "Activating project skills from:"
echo "  local: $LOCAL_DIR"
echo ""

for dir in "$LOCAL_DIR"/*; do
  [[ -d "$dir" ]] || continue
  skill_name="$(basename "$dir")"
  link_skill "$dir" "$skill_name"
done

echo ""
echo "Done."
echo "Use '--force' to replace existing ~/.codex/skills entries with the project versions."
