# Academic-Engine Sub-Agent Squads

This directory houses the autonomous YAML definitions, system prompts, capability configurations, and skill assignments for the sub-agents within the **Academic-Engine**.

Each sub-agent lives as an individual, self-contained YAML file containing metadata, permissions, assigned skills, output destinations, and its full directive system prompt.

---

## The 13 Sub-Agents

### BRIDS Founder & YC Sub-Agent Squad (6 agents)

| Agent Identifier | YAML Definition | Role | Core Focus |
|---|---|---|---|
| `business-consultant` | [`business-consultant.yaml`](business-consultant.yaml) | Business Model & Unit Economics Architect | Monetization tiers, fee architecture (SaaS, processing, recovery), unit economics (CAC/LTV), 3-5y pro forma projections. |
| `market-research-analyst` | [`market-research-analyst.yaml`](market-research-analyst.yaml) | Market Research & TAM/SAM/SOM Analyst | Top-down & bottom-up TAM/SAM/SOM sizing, real-time web research, competitive benchmarks (Lofty, RealT, HoneyBricks, Blocksquare). |
| `pitch-deck-architect` | [`pitch-deck-architect.yaml`](pitch-deck-architect.yaml) | YC & Sequoia Pitch Deck Architect | 10-12 slide YC/Sequoia narrative decks, automated native `.pptx` generation via `python-pptx`, slide scripts. |
| `compliance-officer` | [`compliance-officer.yaml`](compliance-officer.yaml) | Legal Structuring & RWA Compliance Officer | Dual-entity separation (Delaware C-Corp vs Sponsor SPV LLCs), non-broker-dealer status, Stripe Identity KYC/AML, Metaplex Core Freeze/Recovery plugins, Data Room preparation. |
| `b2b-sponsor-lead` | [`b2b-sponsor-lead.yaml`](b2b-sponsor-lead.yaml) | Real Estate Sponsor Acquisition & RevOps | B2B developer value proposition, institutional one-pagers, cold outbound email sequences, pilot onboarding pipeline. |
| `founder-ghostwriter` | [`founder-ghostwriter.yaml`](founder-ghostwriter.yaml) | Founder Voice, Thought Leadership & YC Storyteller | Founder essays for YC application ("Why now?", "Unique insight"), X/Twitter threads on Solana RWA, LinkedIn articles, monthly investor updates. |

### Academic, CS & Optimization Squad (7 agents)

| Agent Identifier | YAML Definition | Role | Core Focus |
|---|---|---|---|
| `cs-tutor` | [`cs-tutor.yaml`](cs-tutor.yaml) | CS & Software Development Tutor | Explain CS concepts, guide practical exercises, review student code, create study guides. |
| `code-reviewer` | [`code-reviewer.yaml`](code-reviewer.yaml) | Code Reviewer & Quality Architect | Review code for clean code principles, SOLID, testing, security, performance. |
| `research-librarian` | [`research-librarian.yaml`](research-librarian.yaml) | Academic Research Librarian & Source Intake Specialist | Convert PDFs/URLs to structured Markdown, manage SOURCES_INDEX.md, validate provenance. |
| `thesis-writer` | [`thesis-writer.yaml`](thesis-writer.yaml) | Academic Writer & Technical Report Ghostwriter | Draft thesis sections, technical reports, and academic documents with rigor and formal tone. |
| `methodology-consultant` | [`methodology-consultant.yaml`](methodology-consultant.yaml) | Research Methodology & Statistical Consultant | Design research instruments, statistical analysis, methodological frameworks, process diagrams. |
| `academic-reviewer` | [`academic-reviewer.yaml`](academic-reviewer.yaml) | Scientific & Editorial Reviewer (Auditor) | Audit specs and drafts for rigor, coherence, requirements pertinence, and zero clichés. Scores across 4 dimensions (0-9, threshold >= 8.5). |
| `task-editor` | [`task-editor.yaml`](task-editor.yaml) | Technical Editor & Continuous Quality Optimizer (Editor Counterpart) | Remediation and optimization counterpart to the reviewers. Ingests criticism reports, applies non-destructive fixes, and drives iterations to >= 8.5/9.0. |

---

## Autonomous Evaluator-Optimizer Synergy
The workspace pairs **Revisores** (`academic-reviewer`, `code-reviewer`) with **Editores** (`task-editor`, `thesis-writer`) to execute autonomous quality loops:
1. **Spec Loop:** `task-editor` scaffolds and refines specs $\leftrightarrow$ `academic-reviewer` audits requirements pertinence until $\ge 8.5/9.0$ before HITL-1.
2. **Task Execution Loop:** Creador/Editor drafts deliverable $\leftrightarrow$ Revisor audits rigor, pertinence, and standards until $\ge 8.5/9.0$ before HITL-2.

---

## Verification
To inspect and validate all configured sub-agents:
```bash
bash Academic-Engine/scripts/inspect-squad.sh
```
