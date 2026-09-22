# Academic AI Studio

Hybrid workspace for academic research, software development coursework, and business content creation — powered by AI agents, with logic separated from the Obsidian vault.

## What This System Does

This workspace combines two capability domains:

1. **Academic & Computer Science** — Assists in software development courses, scientific research, thesis writing, and technical documentation
2. **Business & Marketing** — Creates pitch decks, marketing content, financial models, and investor materials

Both domains share the same infrastructure: Spec-Driven Development (SDD) with double human-in-the-loop guardrails, task management, non-destructive refinement, and multi-format export.

## Project Structure

```text
SENA - ROBOT TAREAS/
├── AGENTS.md
├── README.md
├── Academic-Engine/
│   ├── agents/          ← 12 AI agent definitions (6 Business + 6 Academic/CS)
│   ├── context/         ← Course profile, CS standards, writing guide, export config
│   ├── docs/            ← Workflows, organization rules, skills reference
│   ├── scripts/         ← Automation scripts (task init, SDD, export, validation)
│   ├── skills/          ← 65 skills (56 marketing + 9 CS/academic)
│   ├── templates/       ← Note, spec, LaTeX, and evaluation templates
│   ├── tests/           ← Smoke tests and idempotency verification
│   ├── brand/           ← (reserved for institutional assets)
│   └── outputs/         ← Temporary build outputs
└── Academic Vault/
    ├── 00 System/       ← Workflow references, templates, agent instructions
    ├── Sources/         ← PDF and web source library
    ├── Reviews/         ← Thematic syntheses by project
    ├── Hypotheses/      ← Testable claims by project
    ├── Drafts/          ← Manuscript sections by project
    ├── Concepts/        ← Global conceptual notes
    ├── Projects/        ← Project indexes, requirements, manifests
    ├── Inbox/           ← Raw captures and teacher instructions
    ├── Exports/         ← Compiled PDFs, DOCX, LaTeX
    └── MASTER_INDEX.md  ← Global operational dashboard
```

## The 12-Agent Squad

### Academic & CS Agents
| Agent | Role | Best For |
|---|---|---|
| `cs-tutor` | CS & Software Dev Tutor | Concepts, exercises, code review feedback |
| `code-reviewer` | Code Quality Architect | Clean code, SOLID, testing, security reviews |
| `research-librarian` | Source Intake Specialist | PDF/web conversion, source indexing |
| `thesis-writer` | Academic Writer | Thesis sections, technical reports |
| `methodology-consultant` | Research Methodology | Surveys, statistics, experimental design |
| `academic-reviewer` | Editorial Reviewer | Draft auditing, SDD quality loop |

### Business & Marketing Agents
| Agent | Role | Best For |
|---|---|---|
| `business-consultant` | Business Model Architect | Unit economics, financial models |
| `market-research-analyst` | TAM/SAM/SOM Analyst | Market sizing, competitor benchmarks |
| `pitch-deck-architect` | Pitch Deck Architect | Investor decks, `.pptx` generation |
| `compliance-officer` | Legal & Compliance | Corporate structure, KYC/AML |
| `b2b-sponsor-lead` | B2B Acquisition | Outbound sequences, pilot onboarding |
| `founder-ghostwriter` | Founder Voice | YC essays, thought leadership |

## How To Use

1. Fill or refine `Academic-Engine/context/course-profile.md` with your course details
2. Choose the task: academic (thesis, report, coding exercise) or business (pitch, marketing)
3. Use the appropriate agent and skill for your task
4. Save final outputs in the matching folder inside `Academic Vault/`
5. Follow `Academic-Engine/docs/document-organization.md` for folder conventions
6. Export deliverables using `bash Academic-Engine/scripts/export-pdf.sh`

## Key Commands

| Task | Command |
|---|---|
| Initialize a task | `bash Academic-Engine/scripts/task-init.sh <slug> [args]` |
| Run SDD workflow | `bash Academic-Engine/scripts/sdd-manager.sh <command>` |
| Ingest Pending PDFs | `bash Academic-Engine/scripts/ingest-pdf.sh [file.pdf]` |
| Ingest Web URL | `bash Academic-Engine/scripts/ingest-web.sh <url> [titulo]` |
| Reconcile Sources Index | `bash Academic-Engine/scripts/sync-sources-index.sh` |
| Scaffold New Project | `bash Academic-Engine/scripts/new-project.sh "<nombre>" "[meta]" "[autor]"` |
| Repair Vault Drift & Symlinks | `bash Academic-Engine/scripts/fix-vault.sh` |
| Export to PDF | `bash Academic-Engine/scripts/export-pdf.sh <file> [output]` |
| Validate vault | `bash Academic-Engine/scripts/validate-vault.sh` |
| Inspect agents | `bash Academic-Engine/scripts/inspect-squad.sh` |
| Validate skills | `bash Academic-Engine/scripts/validate-skills.sh` |
| Run smoke test | `bash Academic-Engine/tests/smoke-test.sh` |

## Working Rules

- Keep logic, scripts, templates, and skills in `Academic-Engine/`
- Keep final readable deliverables and research in `Academic Vault/`
- Canonical writing lives in `Drafts/<Project>/`, not in `Projects/<Project>/`
- `Projects/<Project>/Drafts` etc. are symlink views only
- Update `SOURCES_INDEX.md` on every source conversion
- Use the SDD protocol for quality-critical deliverables
