# Skills Reference

## Purpose

This document explains the main skills currently used by this project and how each one fits into the research and writing system.

## Active Skills For This Project

### life-science-research

Purpose:

- broad scientific evidence retrieval for life sciences
- literature, dataset, genetics, expression, pathway, structure, chemistry, and clinical context

How to use it here:

- use it for research questions that need evidence gathering
- start with the research router for broad or ambiguous prompts
- use it to support source notes, review notes, and thesis sections

Best fit:

- topic exploration
- evidence synthesis
- source discovery
- cross-checking scientific claims

### scientific-writing

Purpose:

- academic drafting and revision
- scientific prose with structured sections
- thesis and manuscript-oriented writing support

How to use it here:

- use it when writing introductions, reviews, methods, discussions, and conclusions
- use it after evidence has already been gathered
- use it to turn notes into coherent academic paragraphs

Best fit:

- thesis chapters
- literature review sections
- academic cleanup and revision

### scientific-hypothesis-generation-9

Location:

- Local adaptation: `Academic-Engine/skills/`

Purpose:

- generate testable hypotheses
- compare competing explanations
- formulate predictions and experimental tests

How to use it here:

- use it when the work moves from review into interpretation
- use it for hypothesis notes and mechanistic reasoning
- use it to define what evidence would support or reject an idea

Best fit:

- hypothesis development
- test planning
- conceptual framing for thesis arguments

### librarian

Location:

- [Local Codex skill](</Users/jaymusicmachine/.codex/skills/librarian/SKILL.md>)

Purpose:

- process pending PDFs from the intake queue
- convert them to Markdown
- choose native extraction or OCR as needed
- move processed files into converted sources
- update `SOURCES_INDEX.md`

How to use it here:

- use it when there are PDFs waiting in `Sources/PDF Unconverted/`
- use it to run the operational PDF ingestion workflow
- use it before source-review work when the queue has not been processed yet

Best fit:

- batch PDF conversion
- intake queue cleanup
- source indexing

### export-document

Location:

- [Local Codex skill](</Users/jaymusicmachine/.codex/skills/export-document/SKILL.md>)

Purpose:

- assemble thesis drafts from vault Markdown
- export to `PDF` with Pandoc and LaTeX
- export in parallel to `DOCX`
- keep `draft` as the default release state

How to use it here:

- use it when a project already has ordered draft sections
- use it with `EXPORT_MANIFEST.md`
- use it after source validation and section drafting are already complete

Best fit:

- thesis export
- chapter assembly
- draft and final delivery generation

### fix-vault

Location:

- [Local Codex skill](</Users/jaymusicmachine/.codex/skills/fix-vault/SKILL.md>)

Purpose:

- repair organizational drift across the vault
- rebuild global indices
- repair legacy project links
- ensure canonical project note folders and project-folder symlink views exist
- resynchronize `PROJECT_INDEX.md` files with approved sources and project-tagged notes

How to use it here:

- use it after project restructuring
- use it after changing source approvals
- use it before a major export or review pass

Best fit:

- vault maintenance
- index repair
- project coherence repair

### latex-paper-conversion

Location:

- [Local Codex skill](</Users/jaymusicmachine/.codex/skills/latex-paper-conversion/SKILL.md>)

Purpose:

- adapt one LaTeX paper format to another
- repair or port publisher-specific LaTeX structures

How to use it here:

- do not use it as the main export route from Markdown
- use it only when the LaTeX template itself must be adapted for a specific institutional or journal format

Best fit:

- template conversion
- LaTeX structure fixes
- publisher-specific output adaptation

## Operational Documents That Work With These Skills

- [AGENTS.md](../../Academic Vault/00 System/AGENTS.md>)
- [RESEARCH_WORKFLOW.md](../../Academic Vault/00 System/RESEARCH_WORKFLOW.md>)
- [THESIS_WORKFLOW.md](../../Academic Vault/00 System/THESIS_WORKFLOW.md>)
- [PDF_INGEST_WORKFLOW.md](../../Academic Vault/00 System/PDF_INGEST_WORKFLOW.md>)
- [WEB_TEXT_INGEST_WORKFLOW.md](../../Academic Vault/00 System/WEB_TEXT_INGEST_WORKFLOW.md>)
- [EXPORT_WORKFLOW.md](../../Academic Vault/00 System/EXPORT_WORKFLOW.md>)

## Rule For Future Updates

- If a new skill becomes part of the project workflow, update this file and keep the link from `README.md`.


## Additional CS/Academic Skills

(Expanded to include 9 new CS/academic skills.)
