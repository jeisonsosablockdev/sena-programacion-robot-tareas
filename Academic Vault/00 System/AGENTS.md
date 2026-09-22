# Agent Instructions

## Scope
- `Academic Vault/` contains Obsidian notes only. Do not add code, package files, or runtime artifacts there.
- `Academic-Engine/` contains MCP, local tooling, imported skills, and operational docs.
- Keep `AGENTS.md` concise. Put extended process rules in `00 System/RESEARCH_WORKFLOW.md`
- For thesis work, follow `Academic Vault/00 System/THESIS_WORKFLOW.md`
- For PDF intake and conversion, follow `Academic Vault/00 System/PDF_INGEST_WORKFLOW.md`
- For web-derived text intake and conversion, follow `Academic Vault/00 System/WEB_TEXT_INGEST_WORKFLOW.md`
- For source indexing and project-source approval, follow `Academic Vault/00 System/SOURCES_INDEX_WORKFLOW.md`
- For document export, follow `Academic Vault/00 System/EXPORT_WORKFLOW.md`
- For project creation and restructuring, follow `Academic Vault/00 System/PROJECT_WORKFLOW.md`

## Package Manager
- Use `npm`.
- Build local MCP: `npm --prefix Academic-Engine run build:obsidian-mcp`
- Run local MCP: `npm --prefix Academic-Engine run obsidian-mcp`

## Research Skills
- Broad life-science research: use the `life-science-research` plugin and start with its router for ambiguous requests.
- Academic drafting and revision: use `scientific-writing`.
- Hypothesis generation: use `Academic-Engine/Imported Skills/scientific-hypothesis-generation-9/`.
- Formal export from vault Markdown: use `@export-document`. Use `latex-paper-conversion` only when the LaTeX template itself needs adaptation.

## Vault Conventions
- System docs live in `Academic Vault/00 System/`.
- Reusable note templates live in `Academic Vault/00 System/Templates/`.
- Preferred note types: `source`, `review`, `hypothesis`, `draft`, `concept`, `project`.
- Formal delivery requirements should be stored in `Academic Vault/Projects/Requirements/`.
- Every real project must live in its own folder under `Academic Vault/Projects/`.
- The canonical note inside each project folder is `PROJECT_INDEX.md`.
- Canonical project writing lives in `Academic Vault/Drafts/<Project Name>/`, `Academic Vault/Reviews/<Project Name>/`, and `Academic Vault/Hypotheses/<Project Name>/`.
- `Projects/<Project Name>/Drafts`, `Projects/<Project Name>/Reviews`, and `Projects/<Project Name>/Hypotheses` are symlink views only.
- `PROJECT_INDEX.md` and `EXPORT_MANIFEST.md` must reference canonical paths, not the symlink views.
- Global project coherence is maintained through `Academic Vault/MASTER_INDEX.md` and `Academic Vault/Projects/PROJECTS_INDEX.md`.
- The canonical source registry is `Academic Vault/Sources/SOURCES_INDEX.md`.
- Preserve Markdown readability for Obsidian. Prefer frontmatter for structured metadata.
- Save reusable research outputs to the vault, not only to chat.
- Use `00 System/RESEARCH_WORKFLOW.md` for general research work and `00 System/THESIS_WORKFLOW.md` for thesis-specific execution.
- Do not create standalone project notes directly under `Projects/`.
- Use `Sources/PDF Unconverted/` as the PDF intake queue and `Sources/PDF Converted/` for processed artifacts.
- Use direct URLs in chat for web-source intake and `Sources/Web Converted/` for processed web artifacts.
- Keep `README.md` and `00 System/SKILLS_REFERENCE.md` updated as navigational references for how the project is used and which skills are active.
- Update `Sources/SOURCES_INDEX.md` on every conversion and only change the `Projects` column after explicit user approval.

## MCP
- Obsidian MCP config: `Academic-Engine/config/obsidian-mcp.json`
- Local MCP server source: `Academic-Engine/vendor/obsidian-mcp-rest/`
- Treat MCP writes as user-facing content changes. Keep filenames and folder placement deliberate.

## Commit Attribution
- AI commits MUST include:
```text
Co-Authored-By: Google Gemini <gemini@google.com>
```
