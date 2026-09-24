# Agent Instructions

## Package Manager
- Content-first workspace; no package manager required for normal work
- Skill validation: `bash Academic-Engine/scripts/validate-skills.sh`

## File-Scoped Commands
| Task | Command |
|------|---------|
| Universal Two-Agent Task Loop (>= 8.5) | `bash Academic-Engine/scripts/task-loop.sh <slug> ["<requerimientos>"] ["<meta>"]` |
| Atomic Task Init & SDD Engine | `bash Academic-Engine/scripts/task-init.sh <slug> [titulo] [target-folder] [subagents] [icp] [goal]` |
| Spec-Driven Development (SDD) | `bash Academic-Engine/scripts/sdd-manager.sh <init|loop-spec|preview|approve|loop-task|evaluate|review-deliverable|approve-deliverable|status|list>` |
| Ingest Pending PDFs | `bash Academic-Engine/scripts/ingest-pdf.sh [file.pdf]` |
| Ingest Web URL to Markdown | `bash Academic-Engine/scripts/ingest-web.sh <url> [titulo]` |
| Reconcile Sources Index | `bash Academic-Engine/scripts/sync-sources-index.sh` |
| Scaffold New Project | `bash Academic-Engine/scripts/new-project.sh "<nombre>" "[meta]" "[autor]"` |
| Repair Vault Drift & Symlinks | `bash Academic-Engine/scripts/fix-vault.sh` |
| Context-Aware Asset Generator | `bash Academic-Engine/scripts/generate-publication-assets.sh <nota|slug> [--input-image img]` |
| Sync Master Content Grid | `bash Academic-Engine/scripts/sync-content-grid.sh [audit|sync|update]` |
| Generate 4-Slide Carousel | `bash Academic-Engine/scripts/create-social-carousel.sh "<idea>" [img] [asset] [ref]` |
| Generate Social Post | `bash Academic-Engine/scripts/create-social-post.sh <red> "<idea>" [tipo] [ref] [asset]` |
| Verify Idempotency | `bash Academic-Engine/tests/test-idempotency.sh` |
| Anti-Drift Compliance Audit | `bash Academic-Engine/scripts/enforce-compliance.sh` |
| Manage Task Lifecycle | `bash Academic-Engine/scripts/task-manager.sh <init|add|show|update|list|close>` |
| Non-Destructive Refine | `bash Academic-Engine/scripts/refine-note.sh <inspect|backup|refine|branch|rollback>` |
| Read Markdown | `sed -n '1,160p' path/to/file.md` |
| List vault folders | `find "Academic Vault" -maxdepth 3 -type d \| sort` |
| Validate skills | `bash Academic-Engine/scripts/validate-skills.sh` |
| Activate project skills | `bash Academic-Engine/scripts/enable-project-skills.sh` |
| Activate project skills (Windows) | `powershell -ExecutionPolicy Bypass -File .\Academic-Engine\scripts\enable-project-skills.ps1` |
| Inspect Agent Squad | `bash Academic-Engine/scripts/inspect-squad.sh` |
| End-to-End System Smoke Test | `bash Academic-Engine/tests/smoke-test.sh` |
| Export LaTeX / Markdown to PDF | `bash Academic-Engine/scripts/export-pdf.sh <file.md\|file.tex> [out.pdf] [--raw] [--open]` |
| Lean Vault & Context Search (TS) | `bash Academic-Engine/scripts/vault-search.sh "<termino>" [--category <cat>] [--limit 5] [--json]` |

## Commit Attribution
- AI commits MUST include:
```text
Co-Authored-By: Google Gemini <gemini@google.com>
```

## Non-Destructive Content Refinement Rule (CRITICAL)
- NEVER wipe or destructively overwrite existing document content unless explicitly requested by the user with unambiguous deletion keywords ('delete', 'remove', 'erase', 'elimina', 'borra').
- When asked to perform a task or update an existing note, the default behavior is **incremental refinement**: read the existing note, preserve established insights, and augment/refine the specific sections requested.
- Use `bash Academic-Engine/scripts/refine-note.sh refine <path> "<summary>"` to maintain safety snapshots, bump versioning, and update the document changelog.
- For major structural pivots, create a new versioned file rather than destroying previous drafts.

## Workspace Layout
- `Academic-Engine/`: source of truth for skills, agents, automation scripts, docs, and context
- `Academic Vault/`: Obsidian vault, persistent knowledge base and final Markdown deliverables

