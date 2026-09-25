---
type: workflow
title: "Class Video Ingest Workflow"
version: "1.0"
status: active
workflow: video-ingest
tags:
  - sena
  - video-ingest
  - workflow
  - clases
---

# Class Video Ingest Workflow

> [!NOTE] Resumen Ejecutivo
> Flujo de trabajo formal y automatizado para la extracción, transcripción local acelerada por hardware (Whisper Large-v3-Turbo en GPU Metal) y catalogación de grabaciones de clases del SENA desde Google Drive hacia `Academic Vault/Clases/`. Define de forma estricta la taxonomía de tres archivos y el orden obligatorio del digest académico con el Plan de Acción como Sección 1 prioritaria.

---

## 1. Arquitectura de Salida (Taxonomía de Tres Archivos)

Cada sesión de clase procesada genera de forma coordinada tres artefactos dentro de `Academic Vault/Clases/<slug>/`:

1. **Digest y Ficha Técnica de la Clase (`<slug>.md`):**
   * Síntesis estructurada, timeline temático con enlaces a transcripción, directrices pedagógicas y recursos relacionados.
   * **REGLA DE ORO DE ARQUITECTURA:** La **Sección 1** es SIEMPRE el `Plan de Acción y Tareas Pendientes para los Aprendices`, ubicada inmediatamente tras el Resumen Ejecutivo (`> [!NOTE]`) y antes del contexto general, garantizando visibilidad inmediata para el estudiante sin necesidad de scroll.
2. **Transcripción Íntegra Verbatim (`<slug>-transcripcion.md`):**
   * Transcripción completa párrafo a párrafo con marcas de tiempo (`**[hh:mm:ss]**`), enlazada bidireccionalmente con el digest.
3. **Respaldo de Texto Plano (`<slug>_transcripcion_raw.txt`):**
   * Texto continuo sin markdown para auditoría o procesamiento de lenguaje natural.

---

## 2. Regla de Oro de Orden Estricto para el Digest

Cualquier digest generado automáticamente o redactado manualmente para una clase DEBE seguir esta secuencia exacta establecida en `Academic-Engine/templates/class-lecture-template.md`:

```text
1. Resumen Ejecutivo (> [!NOTE])
2. ## 1. Plan de Acción y Tareas Pendientes para los Aprendices
3. ## 2. Contexto y Equipo Ejecutor de Formación (o Información General)
4. ## 3. Estructura y Metodología del Proceso Formativo SENA (o Desarrollo Temático)
5. ## 4. Sistema Institucional de Calificación y Criterios de Evaluación
6. ## 5. Ecosistema de Plataformas Digitales / Herramientas Utilizadas
7. ## 6. Canales de Comunicación y Normas de Convivencia
8. ## 7. Cronograma de Sesión y Marcas de Tiempo (Timestamps)
9. ## 8. Recursos y Transcripción Completa
10. ## 9. Historial de Revisiones (Changelog)
```

> [!IMPORTANT] Restricción de Diseño
> Queda terminantemente prohibido colocar el Plan de Acción al final del documento o después de las secciones teóricas. La meta pedagógica es que el aprendiz abra la nota y sepa inmediatamente qué evidencias, tareas y acciones debe realizar.

---

## 3. Subcarpeta de Materiales y Anexos (`Materiales/`)

Para guías de aprendizaje en PDF o diapositivas en PPTX agregadas a la carpeta de la clase:
* Los archivos se analizan y se genera un digest independiente en `Materiales/<slug-material>.md`.
* Los binarios descargados se respaldan en `Materiales/raw/`.
* El digest maestro `<slug-clase>.md` vincula automáticamente los materiales bajo `## 8. Recursos y Transcripción Completa`.

---

## 4. Deduplicación Cero-Redundancia mediante Hashing (MD5 + SHA-256)

El motor implementa una doble barrera criptográfica de deduplicación:
1. **Filtro Pre-Descarga (Drive MD5 Checksum):** Compara el checksum nativo de Google Drive contra el registro inmutable en `.ingested_videos.json`. Si el hash ya existe, se cancela la descarga inmediatamente.
2. **Filtro Post-Descarga (SHA-256):** Para archivos exportados o sin checksum remoto, calcula el hash SHA-256 local y valida contra todos los archivos del repositorio para evitar duplicados aunque tengan nombres diferentes.

---

## 5. Comandos de Ejecución

Para sincronizar e ingerir materiales y videos pendientes desde Google Drive:

```bash
# Ingesta completa con detección de GPU Metal y transcripción
bash Academic-Engine/scripts/ingest-drive-video.sh

# Modo simulación (Dry Run)
bash Academic-Engine/scripts/ingest-drive-video.sh --dry-run
```

---

## 4. Historial de Revisiones

| Versión | Fecha | Autor | Cambios Realizados |
|---|---|---|---|
| `v1.0` | 2026-09-25 | Antigravity (Agent Squad) | Creación inicial del workflow de ingesta de videos SENA, formalizando la regla de orden mandatorio con el plan de acción como sección 1. |
