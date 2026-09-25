import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { CLASES_DIR, ROOT_DIR } from './config';
import { TranscriptionOutput, WhisperSegment } from './whisper';
import { DiscoveredVideo } from './drive';

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Groups whisper segments into chronological thematic blocks (~5-10 minutes each)
 */
function createTimelineBlocks(segments: WhisperSegment[]): Array<{ start: string; text: string }> {
  if (segments.length === 0) return [];

  const blocks: Array<{ start: string; text: string }> = [];
  let currentStart = segments[0].start;
  let currentTexts: string[] = [];

  // Group approximately every 150-200 segments or by timestamp jumps
  const TARGET_SEGMENTS_PER_BLOCK = 180;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    currentTexts.push(seg.text);

    if (currentTexts.length >= TARGET_SEGMENTS_PER_BLOCK || i === segments.length - 1) {
      const summaryText = currentTexts.slice(0, 30).join(' ') + '...';
      blocks.push({
        start: currentStart,
        text: summaryText
      });
      if (i + 1 < segments.length) {
        currentStart = segments[i + 1].start;
      }
      currentTexts = [];
    }
  }

  return blocks;
}

/**
 * Formats full whisper segments into readable chronological paragraphs with timestamps.
 */
function formatFullTranscript(segments: WhisperSegment[]): string {
  if (!segments || segments.length === 0) return '_No hay transcripción disponible._';

  const paragraphs: string[] = [];
  let currentGroup: string[] = [];
  let currentStartTime = '';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!currentStartTime) {
      currentStartTime = (seg.start || '00:00:00').split(',')[0];
    }
    const text = seg.text.trim();
    if (text) {
      currentGroup.push(text);
    }

    const wordCount = currentGroup.join(' ').split(/\s+/).length;
    if (wordCount >= 70 || i === segments.length - 1) {
      if (currentGroup.length > 0) {
        paragraphs.push(`**[${currentStartTime}]** ${currentGroup.join(' ')}`);
      }
      currentGroup = [];
      currentStartTime = '';
    }
  }

  return paragraphs.join('\n\n');
}

/**
 * Generates an academic Markdown note directly into Academic Vault/Clases/<slug>/<slug>.md
 */
