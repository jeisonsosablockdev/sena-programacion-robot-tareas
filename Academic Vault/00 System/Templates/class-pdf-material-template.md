---
type: source
kind: pdf
title: "{{titulo_material_pdf}}"
authors: ["{{autor_instructor_o_institucion}}"]
year: {{año}}
date_ingested: {{fecha_ingesta}}
source_url: "{{url_google_drive}}"
drive_file_id: "{{id_google_drive}}"
file_hash: "{{hash_sha256}}"
program: "Análisis y Desarrollo de Software (ADSO) / Programas de Sistemas"
status: converted
version: "1.0"
workflow: pdf-ingest
tags:
  - sena
  - formacion-virtual
  - material-clase
  - guia-aprendizaje
  - {{etiqueta_modulo}}
---

# {{titulo_material_pdf}}

> [!NOTE] Resumen Ejecutivo
> Documento formativo oficial correspondiente a **{{modulo_o_clase}}** (\`{{nombre_archivo_original}}\`). Este digest técnico condensa las competencias, resultados de aprendizaje (RAP), instrucciones prácticas, entregables evaluables y criterios de aprobación del material original ({{total_paginas}} páginas).

> [!IMPORTANT] REGLA DE ARQUITECTURA: ORDEN ESTRICTO OBLIGATORIO
> **ORDEN MANDATORIO DEL DOCUMENTO:**
> 1. **Resumen Ejecutivo / Introducción** (\`> [!NOTE]\`)
> 2. **## 1. Plan de Acción y Evidencias Solicitadas** (Compromisos y checklist de entrega)
> 3. **## 2. Información General del Documento** (Metadatos, páginas y Hash SHA-256)
> 4. **## 3. Competencias y Resultados de Aprendizaje (RAP)**
> 5. **## 4. Síntesis y Desarrollo de Contenidos**
> 6. **## 5. Recursos y Ficha de Clase Asociada**
> 7. **## 6. Historial de Revisiones (Changelog)**
>
> ⛔ **PROHIBIDO:** Colocar el Plan de Acción al final de la nota. El aprendiz debe identificar las evidencias a entregar inmediatamente al abrir el documento.

---

## 1. Plan de Acción y Evidencias Solicitadas

> [!IMPORTANT] Acciones Prioritarias Inmediatas
> Evidencias requeridas en el documento para desarrollo y carga en plataforma Zajuna:

- [ ] **Evidencia 1 (Conocimiento / Desempeño / Producto):** {{descripcion_evidencia_1}}
- [ ] **Evidencia 2:** {{descripcion_evidencia_2}}
- [ ] **Plazo de Entrega:** Verificar cronograma oficial en Zajuna.
- [ ] **Criterio de Aprobación:** Calificación A (Aprobado >= 70%).

---

## 2. Información General del Documento

* **Módulo / Ficha:** {{nombre_modulo}}
* **Archivo Original:** \`{{nombre_archivo_original}}\`
* **Total de Páginas:** {{total_paginas}}
* **Hash de Integridad (SHA-256):** \`{{hash_sha256}}\`
* **ID en Google Drive:** \`{{id_google_drive}}\`
* **Enlace Drive:** [Ver documento en Google Drive]({{url_google_drive}})

---

## 3. Competencias y Resultados de Aprendizaje (RAP)

* **Competencia:** {{nombre_competencia}}
* **Resultado de Aprendizaje (RAP):** {{nombre_rap}}

---

## 4. Síntesis y Desarrollo de Contenidos

{{resumen_estructurado_de_contenidos}}

---

## 5. Recursos y Ficha de Clase Asociada

* 🎓 **Clase Principal:** [[../{{slug_clase}}|← Volver a la Ficha y Digest de la Clase]]
* 👥 **Equipo Docente:** [[Profesores/00. PROFESORES_INDEX|Directorio de Profesores SENA]]

---

## 6. Historial de Revisiones

| Versión | Fecha | Autor | Cambios Realizados |
|---|---|---|---|
| \`v1.0\` | {{fecha_creacion}} | Motor de Ingesta SENA (PDF Parser) | Digest automático con extracción de evidencias prioritarias en Sección 1 y validación de hash SHA-256. |
