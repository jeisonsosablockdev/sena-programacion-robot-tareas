# Class Ingest Workflow (Whisper GPU + Drive)

This document specifies the pipeline for ingesting SENA class recordings from Google Drive into `Academic Vault/Clases/`.

## Architecture & Deliverables

Each ingested session yields three coordinated artifacts in `Academic Vault/Clases/<slug>/`:

1. `<slug>.md`: Class digest and study note.
2. `<slug>-transcripcion.md`: Full verbatim transcript with timestamps.
3. `<slug>_transcripcion_raw.txt`: Plain text transcript backup.

## Mandatory Digest Section Order

Per user requirement and system governance, all class digest notes MUST adhere to this strict structure defined in `Academic-Engine/templates/class-lecture-template.md`:

1. **Executive Summary Callout (`> [!NOTE]`)**
2. **`## 1. Plan de Acción y Tareas Pendientes para los Aprendices`**: Immediate actionable commitments and evidence checklist for the student.
3. **`## 2. Contexto y Equipo Ejecutor de Formación`**: General session metadata, program, instructors involved.
4. **`## 3. Estructura y Metodología del Proceso Formativo SENA`**: Core thematic and pedagogical explanation.
5. **`## 4. Sistema Institucional de Calificación y Criterios de Evaluación`**: Grading policies, A/D scale, desertion warnings.
6. **`## 5. Ecosistema de Plataformas Digitales`**: LMS Zajuna, Sofia Plus, and technical tools.
7. **`## 6. Canales de Comunicación y Normas de Convivencia`**: Official vs unofficial communication rules.
8. **`## 7. Cronograma de Sesión y Marcas de Tiempo (Timestamps)`**: Chronological topic timeline.
9. **`## 8. Recursos y Transcripción Completa`**: Links to full transcript, text backup, and instructor dossiers.
10. **`## 9. Historial de Revisiones`**: Audit changelog.

> **CRITICAL RULE:** Never place the Action Plan at the bottom of the digest. The learner must see pending actions and homework upfront upon opening the note.
