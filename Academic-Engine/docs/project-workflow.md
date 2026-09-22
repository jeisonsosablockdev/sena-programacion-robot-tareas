> Canonical source: Academic-Engine/docs/. The vault 00 System/ references this file.

# Project Workflow

## Purpose

This workflow defines how projects must be created and maintained so they remain coherent across the whole vault.

The problem it solves is simple:

- sources live in `Sources/`
- writing lives in `Drafts/`
- syntheses live in `Reviews/`
- hypotheses live in `Hypotheses/`

Without a canonical project anchor, the work fragments across folders.

## Core Rule

- Never create a standalone project note directly in `Projects/`.

Every real project must live in:

- `Projects/<Project Name>/`

And must contain at least:

- `PROJECT_INDEX.md`

Recommended files:

- `PROJECT_REQUIREMENTS.md`
- `EXPORT_MANIFEST.md`
- `Exports/`

## Canonical Writing Paths And Project Views

Rule:

- canonical draft writing lives in `Drafts/<Project Name>/`
- canonical review writing lives in `Reviews/<Project Name>/`
- canonical hypothesis writing lives in `Hypotheses/<Project Name>/`
- inside `Projects/<Project Name>/`, the folders `Drafts`, `Reviews`, and `Hypotheses` must exist only as symlink views to those canonical folders
- `PROJECT_INDEX.md` and `EXPORT_MANIFEST.md` must point to canonical paths, never to the symlink views

Purpose:

- keep thematic folders globally organized
- keep each project easy to navigate from its own folder
- avoid duplication and reduce drift

## Canonical Files

### `PROJECT_INDEX.md`

This is the master note for the project.

It must link:

- approved sources
- relevant drafts
- related reviews
- related hypotheses
- related concepts
- requirements
- export manifest

### `PROJECT_REQUIREMENTS.md`

Use this when the project has delivery rules, deadlines, evaluation criteria, or school constraints.

### `EXPORT_MANIFEST.md`

Use this when the project produces formal output such as a thesis draft, PDF, or DOCX export.

## Global Indices

Two files maintain vault-wide coherence:

- `MASTER_INDEX.md`
- `Projects/PROJECTS_INDEX.md`

Rules:

- `MASTER_INDEX.md` is the global operational dashboard.
- `Projects/PROJECTS_INDEX.md` is the canonical registry of projects.
- `Sources/SOURCES_INDEX.md` remains the canonical registry of converted sources.

## Creation Flow

1. Create `Projects/<Project Name>/`.
2. Create canonical folders:
   - `Drafts/<Project Name>/`
   - `Reviews/<Project Name>/`
   - `Hypotheses/<Project Name>/`
3. Create symlink views inside `Projects/<Project Name>/`:
   - `Drafts -> ../../Drafts/<Project Name>`
   - `Reviews -> ../../Reviews/<Project Name>`
   - `Hypotheses -> ../../Hypotheses/<Project Name>`
4. Create `PROJECT_INDEX.md` from `00 System/Templates/project_template.md`.
5. If the project has explicit requirements, create `PROJECT_REQUIREMENTS.md` from `00 System/Templates/requirements_template.md`.
6. If the project will be exported, create `EXPORT_MANIFEST.md` from `00 System/Templates/export_manifest_template.md`.
7. Link the project to relevant notes in `Drafts/`, `Reviews/`, `Hypotheses/`, and `Concepts/`.
8. Run `npm run fix:vault` to verify symlink views, canonical note placement, and indices.

## Rebuild Command

```bash
cd "Academic-Engine"
npm run projects:index
```

## Drift Repair

When coherence is already degraded, use:

```bash
cd "Academic-Engine"
npm run fix:vault
```

This is stronger than `projects:index` because it also repairs legacy project links and resynchronizes project indices with approved sources and project-tagged notes.

## Cross-Folder Rule

- `Drafts/`, `Reviews/`, `Hypotheses/`, and `Concepts/` remain global thematic folders.
- `Drafts/`, `Reviews/`, and `Hypotheses/` must use one canonical subfolder per project.
- `Projects/<Project Name>/Drafts`, `Projects/<Project Name>/Reviews`, and `Projects/<Project Name>/Hypotheses` are convenience views only and should be symlinks.
- Their connection to a project must still be made explicit through frontmatter and links from `PROJECT_INDEX.md`.
- Export configuration must always reference canonical paths like `Drafts/<Project Name>/...`.

## Minimum Metadata

Project notes should define:

```yaml
type: project
project:
status:
question:
goal:
tags:
```

Review and hypothesis notes should include `project:` whenever they belong to a specific project.

## Enforcement Rule

- If a project exists without a folder, treat it as legacy and migrate it.
- If a project folder exists without `PROJECT_INDEX.md`, treat it as incomplete.
- If a project is missing canonical thematic folders or symlink views, treat it as incomplete.
- If notes for a project are loose at the root of `Drafts/`, `Reviews/`, or `Hypotheses/`, treat them as drift and move them into the canonical project subfolder.
- After any project creation or migration, update `MASTER_INDEX.md` and `Projects/PROJECTS_INDEX.md`.
