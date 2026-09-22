# PDF Ingest Workflow

## Purpose

This workflow defines how PDFs should enter the vault, be reviewed, converted to Markdown, enriched with metadata, classified with tags, and moved into their final processed location.

The goal is to preserve the original file while making the contents easier to analyze, search, cite, and reuse inside Obsidian.

## Conversion Stack

The PDF conversion stack for this project lives in `Academic-Engine/` and supports two extraction modes:

- native text extraction for PDFs that already contain selectable text
- OCR extraction for scanned PDFs or PDFs with poor embedded text

### Local Stack Components

- Python virtual environment: `Academic-Engine/.venv`
- Python dependencies: `Academic-Engine/requirements-pdf.txt`
- Conversion script: `Academic-Engine/scripts/process_pdf_ingest.py`
- OCR engine: `tesseract`

### Setup Commands

From `Academic-Engine/`:

```bash
npm run setup:pdf-stack
```

For OCR, install `tesseract` on macOS:

```bash
brew install tesseract
```

### Command-Style Usage

Process all PDFs waiting in the intake folder:

```bash
cd development
npm run pdf:queue
```

Process one specific PDF:

```bash
cd development
npm run pdf:file -- "/absolute/path/to/file.pdf"
```

### Extraction Logic

The script uses this decision flow:

1. try native extraction from the PDF text layer
2. if native extraction quality is poor, switch to OCR
3. write Markdown with frontmatter and extracted content
4. move the PDF and Markdown into `Sources/PDF Converted/`
5. update `Sources/SOURCES_INDEX.md`

This command functions as the practical project skill for PDF ingestion.

## Folder Model

### Incoming PDFs

Drop new PDFs into:

- `Academic Vault/Sources/PDF Unconverted/`

These files are considered unprocessed. Codex should treat this folder as the intake queue.

### Processed PDFs

After conversion and organization, move them into:

- `Academic Vault/Sources/PDF Converted/`

Each processed source should get its own subfolder inside `PDF Converted`.

Recommended structure:

```text
Academic Vault/Sources/PDF Converted/
  source-slug/
    original.pdf
    source-slug.md
```

## Operating Rule

The user places PDFs in `PDF Unconverted` and then gives Codex an instruction to process them.

Standard user prompt examples:

- `Process the new PDFs in PDF Unconverted`
- `Review and convert the PDFs waiting in the intake folder`
- `Convert the pending thesis PDFs to Markdown and organize them`

## Processing Sequence

### 1. Inventory

Codex should:

1. List all PDFs in `PDF Unconverted`.
2. Identify which files are new or still pending.
3. Avoid duplicating work if a processed folder already exists for the same file or source.

### 2. Direct PDF Review

Before converting, inspect the PDF directly to understand:

- title
- authors
- publication venue
- year
- DOI or accession if present
- page count
- document type
- whether the PDF is text-based or scanned

If the PDF is scanned, use OCR before or during extraction.

### 3. Metadata Preservation

The converted Markdown note must preserve or infer as much metadata as possible.

Preferred metadata fields:

```yaml
type: source
source_kind: pdf
title:
authors: []
year:
journal:
doi:
url:
language:
pages:
original_filename:
original_relpath:
date_ingested:
date_converted:
pdf_sha256:
conversion_method:
status: converted
tags: []
```

### 4. Markdown Conversion

Convert the PDF into readable Markdown with these priorities:

1. preserve headings
2. preserve paragraph flow
3. preserve tables when feasible
4. capture figure captions if possible
5. remove broken line wraps where practical

The goal is not a perfect facsimile. The goal is analyzable, searchable text.

Two supported extraction methods:

- `native`: uses the embedded PDF text layer
- `ocr`: renders pages and extracts text through `tesseract`

Preferred rule:

- use `native` when the PDF already has good text
- use `ocr` when the PDF is scanned or native extraction quality is poor

### 5. Content Organization

Each Markdown file should contain:

1. metadata frontmatter
2. short source summary
3. key findings
4. methods or document type notes
5. limitations or extraction caveats
6. extracted main text or cleaned sectioned content

Recommended high-level structure:

```markdown
---
frontmatter
---

# Summary

# Key Findings

# Methods or Source Notes

# Limitations

# Extracted Content
```

### 6. Tagging

Every converted note must include classification tags.

Base tags:

- `source/pdf`
- `status/converted`

Then add tags from the relevant categories:

- document type:
  - `kind/paper`
  - `kind/preprint`
  - `kind/report`
  - `kind/book-chapter`
  - `kind/thesis-source`
- domain:
  - `domain/biology`
  - `domain/medicine`
  - `domain/neuroscience`
  - `domain/public-health`
- topic:
  - `topic/microglia`
  - `topic/inflammation`
  - `topic/gene-expression`
- project alignment:
  - `project/thesis`
  - `project/literature-review`

Tagging rule:

- use a small number of high-signal tags
- prefer stable taxonomy over ad hoc labels
- reuse existing vault patterns when available

### 7. Final Move

Once conversion is complete:

1. create a slug folder inside `PDF Converted`
2. move the original PDF into that folder
3. save the Markdown note there as well
4. add or update the source row in `Sources/SOURCES_INDEX.md`
5. remove the original PDF from `PDF Unconverted`

At that point the source is considered processed.

## Naming Convention

Use stable slugs derived from the best available bibliographic identity.

Preferred order:

1. `AuthorYearShortTitle`
2. `OrganizationYearShortTitle`
3. cleaned filename if metadata is weak

Examples:

- `Smith2024Neuroinflammation`
- `WHO2023AdolescentMentalHealth`

## Quality Control

Before moving a file to `PDF Converted`, verify:

- title is captured correctly
- author list is not obviously broken
- year is present if available
- DOI is preserved if available
- tags are assigned
- extracted text is readable enough for analysis
- original PDF is retained

If extraction quality is poor, note that explicitly in `conversion_method` or `Limitations`.

## Relationship to Research Workflow

This workflow is the intake layer for literature handling.

After a PDF is converted:

- use it to create or enrich `source` notes
- link it into `review`, `hypothesis`, `concept`, or `draft` notes
- reuse the Markdown version for summarization, quoting, and synthesis

## Rule for Codex

When the user asks to process PDFs, Codex should:

1. inspect pending PDFs in `PDF Unconverted`
2. review them directly
3. convert them to Markdown
4. preserve metadata
5. add classification tags
6. update `Sources/SOURCES_INDEX.md`
7. move the originals and converted Markdown into `PDF Converted`

The vault should end up with both the original artifact and the analyzable Markdown representation.

## Operational Command Rule

When this workflow is used, the preferred command path is:

```bash
cd development
npm run pdf:queue
```

For single-file work:

```bash
cd development
npm run pdf:file -- "/absolute/path/to/file.pdf"
```
