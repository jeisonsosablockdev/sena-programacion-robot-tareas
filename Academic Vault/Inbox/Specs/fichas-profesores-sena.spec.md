---
spec_id: "SPEC-fichas-profesores-sena"
title: "Fichas Académicas de Instructores SENA ADSO"
target_vault_folder: "Academic Vault/Profesores/"
target_file: "Academic Vault/Profesores/PROFESORES_INDEX.md"
subagents_involved:
  - "cs-tutor"
  - "academic-reviewer"
status: completed
created_at: "2026-09-25"
updated_at: "2026-09-25"
hitl_checkpoints:
  hitl_1_spec_approval:
    status: approved
    approved_at: "2026-09-25T15:08:27.012Z"
    user_feedback: []
  hitl_2_deliverable_approval:
    status: approved
    approved_at: "2026-09-25T15:09:18.877Z"
    user_feedback: []
evaluation:
  target_score: 8.5
  scale_max: 9.0
  max_cycles: 5
  current_cycle: 2
  final_score: 9.0
  criticism_history: []
---

# Spec: Fichas Académicas de Instructores SENA ADSO

> [!NOTE] Resumen Ejecutivo
> Dossier y fichas de perfil académico/profesional de los instructores y profesores del programa ADSO y Sistemas en el SENA.
> Este artefacto define de manera formal los requisitos, campos de información requeridos (nombre, descripción, formación académica, trayectoria y qué ha hecho), verificados directamente contra las grabaciones y transcripciones de clase en `Academic Vault/Clases/`.
> Cuenta con dos puntos de parada humana obligatorios: **HITL-1 (Aprobación del Spec)** y **HITL-2 (Aprobación del Entregable)**.

---

## 1. Destino Canónico en el Vault
- **Carpeta de Destino:** `Academic Vault/Profesores/`
- **Archivos de Salida:**
  - `Academic Vault/Profesores/PROFESORES_INDEX.md` (Directorio maestro)
  - `Academic Vault/Profesores/paola-andrea-ocampo-ayala.md` (Ficha individual)
  - `Academic Vault/Profesores/fernando-lopez-trujillo.md` (Ficha individual)
- **Taxonomía:** Cumple con la taxonomía oficial de la bóveda Obsidian (`ALLOWED_TOP_FOLDERS`).
- **Regla de Promoción:** Cada ficha se almacena de forma modular e individual, cumpliendo el principio de una nota por entregable y vinculadas mediante enlaces bidireccionales.

---

## 2. Sub-Agentes Asignados y Roles
| Sub-Agente | Rol Asignado | Responsabilidad Principal |
| :--- | :--- | :--- |
| `cs-tutor` | Creador / Editor Líder | Extracción, redacción y estructuración pedagógica de las fichas de los instructores. |
| `academic-reviewer` | Auditor de Rigor y Veracidad | Verificación de fidelidad con las transcripciones de clase y cumplimiento anti-clichés ($\ge 8.5/9.0$). |

---

## 3. Propósito y Audiencia
- **Objetivo:** Disponer de una base de conocimiento clara, estructurada y navegable sobre los instructores asignados a la formación, su perfil, experiencia, rol pedagógico y áreas de especialidad técnica.
- **Público Objetivo (ICP):** Aprendices del tecnólogo ADSO y programas de sistemas del SENA.
- **Campos Mandatorios por Profesor:**
  1. Nombre Completo y Cargo Institucional (Regional, Centro, Fichas).
  2. Perfil y Descripción Profesional.
  3. Formación Académica (Pregrados, Maestrías, Doctorados).
  4. Experiencia y Qué ha hecho (Trayectoria laboral, años en el SENA, roles clave).
  5. Asignaturas / Componentes Técnicos que lidera (Backend, Frontend, Algoritmos, Inducción, Proyectos).
  6. Canales de Contacto Oficiales y Lineamientos de Comunicación (Zajuna, Correo, Foros).

---

## 4. Anclas Técnicas y Veracidad de Fuentes (Zero-Hallucination)
Toda la información biográfica y técnica proviene exclusivamente de declaraciones verificables en las fuentes del Vault:
- **Fuente Principal:** `Academic Vault/Clases/clase-1-induccion-aprendices-inicio-de-formacion-virtual-10-04-26/clase-1-induccion-aprendices-inicio-de-formacion-virtual-10-04-26.md`
- **Instructores Registrados:**
  - **Paola Andrea Ocampo Ayala:** Ingeniera de Sistemas y Telecomunicaciones, Magíster en Proyectos Educativos Mediados por TIC, Candidata a Doctorado en Informática con énfasis en Inteligencia Artificial. Tutora y vocera de fichas ADSO. Regional Caldas - Centro de Automatización Industrial (Manizales).
  - **Fernando López Trujillo:** Ingeniero de Sistemas, Magíster en Gestión y Desarrollo de Proyectos de Software. Más de 15 años de trayectoria en el SENA en grupos de ADSO/programación. Especialista en algoritmos, frontend, backend y proyectos.

---

## 5. Desglose Estructural (Outline)
1. **Título & Frontmatter Estándar:** Con metadatos versionados (`version: "1.0"`), `status: completed`, `workflow: instructor-profile`, tags y callout `> [!NOTE]`.
2. **Información General y Ubicación Institucional:** Regional Caldas, Centro de Automatización Industrial, modalidad 100% virtual.
3. **Perfil y Descripción Profesional:** Contexto y competencias clave.
4. **Formación Académica Verificada:** Tabla con pregrados, posgrados y doctorados.
5. **Trayectoria y Qué ha Hecho en el SENA:** Logros y experiencia docente comprobada.
6. **Responsabilidades Formativas y Módulos a Cargo:** Fases y componentes asignados.
7. **Protocolo Oficial de Comunicación y Canales de Atención:** Directrices de contacto en Zajuna/correo.
8. **Sesiones y Clases Vinculadas:** Enlaces bidireccionales `[[...]]`.
9. **Historial de Revisiones (Changelog v1.0).**

---

## 6. Rúbrica de Calificación del Revisor (Escala 0 a 9)
| Dimensión | Puntos Máx | Criterio de Pase |
| :--- | :---: | :--- |
| **1. Pertinencia con Requisitos & Objetivo** | 2.5 pts | Cobertura total de los campos pedidos (quiénes son, nombre, descripción, qué ha hecho). |
| **2. Fidelidad a Fuentes & Veracidad** | 2.5 pts | Extracción rigurosa sin alucinaciones desde las transcripciones de clase en el Vault. |
| **3. Claridad, Coherencia & Estructura** | 2.0 pts | Jerarquía visual limpia, tablas Markdown y formato modular individual. |
| **4. Originalidad Léxica & Cero Clichés** | 2.0 pts | Prosa directa sin rodeos corporativos ni frases prefabricadas de LLMs. |
| **TOTAL MÁXIMO** | **9.0 pts** | **Nota mínima requerida para aprobación: $\ge 8.5 / 9.0$** |

---

## 7. Criterios de Aceptación Verificables
- [x] Cada profesor cuenta con su propia ficha individualizada en `Academic Vault/Profesores/`.
- [x] Existe un directorio maestro `PROFESORES_INDEX.md` con enlaces cruzados.
- [x] Todos los datos biográficos coinciden con las transcripciones registradas.
- [x] Frontmatter YAML estricto, callout `> [!NOTE]` y tabla de Changelog `v1.0`.
- [x] Calificación de auditoría del revisor $\ge 8.5 / 9.0$.