## Content Workflow
- Read `Academic-Engine/context/course-profile.md` before creating course-related deliverables
- Read `Academic-Engine/context/cs-standards.md` for code quality and engineering standards
- Read `Academic-Engine/context/academic-writing-guide.md` for writing standards
- Save final content as Markdown inside the matching folder in `Academic Vault/`
- Keep logic, experiments, and skill adaptation work in `Academic-Engine/`
- Follow `Academic-Engine/docs/document-organization.md` before creating folders or moving files

## Skills
- Local adaptations live in `Academic-Engine/skills/`
- Skill activation instructions live in `Academic-Engine/docs/skills-activation.md`
- For Windows, prefer `enable-project-skills.ps1`

## Anti-Drift Task Execution Protocol (Doble Bucle Revisor-Editor & Doble Guardrail HITL)
Para prevenir el drifting contextual y garantizar pertinencia y rigor técnico absoluto, toda tarea o generación de contenido se ejecuta bajo esta arquitectura:

1. **Fase 1: Inicialización & Bucle Autónomo del Spec (Spec-Loop):**
   - El requerimiento se inicializa con `bash Academic-Engine/scripts/task-init.sh <slug> "<title>" "<target-folder>" "<subagents>" "[icp]" "[goal]"`.
   - **Bucle Revisor $\leftrightarrow$ Editor del Spec:** Se ejecuta `bash Academic-Engine/scripts/sdd-manager.sh loop-spec <slug>`. El agente `task-editor` y el revisor `academic-reviewer` iteran sobre el documento del spec (`.spec.md` y `.spec.json`), evaluando pertinencia, viabilidad técnica y criterios de aceptación verificables hasta alcanzar una nota $\ge 8.5 / 9.0$.
2. **Primer Guardrail HITL (Aprobación Humana del Spec):**
   - Se presenta el spec optimizado al usuario (`bash Academic-Engine/scripts/sdd-manager.sh preview <slug>`).
   - **Bloqueo Mandatorio:** Ningún agente comienza la ejecución o redacción del entregable hasta que el usuario apruebe formalmente con `bash Academic-Engine/scripts/sdd-manager.sh approve-spec <slug>`.
3. **Fase 2: Bucle Autónomo de Ejecución de Tarea (Task-Loop):**
   - Se ejecuta el bucle de optimización de la tarea con `bash Academic-Engine/scripts/sdd-manager.sh loop-task <slug>` (o directamente `bash Academic-Engine/scripts/task-loop.sh <slug>`).
   - **Bucle Creador/Editor $\leftrightarrow$ Revisor:** El agente creador/editor (`task-editor`, `thesis-writer`, `cs-tutor`) redacta el entregable y el revisor (`academic-reviewer`, `code-reviewer`) audita en escala de 0 a 9 puntos en 4 dimensiones críticas:
     - 1. **Pertinencia con los Requisitos & Objetivo Solicitado (2.5 pts):** Cobertura total de lo pedido por el usuario, público objetivo e intención pedagógica/técnica.
     - 2. **Rigor Científico/Técnico & Estándares CS (2.5 pts):** Clean Code, SOLID, patrones, arquitectura, testing y referencias verificables.
     - 3. **Claridad, Coherencia & Estructura (2.0 pts):** Jerarquía visual, concisión, sin rodeos corporativos ni prosa pasiva.
     - 4. **Originalidad Léxica & Cero Clichés de IA (2.0 pts):** Tolerancia cero a frases cliché de LLMs.
   - **Condición de Calidad:** Debe superar $\ge 8.5 / 9.0$ (máximo 5 ciclos). Al superar 8.5, pasa a `deliverable_review` (HITL-2).
4. **Segundo Guardrail HITL (Aprobación del Entregable):**
   - Se presenta el entregable final pulido al usuario (`bash Academic-Engine/scripts/sdd-manager.sh review-deliverable <slug>`).
   - **Bloqueo Mandatorio:** NO se escribe en la carpeta canónica de producción de `Academic Vault/` hasta la confirmación formal del usuario con `bash Academic-Engine/scripts/sdd-manager.sh approve-deliverable <slug>`.
5. **Medición & Cierre:** Registro del entregable en el Vault con metadata inmutable, changelog v1.0 y cierre en `task-manager.sh update`.

