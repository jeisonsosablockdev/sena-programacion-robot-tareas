> Canonical source: Academic-Engine/docs/. The vault 00 System/ references this file.

# Web Text Ingest Workflow

## Purpose

This workflow defines how texts originating from web pages should enter the vault, preserve source metadata, be normalized into Markdown, and be stored in a processed location with the original reference link intact.

The goal is to keep web-derived material traceable. A converted note without its source URL is incomplete.

## Input Model

Web sources are provided directly by the user as links in chat.

Standard user prompt examples:

- `Process these links and save them to the vault`
- `Convert these pages to Markdown and classify them`
- `Review these sources for the thesis and store them as web notes`

### Processed Web Texts

After review and conversion, move them into:

- `Academic Vault/Sources/Web Converted/`

Each processed source should get its own subfolder.

Recommended structure:

```text
Academic Vault/Sources/Web Converted/
  source-slug/
    source-slug.md
    original.txt|html|md
```

## Mandatory Source Rule

Every processed web text must preserve the original page reference.

At minimum, the converted note must contain:

- the source URL
- the page title if available
- the date the content was captured or ingested

If the source URL is unknown, the note must be marked clearly as incomplete provenance.

## Processing Sequence

### 1. Intake

Codex should:

1. read the URLs provided by the user
2. normalize them when needed
3. avoid duplicate processing if the same source already exists in `Web Converted`

### 2. Source Inspection

Before conversion, inspect the web page and recover as much context as possible:

- original page title
- website or publisher
- author or organization
- publication date
- last updated date
- source URL
- language
- document type

### 3. Metadata Preservation

The converted Markdown note must preserve or infer as much metadata as possible.

Preferred frontmatter:

```yaml
type: source
source_kind: web
title:
site_name:
authors: []
organization:
published_date:
updated_date:
url:
canonical_url:
language:
original_filename:
original_relpath:
date_ingested:
date_converted:
capture_method:
status: converted
provenance_status:
tags: []
```

Recommended values for `provenance_status`:

- `verified`
- `partial`

## Markdown Conversion

Convert the web text into readable Markdown with these priorities:

1. preserve headings
2. preserve paragraph flow
3. preserve lists where they are meaningful
4. remove browser noise and navigation clutter
5. preserve quoted or cited sections when relevant

The result should be easy to search, annotate, and cite in Obsidian.

## Content Organization

Each converted Markdown file should contain:

1. metadata frontmatter
2. source reference block
3. short summary
4. key claims or findings
5. limitations or provenance notes
6. cleaned extracted content

Recommended structure:

```markdown
---
frontmatter
---

# Source Reference

- URL:
- Site:
- Published:
- Captured:

# Summary

# Key Claims

# Provenance Notes

# Extracted Content
```

## Link Preservation Rule

The original page link must appear in two places:

1. in frontmatter as `url`
2. in the body under `# Source Reference`

If there is a canonical link and a captured link, preserve both.

## Tagging

Every converted web note must include classification tags.

Base tags:

- `source/web`
- `status/converted`

Then add tags from relevant categories:

- source type:
  - `kind/article`
  - `kind/blog-post`
  - `kind/institutional-page`
  - `kind/web-report`
  - `kind/reference-page`
- domain:
  - `domain/biology`
  - `domain/medicine`
  - `domain/public-health`
  - `domain/education`
- topic:
  - `topic/inflammation`
  - `topic/microglia`
  - `topic/methodology`
- project alignment:
  - `project/thesis`
  - `project/literature-review`

Tagging rule:

- prefer a stable taxonomy
- use a small number of high-signal tags
- avoid one-off ad hoc tags when an existing category fits

## Final Move

Once conversion is complete:

1. create a slug folder in `Web Converted`
2. store the converted Markdown note there
3. retain a raw capture there if useful
4. add or update the source row in `Sources/SOURCES_INDEX.md`
5. do not require any intake folder for web sources

At that point the source is considered processed.

## Naming Convention

Use stable slugs derived from the best available source identity.

Preferred order:

1. `SiteNameYearShortTitle`
2. `OrganizationYearShortTitle`
3. cleaned filename if metadata is weak

Examples:

- `Nature2025MicrogliaReview`
- `WHO2024AdolescentHealth`

## Quality Control

Before moving a source to `Web Converted`, verify:

- title is captured correctly
- source URL is preserved
- publication or update date is recorded if available
- provenance status is set
- tags are assigned
- extracted content is readable
- obvious navigation noise is removed

If provenance is incomplete, that must be stated explicitly in the note.

## Relationship to Research Workflow

This workflow is the intake layer for web-native textual sources.

After a web text is converted:

- use it to create or enrich `source` notes
- link it into `review`, `hypothesis`, `concept`, or `draft` notes
- preserve the original page URL for citation and verification

## Rule for Codex

When the user asks to process web texts, Codex should:

1. inspect the URLs provided in chat
2. recover and preserve metadata
3. convert the content to Markdown
4. store the source URL in frontmatter and body
5. add classification tags
6. update `Sources/SOURCES_INDEX.md`
7. move the result into `Web Converted`

No web-derived note should be treated as complete unless its provenance is explicitly recorded.
