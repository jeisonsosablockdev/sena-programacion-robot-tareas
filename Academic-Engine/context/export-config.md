---
title: "Export Pipeline Configuration"
type: "export-context"
status: "active"
version: "1.0.0"
last_updated: "2026-09-20"
tags:
  - export
  - pandoc
  - latex
  - pdf
---

# Export Pipeline Configuration

> [!NOTE] Purpose
> Configuration reference for the document export pipeline: Pandoc + Tectonic (XeTeX) for producing PDF, DOCX, and LaTeX outputs from vault Markdown.

## Toolchain

| Tool | Role | Installation |
|---|---|---|
| **Pandoc** | Markdown → LaTeX/DOCX converter | `brew install pandoc` or [pandoc.org](https://pandoc.org) |
| **Tectonic** | XeTeX engine for PDF compilation | `brew install tectonic` or [tectonic-typesetting.github.io](https://tectonic-typesetting.github.io) |
| **citeproc** | Citation processing (Pandoc filter) | Bundled with Pandoc |
| **mermaid-filter** | Mermaid diagram rendering | `npm install -g mermaid-filter` |

## Citation Style

- **Default:** APA 7th Edition
- **CSL file:** `apa.csl` (download from [Zotero Style Repository](https://www.zotero.org/styles/apa))
- **Alternative:** IEEE (`ieee.csl`) for technical/engineering papers
- CSL files should be stored in `Academic-Engine/templates/` or referenced by absolute path

## LaTeX Template

- **Primary:** `Academic-Engine/templates/academic-latex-header.tex`
- **Colors:** Dark Navy `#1a1a2e`, Accent Blue `#0077b6`, Text Gray `#333333`
- **Typography:** Libertinus Serif (body), Libertinus Sans (headings), Fira Code (monospace)
- **Features:** Header/footer with institution name and date, page numbers, title page

## Output Formats

| Format | Extension | Use Case |
|---|---|---|
| PDF | `.pdf` | Final delivery, print, institutional submission |
| DOCX | `.docx` | Collaborative editing, teacher feedback |
| LaTeX | `.tex` | Fine typography control, custom formatting |
| Markdown | `.md` | Source format, vault storage |

## Export Manifest

Each project defines its export configuration in `EXPORT_MANIFEST.md`:

```yaml
---
title: "Project Title"
authors: ["Student Name"]
institution: "Institution Name"
date: "YYYY-MM-DD"
status: "draft | final"
citation_style: "apa"
draft_order:
  - "Section 1 filename"
  - "Section 2 filename"
watermark: true | false
output_dir: "Projects/<Project>/Exports/"
---
```

## Watermark

- **File:** `watermark.png` (stored in project export assets)
- **Position:** Background, centered, semi-transparent
- **Usage:** Enabled for `status: draft`, disabled for `status: final`

## Mermaid Diagrams

- Rendered to PNG during export via `mermaid-filter`
- Stored in `<export-name>-assets/` alongside the compiled output
- Named sequentially: `mermaid-1.png`, `mermaid-2.png`, etc.

## Command Reference

```bash
# Export to PDF (via Academic-Engine script)
bash Academic-Engine/scripts/export-pdf.sh <file.md> [out.pdf] [--raw] [--open]

# Manual Pandoc command (PDF)
pandoc input.md -o output.pdf \
  --pdf-engine=tectonic \
  --citeproc \
  --csl=apa.csl \
  --include-in-header=academic-latex-header.tex \
  -F mermaid-filter

# Manual Pandoc command (DOCX)
pandoc input.md -o output.docx \
  --citeproc \
  --csl=apa.csl \
  --reference-doc=reference.docx
```