## Vault Conventions
- The vault is structured with these core areas under `Academic Vault/`:
  - `Sources/`: PDF Unconverted, PDF Converted, Web Converted, SOURCES_INDEX.md
  - `Reviews/<Project>/`: Thematic syntheses and literature comparisons
  - `Hypotheses/<Project>/`: Testable mechanistic claims
  - `Drafts/<Project>/`: Manuscript sections and thesis chapters
  - `Concepts/`: Global conceptual notes
  - `Projects/<Project>/`: PROJECT_INDEX.md, requirements, manifest, symlink views
  - `Inbox/`: Raw captures, teacher instructions, drafts
  - `Exports/`: Compiled outputs (PDF, DOCX, TEX)
  - `00 System/`: Workflows, templates, agent instructions (references Engine docs)
- Canonical writing lives in `Drafts/<Project>/`, `Reviews/<Project>/`, `Hypotheses/<Project>/`
- `Projects/<Project>/Drafts`, `Reviews`, `Hypotheses` are **symlink views only**
- Prefer descriptive file names
- Keep one note per deliverable
- Save drafts in `Inbox/` when the final destination is unclear

## Obsidian Integration
- The Obsidian vault is `Academic Vault/`
- Local REST API is active on HTTPS port `27124` with Bearer token authentication

## Hybrid Agent Squad (Business + Academic/CS + Development + Optimization)
The workspace includes 17 specialized sub-agents defined in `Academic-Engine/agents/`:

### BRIDS Founder & YC Sub-Agent Squad (6 agents)
| Agent Identifier | Role | Core Mission |
|---|---|---|
| `business-consultant` | Business Model & Unit Economics Architect | Fee architecture, CAC/LTV, 3-5y pro forma projections |
| `market-research-analyst` | Market Research & TAM/SAM/SOM Analyst | Market sizing, competitor benchmarks |
| `pitch-deck-architect` | YC & Sequoia Pitch Deck Architect | 10-12 slide investor decks, `.pptx` generation |
| `compliance-officer` | Legal Structuring & RWA Compliance Officer | Dual-entity separation, KYC/AML, Metaplex Core plugins |
| `b2b-sponsor-lead` | Real Estate Sponsor Acquisition & RevOps | Developer value prop, cold outbound, pilot onboarding |
| `founder-ghostwriter` | Founder Voice & YC Storyteller | YC application essays, X threads, LinkedIn articles |

### Academic, CS & Optimization Squad (7 agents)
| Agent Identifier | Role | Core Mission |
|---|---|---|
| `cs-tutor` | CS & Software Development Tutor | Explain CS concepts, guide exercises, review student code |
| `code-reviewer` | Code Reviewer & Quality Architect | Clean code, SOLID, testing, security, performance reviews |
| `research-librarian` | Academic Research Librarian | PDF/web intake, SOURCES_INDEX.md, metadata enrichment |
| `thesis-writer` | Academic Writer & Report Ghostwriter | Thesis sections, technical reports, APA 7/IEEE |
| `methodology-consultant` | Research Methodology & Statistical Consultant | Survey design, statistical analysis, methodological frameworks |
| `academic-reviewer` | Scientific & Editorial Reviewer (Auditor) | Audit specs and drafts for rigor, coherence, citations, requirements pertinence (>= 8.5/9.0) |
| `task-editor` | Technical Editor & Continuous Quality Optimizer | Reviewer counterpart: non-destructive remediation of specs and drafts until reaching >= 8.5/9.0 |

### Software Engineering & Developer Squad (4 agents)
| Agent Identifier | Role | Core Mission |
|---|---|---|
| `typescript-developer` | TypeScript Application & Type-Safe Architect | Strictly typed TS apps, Zod validation, generics, utility types, ESM builds |
| `rust-developer` | Rust Systems & High-Performance Engineer | Memory-safe systems, Cargo workspaces, high-perf CLI (`clap`), `tokio`, Tauri v2 cross-platform apps |
| `python-developer` | Python Backend & Automation Engineer | Python 3.10+ APIs/CLIs, Ruff/mypy, design patterns, executor, Trail of Bits security |
| `node-developer` | Node.js Runtime & Harness Tooling Engineer | Node.js services, harness CLI automation, process safety, streaming, native tests |

- Definitions: Individual YAML files in `Academic-Engine/agents/*.yaml`
- Verification: `bash Academic-Engine/scripts/inspect-squad.sh`

## Solana Developer MCP Integration (mcp.solana.com)
- **Active Server Identifiers:** `solana-mcp-server` (HTTP) and `solana-mcp-sse` (SSE).
- **Core MCP Tools:** `list_sections`, `get_documentation`, `Solana_Documentation_Search`, `Solana_Expert__Ask_For_Help`, `program_autofixer`.
- **Reference Guide:** `Academic-Engine/docs/solana-mcp-integration.md`
