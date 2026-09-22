---
name: fix-vault
description: "Vault maintenance and topology repair skill for auditing broken symlinks, restoring missing directories, and syncing project indexes. Use when the user asks to 'fix vault', 'audit vault', 'repair symlinks', or 'reconcile index'. For new projects, see project-scaffolding. For source intake, see librarian."
metadata:
  version: 1.0.0
---

# Fix Vault

## Purpose
Audits the Obsidian Academic Vault structure, repairs relative symlink views in `Projects/`, removes orphaned files, and reconciles `PROJECTS_INDEX.md` and `SOURCES_INDEX.md`.

## When to Use
- After manual file moves or git merges
- When broken symlinks occur in project directories
- When vault linting detects drifting structure