export function generateClassMarkdown(
  data: TranscriptionOutput,
  video: DiscoveredVideo,
  forceRegenerate: boolean = false
): string {
  const baseName = video.name.replace(/\.[^/.]+$/, '');
  const cleanTitle = `${video.classFolderName}: ${baseName.replace(/^Copy of /i, '').replace(/_/g, ' ')}`;
  const slug = slugify(`${video.classFolderName}-${baseName.replace(/^Copy of /i, '')}`);

  const targetDir = path.join(CLASES_DIR, slug);
  fs.mkdirSync(targetDir, { recursive: true });

  const targetFile = path.join(targetDir, `${slug}.md`);

  // If already manually edited with higher version, preserve it unless forced
  if (!forceRegenerate && fs.existsSync(targetFile)) {
    const existing = fs.readFileSync(targetFile, 'utf8');
    if (existing.includes('version: "1.') || existing.includes('version: 1.')) {
      console.log(`[Markdown] La nota ya existe en: ${targetFile}`);
      return targetFile;
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const url = video.webViewLink || `https://drive.google.com/file/d/${video.id}/view`;

  const timeline = createTimelineBlocks(data.segments);
  const fullTranscript = formatFullTranscript(data.segments);

  // 1. Digest / Study Note File (<slug>.md)
  // ARCHITECTURAL RULE: Section 1 MUST ALWAYS be the Action Plan ("## 1. Plan de Acción y Tareas Pendientes para los Aprendices")
  // positioned immediately after the Executive Summary (> [!NOTE]) and BEFORE Context/General Information.
  // This ensures learners see their immediate commitments upfront without scrolling.
  const digestContent = `---
type: source
kind: video
title: "${cleanTitle}"
authors: ["Equipo Instructor SENA"]
year: ${currentYear}
date_ingested: ${today}
session_date: ${today}
source_url: "${url}"
drive_file_id: "${video.id}"
program: "Análisis y Desarrollo de Software (ADSO) / Sistemas"
status: converted
version: "1.0"
workflow: video-ingest
tags:
  - sena
  - formacion-virtual
  - ${slugify(video.classFolderName)}
---

# ${cleanTitle}

> [!NOTE] Resumen Ejecutivo
> Sesión de clase grabada correspondiente a **${video.classFolderName}** (${cleanTitle}), impartida por el equipo de formación del SENA. Este documento contiene la ficha general, estructuración temática, marcas de tiempo navegables, directrices pedagógicas y compromisos académicos de la sesión.

---

## 1. Plan de Acción y Tareas Pendientes para los Aprendices

> [!IMPORTANT] Acciones Prioritarias Inmediatas
> Tareas obligatorias y compromisos derivados de la sesión para desarrollar y verificar en plataforma:

- [ ] Revisar el material complementario y guías asociadas en la plataforma **Zajuna**.
- [ ] Desarrollar y entregar las evidencias solicitadas para este bloque temático en las fechas estipuladas.
- [ ] Plantear cualquier duda técnica en el **Foro de Dudas e Inquietudes** oficial.
- [ ] Consultar la grabación y marcas de tiempo para repasar demostraciones técnicas.

---

## 2. Información General de la Sesión

* **Módulo / Carpeta:** ${video.classFolderName}
* **Archivo Original:** \`${video.name}\`
* **ID en Google Drive:** \`${video.id}\`
* **Enlace de Reproducción:** [Ver video en Google Drive](${url})
* **Fecha de Ingesta:** ${today}

---

## 3. Cronograma de Sesión y Marcas de Tiempo

| Marca de Tiempo | Bloque Temático / Discusión en Clase |
|---|---|
${timeline.map(b => `| \`${b.start}\` | ${b.text.replace(/\|/g, '-')} |`).join('\n')}

---

## 4. Síntesis y Puntos Clave

${data.fullText ? data.fullText.slice(0, 1500) + '...' : 'Revisar transcripción completa para detalles específicos.'}

---

## 5. Recursos y Documentos Relacionados

* 📄 **Transcripción Íntegra:** [[${slug}-transcripcion|Ver Transcripción Completa con Marcas de Tiempo]]
* 📄 **Texto Plano:** \`${slug}_transcripcion_raw.txt\`
* 👥 **Equipo Docente:** [[Profesores/PROFESORES_INDEX|Consultar Fichas de Instructores]]

---

## 6. Historial de Revisiones

| Versión | Fecha | Autor | Cambios Realizados |
|---|---|---|---|
| \`v1.0\` | ${today} | Sistema de Ingesta Automática (Whisper GPU) | Generación automática del digest académico con plan de acción prioritario al inicio y enlaces a transcripción. |
`;

  // 2. Full Transcript File (<slug>-transcripcion.md)
  const transcriptFile = path.join(targetDir, `${slug}-transcripcion.md`);
  const transcriptContent = `---
type: source
kind: transcript
title: "Transcripción: ${cleanTitle}"
authors: ["Equipo Instructor SENA"]
year: ${currentYear}
date_ingested: ${today}
session_date: ${today}
source_url: "${url}"
drive_file_id: "${video.id}"
class_note: "[[${slug}]]"
status: converted
version: "1.0"
workflow: video-ingest
tags:
  - sena
  - transcripcion
  - formacion-virtual
  - ${slugify(video.classFolderName)}
---

# Transcripción: ${cleanTitle}

> [!NOTE] Resumen Ejecutivo
> Registro literal e íntegro de la sesión grabada correspondiente a **${video.classFolderName}** (${cleanTitle}). Contiene la totalidad de los diálogos organizados cronológicamente con marcas de tiempo navegables para consulta rápida con \`Ctrl+F\` o \`Cmd+F\`.

> [!TIP] Navegación Rápida
> * 🔗 [[${slug}|← Volver a la Nota y Digest de la Clase]]
> * 👥 [[Profesores/PROFESORES_INDEX|Directorio de Profesores SENA]]

---

## Transcripción Cronológica

${fullTranscript}

---

## Historial de Revisiones

| Versión | Fecha | Autor | Cambios Realizados |
|---|---|---|---|
| \`v1.0\` | ${today} | Sistema de Ingesta Automática (Whisper GPU) | Transcripción completa generada localmente con Whisper Metal GPU. |
`;

  // Write files
  fs.writeFileSync(targetFile, digestContent, 'utf8');
  fs.writeFileSync(transcriptFile, transcriptContent, 'utf8');

  // Also save raw text transcript alongside for direct copy or downstream tooling
  const rawTextFile = path.join(targetDir, `${slug}_transcripcion_raw.txt`);
  fs.writeFileSync(rawTextFile, data.fullText, 'utf8');

  console.log(`[Markdown] ✓ Digest académico generado en: ${targetFile}`);
  console.log(`[Markdown] ✓ Transcripción completa generada en: ${transcriptFile}`);
  console.log(`[Markdown] ✓ Transcripción en texto plano guardada en: ${rawTextFile}`);

  // Re-sync SOURCES_INDEX.md
  try {
    const syncScript = path.join(ROOT_DIR, 'Academic-Engine', 'scripts', 'sync-sources-index.sh');
    if (fs.existsSync(syncScript)) {
      execSync(`bash "${syncScript}"`, { stdio: 'ignore' });
      console.log(`[Markdown] ✓ SOURCES_INDEX.md sincronizado con éxito.`);
    }
  } catch (err) {
    console.warn(`[Markdown] Aviso: no se pudo ejecutar sync-sources-index.sh automáticamente.`);
  }

  return targetFile;
}
