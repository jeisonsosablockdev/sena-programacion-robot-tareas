# Sources Index Workflow

## Purpose

This workflow defines how the central sources index must be maintained.

The canonical index lives at:

- `Academic Vault/Sources/SOURCES_INDEX.md`

Its role is to provide one visible table of all converted sources, their core metadata, and the projects in which they are approved for use.

## Core Rule

Every source conversion must update the index.

This applies to:

- PDFs converted through `PDF_INGEST_WORKFLOW.md`
- web sources converted through `WEB_TEXT_INGEST_WORKFLOW.md`

## Table Schema

The index table uses a human-readable schema:

- `Source`
- `Authors`
- `Year`
- `Kind`
- `Reference`
- `Projects`
- `Status`

The `Source` column should be an Obsidian link to the converted note.

## Source Identity Rule

Each source still has a stable identity derived from its converted slug and note path, but the visible table should optimize for readability rather than raw identifiers.

Preferred display behavior:

- show the note title as the main table entry
- keep the note linked in Obsidian
- keep raw identifiers out of the visible table unless needed for troubleshooting

## Update Rules On Conversion

When a source is converted:

1. create or update the source note
2. add or update one row in `Sources/SOURCES_INDEX.md`
3. populate the row with the best available metadata
4. leave `Projects` empty unless the user explicitly approves project use

Minimum fields to populate:

- `Source`
- `Authors`
- `Year`
- `Kind`
- `Reference`
- `Status`

Recommended `Status` values:

- `converted`
- `needs-review`
- `provenance-partial`

## Project Association Rule

The `Projects` column must only contain projects explicitly approved by the user.

This means:

- a source may be converted and indexed without belonging to any project
- being discussed in chat is not enough to assign it to a project
- the user must explicitly approve inclusion before a project name is added

Examples of acceptable approval:

- `Include this source in the thesis project`
- `Add these three papers to the software-architecture project`
- `Remove this source from the project`

## Update Rules On Project Use

When a source is approved for project use:

1. update the `Projects` column in `SOURCES_INDEX.md`
2. update the relevant project note
3. ensure the project uses only approved sources from the index

When project use is removed:

1. remove the project name from the `Projects` column
2. update the relevant project note

## Project Creation Rule

Source index maintenance is part of project creation.

Every new project should:

1. define its central question and scope
2. link to `Sources/SOURCES_INDEX.md`
3. include a section for approved sources
4. only list sources that the user has approved for inclusion

## Project Naming In The Index

Use stable, human-readable project names in the `Projects` column.

Prefer:

- thesis names
- project note names
- short stable project labels

Avoid:

- ad hoc temporary phrasing
- ambiguous names

## Rebuild Command

The preferred command to refresh the index is:

```bash
cd development
npm run sources:index
```

## Rule For Codex

When converting sources or updating projects, Codex must:

1. treat `Sources/SOURCES_INDEX.md` as the central source registry
2. update it every time a source is converted
3. never add a project association without explicit user approval
4. remove project associations when the user requests removal
5. prefer the rebuilt human-readable table format over ad hoc row edits
