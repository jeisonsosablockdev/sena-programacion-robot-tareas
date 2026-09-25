# Master Index

This is the global operational index of the vault.

Use it to keep coherence between `Projects`, `Sources`, `Drafts`, `Reviews`, `Hypotheses`, and system workflows.

## Global Anchors

- [[README|README]]
- [[Projects/PROJECTS_INDEX|Projects Index]]
- [[Sources/SOURCES_INDEX|Sources Index]]
- [[00 System/FICHA_APRENDIZ|Ficha del Aprendiz (Jeyson Julián Sosa Rodríguez)]]
- [[Profesores/00. PROFESORES_INDEX|Directorio de Profesores e Instructores]]
- [[00 System/PROJECT_WORKFLOW|Project Workflow]]
- [[00 System/RESEARCH_WORKFLOW|Research Workflow]]
- [[00 System/THESIS_WORKFLOW|Thesis Workflow]]
- [[00 System/EXPORT_WORKFLOW|Export Workflow]]

## Active Projects

| Project | Status | Project Index | Requirements | Export |
| --- | --- | --- | --- | --- |
| Smoke-Test-Project-Temporary | active | [[Projects/Smoke-Test-Project-Temporary/PROJECT_INDEX|Smoke-Test-Project-Temporary]] | [[Projects/Smoke-Test-Project-Temporary/PROJECT_REQUIREMENTS|Requirements]] | [[Projects/Smoke-Test-Project-Temporary/EXPORT_MANIFEST|Manifest]] |
| Idempotency-Test-Project | active | [[Projects/Idempotency-Test-Project/PROJECT_INDEX|Idempotency-Test-Project]] | [[Projects/Idempotency-Test-Project/PROJECT_REQUIREMENTS|Requirements]] | [[Projects/Idempotency-Test-Project/EXPORT_MANIFEST|Manifest]] |

## Global Rules

- Every project must have a folder in `Projects/`.
- The canonical note inside each folder is `PROJECT_INDEX.md`.
- Canonical project writing lives in `Drafts/<Project Name>/`, `Reviews/<Project Name>/`, and `Hypotheses/<Project Name>/`.
- Project folders should expose `Drafts`, `Reviews`, and `Hypotheses` as symlink views to those canonical folders.
- `PROJECT_INDEX.md` and `EXPORT_MANIFEST.md` must point to canonical paths, not to the symlink views.
- `Concepts/` remains global and project links still depend on frontmatter plus project index references.
- Source approval still lives in `Sources/SOURCES_INDEX.md`.
- Global project coherence is tracked through `Projects/PROJECTS_INDEX.md` and this `MASTER_INDEX.md`.
