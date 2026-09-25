---
type: profile
kind: student
name: "Jeison Julián Sosa Rodríguez"
document: "C.C. 1014182421"
program: "Técnico en Programación de Software"
program_code: "233104"
ficha: "3607701"
lms_code: "P_233104_V_3607701_R_17_C_9219"
level: "Técnico"
regional: "Caldas (R_17)"
center: "Centro de Automatización Industrial (C_9219)"
modality: "Virtual 100%"
city: "Bogotá, Bogotá D.C."
email_personal: "jeisonjsosar@gmail.com"
email_sena: "jeison.julian.sosa.rodriguez.8333162@soy.sena.edu.co"
status: active
version: "1.2"
workflow: student-profile
last_updated: 2026-09-25
tags:
  - sena
  - aprendiz
  - ficha-aprendiz
  - programacion-software
  - ficha-3607701
  - caldas
---

# Ficha Maestra del Aprendiz: Jeison Julián Sosa Rodríguez

> [!NOTE] Resumen Ejecutivo
> Registro canónico de identidad y datos formativos del aprendiz **Jeison Julián Sosa Rodríguez**. Este documento centraliza la información personal, institucional y técnica verificada para autocompletar portadas, encabezados, metadatos YAML y secciones de autoría en todas las evidencias de aprendizaje (conocimiento, desempeño y producto), informes de laboratorio, proyectos de software y guías del **SENA (Ficha 3607701)**.

---

## 1. Identificación y Datos Personales

| Campo | Valor Registrado | Estado |
|---|---|---|
| **Nombre Completo** | **Jeison Julián Sosa Rodríguez** | ✅ Confirmado |
| **Tipo de Documento** | Cédula de Ciudadanía (C.C.) | ✅ Confirmado |
| **Número de Documento** | **1014182421** | ✅ Confirmado |
| **Correo Personal** | `jeisonjsosar@gmail.com` | ✅ Confirmado |
| **Correo Institucional SENA (User ID)** | `jeison.julian.sosa.rodriguez.8333162@soy.sena.edu.co` | ✅ Confirmado |
| **Teléfono / Móvil** | **+57 3028422233** | ✅ Confirmado |
| **Ciudad de Residencia** | **Bogotá** | ✅ Confirmado |
| **Departamento / Distrito** | **Bogotá D.C., Colombia** | ✅ Confirmado |

---

## 2. Datos Institucionales y Académicos SENA

| Parámetro Institucional | Detalle Oficial |
|---|---|
| **Entidad Educativa** | Servicio Nacional de Aprendizaje (SENA) - Colombia |
| **Programa de Formación** | **Técnico en Programación de Software** |
| **Código del Programa** | **233104** |
| **Nivel de Formación** | **Técnico** |
| **Número de Ficha de Caracterización** | **3607701** |
| **Código de Curso Oficial LMS (Zajuna)** | **`P_233104_V_3607701_R_17_C_9219`** |
| **Regional Asignada** | **Regional Caldas (Regional 17)** |
| **Centro de Formación** | **Centro de Automatización Industrial (Centro 9219)** |
| **Modalidad de Estudio** | 100% Virtual |
| **Plataformas Oficiales** | Zajuna LMS & SENA Sofia Plus |
| **Fase Formativa Actual** | Fase de Inducción |

---

## 3. Equipo Docente y Vocería de la Ficha

- **Instructora Vocera y Tutora Técnica Líder:** [[Profesores/paola-andrea-ocampo-ayala|Paola Andrea Ocampo Ayala]]
  - *Áreas:* Inducción, mediación virtual, plataforma Zajuna, seguimiento académico general.
- **Instructor Especialista en Programación de Software:** [[Profesores/fernando-lopez-trujillo|Fernando López Trujillo]]
  - *Áreas:* Especialista a cargo de la ficha de **Programación de Software**, algoritmia, lógica, desarrollo web y proyectos de software.

---

## 4. Perfil Técnico y Entorno de Desarrollo

