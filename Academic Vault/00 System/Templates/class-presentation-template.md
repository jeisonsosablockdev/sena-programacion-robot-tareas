---
type: source
kind: presentation
title: "{{titulo_presentacion}}"
authors: ["{{autor_instructor}}"]
year: {{año}}
date_ingested: {{fecha_ingesta}}
source_url: "{{url_google_drive}}"
drive_file_id: "{{id_google_drive}}"
file_hash: "{{hash_sha256}}"
program: "Análisis y Desarrollo de Software (ADSO) / Programas de Sistemas"
status: converted
version: "1.0"
workflow: presentation-ingest
tags:
  - sena
  - formacion-virtual
  - material-clase
  - diapositivas
  - {{etiqueta_modulo}}
---

# {{titulo_presentacion}}

> [!NOTE] Resumen Ejecutivo
> Material visual de apoyo formativo correspondiente a **{{modulo_o_clase}}** (\`{{nombre_archivo_original}}\`). Sintetiza el contenido teórico, esquemas arquitectónicos, notas del instructor y conclusiones de las {{total_diapositivas}} diapositivas de la sesión.

> [!IMPORTANT] REGLA DE ARQUITECTURA: ORDEN ESTRICTO OBLIGATORIO
> **ORDEN MANDATORIO DEL DOCUMENTO:**
> 1. **Resumen Ejecutivo / Introducción** (\`> [!NOTE]\`)
> 2. **## 1. Plan de Acción y Conclusiones Clave de la Sesión** (Puntos de acción derivados)
> 3. **## 2. Información General de la Presentación** (Metadatos, láminas y Hash SHA-256)
> 4. **## 3. Desglose Diapositiva por Diapositiva** (Láminas y notas del instructor)
> 5. **## 4. Recursos y Ficha de Clase Asociada**
> 6. **## 5. Historial de Revisiones (Changelog)**
>
> ⛔ **PROHIBIDO:** Colocar el Plan de Acción al final de la nota.

---

## 1. Plan de Acción y Conclusiones Clave de la Sesión

> [!IMPORTANT] Acciones y Puntos Clave
> Conclusiones y compromisos formativos destacados en las diapositivas:

- [ ] **Estudio Conceptual:** Repasar los conceptos y esquemas explicados en las diapositivas.
- [ ] **Alineación con la Guía:** Contrastar las directrices de la presentación con la Guía de Aprendizaje.
- [ ] **Aplicación Práctica:** Implementar los lineamientos técnicos en el código o taller de la semana.

---

## 2. Información General de la Presentación

* **Módulo / Carpeta:** {{nombre_modulo}}
* **Archivo Original:** \`{{nombre_archivo_original}}\`
* **Total de Diapositivas:** {{total_diapositivas}}
* **Hash de Integridad (SHA-256):** \`{{hash_sha256}}\`
* **ID en Google Drive:** \`{{id_google_drive}}\`
* **Enlace Drive:** [Ver presentación en Google Drive]({{url_google_drive}})

---

## 3. Desglose Diapositiva por Diapositiva

### Diapositiva 1: {{titulo_slide_1}}
* {{viñeta_1}}
* {{viñeta_2}}

> [!NOTE] Notas del Instructor
> {{notas_del_instructor_slide_1}}

---

## 4. Recursos y Ficha de Clase Asociada

* 🎓 **Clase Principal:** [[../{{slug_clase}}|← Volver a la Ficha y Digest de la Clase]]
* 👥 **Equipo Docente:** [[Profesores/00. PROFESORES_INDEX|Directorio de Profesores SENA]]

---

## 5. Historial de Revisiones

| Versión | Fecha | Autor | Cambios Realizados |
|---|---|---|---|
| \`v1.0\` | {{fecha_creacion}} | Motor de Ingesta SENA (PPTX Parser) | Extracción de diapositivas y notas del orador, plan de acción inicial y hash SHA-256. |
