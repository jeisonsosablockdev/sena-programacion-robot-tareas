# Research Workflow

## Purpose

This workflow defines how Codex should help run scientific research inside this project. The goal is to combine:

- scientific evidence retrieval
- academic writing support
- structured knowledge storage in Obsidian
- repeatable note creation through MCP

The vault is the long-term memory of the project. Chat is temporary. Valuable outputs should be stored in the vault.

## Operating Model

Use this sequence unless a task is clearly narrower:

1. Clarify the research objective.
2. Gather external evidence.
3. Synthesize findings.
4. Decide the note type to create or update.
5. Write structured content.
6. Save the result in the vault.
7. Reuse prior vault knowledge in future tasks.

## Skill Routing

### 1. Evidence Retrieval

Use `life-science-research` when the task requires:

- genetics or variant evidence
- expression or tissue context
- pathway, protein, or functional biology context
- chemistry, pharmacology, or clinical evidence
- literature, preprint, or dataset discovery

For broad requests, start with the plugin's research router and only fan out into narrower skills when needed.

### 2. Academic Writing

Use `scientific-writing` when the task requires:

- IMRAD writing
- abstract drafting
- literature review prose
- methods or discussion writing
- citation-aware academic tone
- section revision for clarity and rigor

### 3. Hypothesis Work

Use `Academic-Engine/Imported Skills/scientific-hypothesis-generation-9/` when the task requires:

- competing hypotheses
- mechanistic explanations
- predictions
- experiment design
- critical comparison between possible explanations

## Note Types

### `source`

Use for one paper, preprint, dataset, report, or external resource.

Suggested fields:

```yaml
type: source
title:
authors:
year:
doi:
url:
source_kind:
topic:
status:
tags:
```

### `review`

Use for a topic synthesis across multiple sources.

Suggested fields:

```yaml
type: review
project:
topic:
question:
related_sources:
status:
tags:
```

### `hypothesis`

Use for a testable claim derived from evidence.

Suggested fields:

```yaml
type: hypothesis
project:
question:
domain:
related_sources:
related_concepts:
status:
tags:
```

### `draft`

Use for thesis, paper, chapter, or section drafts.

Suggested fields:

```yaml
type: draft
project:
section:
status:
tags:
```

### `concept`

Use for stable knowledge objects such as genes, pathways, methods, or definitions.

## Folder Intent

- `Inbox/`: quick capture and unprocessed material
- `Sources/`: source notes
- `Sources/SOURCES_INDEX.md`: canonical table index of converted sources
- `Reviews/`: topic syntheses
- `Hypotheses/`: structured hypotheses
- `Drafts/`: manuscript or thesis writing
- `Concepts/`: reusable scientific concepts
- `Projects/`: project-specific notes and plans
- `Projects/PROJECTS_INDEX.md`: canonical table index of project folders
- `Projects/Requirements/`: formal project requirements, delivery parameters, and acceptance criteria
- `MASTER_INDEX.md`: global operational index for the whole vault
- `00 System/Templates/`: reusable note templates for source, review, hypothesis, draft, and project notes
- `00 System/`: operational rules, templates, and workflows

## Standard Task Flows

### Literature Intake

1. Identify the source.
2. Extract metadata.
3. Summarize the core claim, methods, results, and limitations.
4. Create or update a `source` note.
5. Add or update the source row in `Sources/SOURCES_INDEX.md`.
6. Link the note to relevant `review`, `concept`, or `project` notes.
7. Only add the source to a project after explicit user approval.
8. If the source arrives as a PDF, follow `00 System/PDF_INGEST_WORKFLOW.md`.
9. If the source arrives as a web link or web-derived text, follow `00 System/WEB_TEXT_INGEST_WORKFLOW.md`.

### Topic Review

1. Define the scientific question.
2. Retrieve evidence with `life-science-research`.
3. Compare agreements, conflicts, and gaps.
4. Write a synthesis using `scientific-writing`.
5. Save or update a `review` note.

### Hypothesis Development

1. Start from an observation, gap, or contradiction.
2. Gather supporting and opposing evidence.
3. Generate competing hypotheses.
4. Define predictions and experiments.
5. Save the output as a `hypothesis` note.

### Academic Drafting

1. Collect linked `source`, `review`, and `hypothesis` notes.
2. Draft the target section with `scientific-writing`.
3. Keep prose citation-aware and academically structured.
4. Save the section in a `draft` note.

### Project Creation

1. Create `Projects/<Project Name>/`.
2. Create canonical writing folders:
   - `Drafts/<Project Name>/`
   - `Reviews/<Project Name>/`
   - `Hypotheses/<Project Name>/`
3. Create project-folder symlink views:
   - `Projects/<Project Name>/Drafts`
   - `Projects/<Project Name>/Reviews`
   - `Projects/<Project Name>/Hypotheses`
4. Create `PROJECT_INDEX.md` from the project template.
5. Add `PROJECT_REQUIREMENTS.md` when the project has explicit delivery constraints.
6. Add `EXPORT_MANIFEST.md` when the project will generate formal deliverables.
7. Run `fix:vault` or rebuild `Projects/PROJECTS_INDEX.md` and `MASTER_INDEX.md`.

## Saving Rules

- Prefer updating an existing note when the topic already exists.
- Create a new note when the content introduces a distinct source, review, hypothesis, or manuscript unit.
- Keep titles specific and stable.
- Use links between notes so the vault becomes navigable as a knowledge graph.
- Do not leave valuable synthesis only in chat if it may be reused later.
- Keep `Sources/SOURCES_INDEX.md` synchronized with every source conversion.
- Do not assign a source to a project without explicit user approval.
- Do not create standalone project notes in `Projects/`; use a folder with `PROJECT_INDEX.md`.
- Keep `Drafts/`, `Reviews/`, and `Hypotheses/` in canonical project subfolders under their global thematic roots.
- Treat project-local `Drafts`, `Reviews`, and `Hypotheses` as symlink views only.

## MCP Use

- Use MCP to read existing notes before writing new ones.
- Use MCP to save finalized content into the correct folder.
- Treat the vault as the canonical project memory.
- Keep technical tooling and generated code inside `Academic-Engine/`, never inside the vault.
- Use the PDF intake workflow when processing source documents from `Sources/PDF Unconverted/`.
- Use the web text intake workflow when the user provides source URLs directly in chat.