- **Rol Formativo:** Aprendiz SENA en Programación de Software
- **Perfil de GitHub:** [https://github.com/jeisonsosablockdev](https://github.com/jeisonsosablockdev) (`jeisonsosablockdev`)
- **Entorno de Trabajo Local:** macOS / Unix & Windows PowerShell
- **Editores e IDEs:** Visual Studio Code, Obsidian
- **Control de Versiones:** Git / GitHub con commits semánticos y trazabilidad
- **Stack Tecnológico:** Python, JavaScript / TypeScript, Node.js, SQL (MySQL / PostgreSQL), HTML5 / CSS3, Docker, Markdown / LaTeX

---

## 5. Plantilla Maestra: Portada Institucional SENA (Para Evidencias e Informes)

El siguiente bloque es el formato estándar institucional que el sistema inyecta en los entregables finales:

```markdown
---
# SERVICIO NACIONAL DE APRENDIZAJE — SENA
### REGIONAL CALDAS — CENTRO DE AUTOMATIZACIÓN INDUSTRIAL
**PROGRAMA:** Técnico en Programación de Software (Código: 233104)  
**FICHA DE CARACTERIZACIÓN:** 3607701  

---

### EVIDENCIA DE APRENDIZAJE: {{TITULO_DE_LA_EVIDENCIA}}
**CÓDIGO DE GUÍA / ACTIVIDAD:** {{CODIGO_EVIDENCIA}}

**APRENDIZ:**  
Jeison Julián Sosa Rodríguez  
Documento de Identidad: C.C. 1014182421  
Correo Electrónico: jeison.julian.sosa.rodriguez.8333162@soy.sena.edu.co / jeisonjsosar@gmail.com  
Teléfono de Contacto: +57 3028422233  
Repositorio GitHub: https://github.com/jeisonsosablockdev  

**EQUIPO DOCENTE / INSTRUCTORES:**  
- Instructora Paola Andrea Ocampo Ayala (Tutora Líder y Vocera)  
- Instructor Fernando López Trujillo (Especialista en Programación de Software)  

**CIUDAD Y FECHA DE ENTREGA:**  
Bogotá D.C., Colombia — 2026  
---
```

---

## 6. Plantilla Maestra: Encabezado Compacto (Para Guías, Talleres y Foros)

Para respuestas cortas, foros y wikis técnicas:

```markdown
> [!NOTE] Metadatos del Aprendiz
> **Aprendiz:** Jeison Julián Sosa Rodríguez | **Documento:** C.C. 1014182421  
> **Programa:** Técnico en Programación de Software | **Ficha:** 3607701  
> **Regional:** Regional Caldas — Centro de Automatización Industrial | **Fecha:** 2026-09-25  
```

---

## 7. Automatización del Robot de Tareas

Esta ficha interactúa automáticamente con los motores del workspace:
1. **Scaffolding de Proyectos:** `bash Academic-Engine/scripts/new-project.sh "<Nombre>"` toma a **Jeison Julián Sosa Rodríguez** como autor inmutable en el `PROJECT_INDEX.md` y `EXPORT_MANIFEST.md`.
2. **Motor SDD (Spec-Driven Development):** Los agentes `task-editor`, `thesis-writer` y `cs-tutor` consultan `Academic-Engine/context/aprendiz-profile.json` para precargar los datos del aprendiz en cualquier spec o entregable generado.
3. **Exportación a PDF / LaTeX:** Al compilar mediante `bash Academic-Engine/scripts/export-pdf.sh`, los metadatos de autoría y créditos reflejan la identidad oficial de Jeison Julián Sosa Rodríguez.

---

## Historial de Revisiones

| Versión | Fecha | Autor | Cambios Realizados |
|---|---|---|---|
| `v1.0` | 2026-09-25 | Robot de Tareas (Academic-Engine) | Creación inicial de la Ficha Maestra con identidad preliminar. |
| `v1.1` | 2026-09-25 | Jeison Julián Sosa Rodríguez | Registro completo de C.C. 1014182421, celular, correo, GitHub, nivel Técnico y confirmación de la Ficha 3607701 (LMS: `P_233104_V_3607701_R_17_C_9219`). |
| `v1.2` | 2026-09-25 | Jeison Julián Sosa Rodríguez | Registro y validación del correo institucional oficial SENA (User ID: `jeison.julian.sosa.rodriguez.8333162@soy.sena.edu.co`). |
