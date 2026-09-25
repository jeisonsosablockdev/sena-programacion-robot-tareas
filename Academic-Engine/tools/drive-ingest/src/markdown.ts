import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { CLASES_DIR, ROOT_DIR } from './config';
import { TranscriptionOutput, WhisperSegment } from './whisper';
import { DiscoveredDriveItem } from './drive';
import { PdfExtractionResult, analyzePdfSections } from './extractors/pdf';
import { PptxExtractionResult } from './extractors/pptx';

export function slugify(text: string): string {
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
 * Triggers automatic sync of Sources/SOURCES_INDEX.md
 */
function triggerSourcesSync(): void {
  try {
    const syncScript = path.join(ROOT_DIR, 'Academic-Engine', 'scripts', 'sync-sources-index.sh');
    if (fs.existsSync(syncScript)) {
      execSync(`bash "${syncScript}"`, { stdio: 'ignore' });
      console.log(`[Markdown] ✓ SOURCES_INDEX.md sincronizado con éxito.`);
    }
  } catch {
    // Non-critical background warning
  }
}

/**
 * Appends a backlink to an ingested material into the Master Class Note if not already linked.
 */
export function linkMaterialToClassDigest(
  classSlug: string,
  materialSlug: string,
  materialName: string,
  kindLabel: string
): void {
  const masterClassFile = path.join(CLASES_DIR, classSlug, `${classSlug}.md`);
  if (!fs.existsSync(masterClassFile)) return;

  const content = fs.readFileSync(masterClassFile, 'utf8');
  const linkText = `[[Materiales/${materialSlug}|${materialName}]]`;

  if (content.includes(`Materiales/${materialSlug}`)) {
    return; // Already linked
  }

  const newEntry = `* 📄 **Material de Apoyo (${kindLabel}):** ${linkText}`;

  // Find Section 8 or 5 (Recursos)
  if (content.includes('## Recursos y Documentos Relacionados') || content.includes('## 8. Recursos y Transcripción Completa')) {
    const targetSection = content.includes('## 8. Recursos y Transcripción Completa')
      ? '## 8. Recursos y Transcripción Completa'
      : '## Recursos y Documentos Relacionados';

    const updated = content.replace(targetSection, `${targetSection}\n${newEntry}`);
    fs.writeFileSync(masterClassFile, updated, 'utf8');
    console.log(`[Markdown] ✓ Material vinculado en el digest maestro de la clase: ${classSlug}`);
  }
}

/**
 * Generates an academic Markdown note directly into Academic Vault/Clases/<slug>/<slug>.md
 */
export function generateClassMarkdown(
  data: TranscriptionOutput,
  video: DiscoveredDriveItem,
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
* 👥 **Equipo Docente:** [[Profesores/00. PROFESORES_INDEX|Consultar Fichas de Instructores]]

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
> * 👥 [[Profesores/00. PROFESORES_INDEX|Directorio de Profesores SENA]]

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

  triggerSourcesSync();

  return targetFile;
}

/**
 * Generates an academic Markdown digest for a PDF document (Guía de Aprendizaje, Taller, Lectura).
 */
export function generatePdfMaterialMarkdown(
  data: PdfExtractionResult,
  file: DiscoveredDriveItem,
  fileHash: string,
  classSlug: string
): string {
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const cleanTitle = `PDF: ${baseName.replace(/_/g, ' ')}`;
  const materialSlug = slugify(baseName);

  const materialsDir = path.join(CLASES_DIR, classSlug, 'Materiales');
  fs.mkdirSync(materialsDir, { recursive: true });

  const targetFile = path.join(materialsDir, `${materialSlug}.md`);

  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const url = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;

  const parsed = analyzePdfSections(data.text);

  const content = `---
type: source
kind: pdf
title: "${cleanTitle}"
authors: ["Equipo Instructor SENA"]
year: ${currentYear}
date_ingested: ${today}
source_url: "${url}"
drive_file_id: "${file.id}"
file_hash: "${fileHash}"
program: "Análisis y Desarrollo de Software (ADSO) / Sistemas"
status: converted
version: "1.0"
workflow: pdf-ingest
tags:
  - sena
  - formacion-virtual
  - material-clase
  - guia-aprendizaje
  - ${slugify(file.classFolderName)}
---

# ${cleanTitle}

> [!NOTE] Resumen Ejecutivo
> Documento formativo oficial correspondiente a **${file.classFolderName}** (\`${file.name}\`). Este digest condensa los objetivos, evidencias requeridas, actividades prácticas y criterios evaluativos extraídos directamente del documento original (${data.numpages} páginas).

---

## 1. Plan de Acción y Evidencias Solicitadas

> [!IMPORTANT] Acciones Prioritarias Inmediatas
> Compromisos formativos identificados en el documento para desarrollo y entrega en plataforma:

${
  parsed.actionItems.length > 0
    ? parsed.actionItems.map(item => `- [ ] **Evidencia:** ${item}`).join('\n')
    : `- [ ] **Lectura y Estudio:** Revisar detalladamente los contenidos del documento en plataforma Zajuna.
- [ ] **Desarrollo:** Realizar las actividades prácticas y ejercicios solicitados por el instructor.
- [ ] **Entrega:** Cargar las evidencias requeridas dentro de las fechas fijadas en el cronograma.`
}

---

## 2. Información General del Documento

* **Módulo / Ficha:** ${file.classFolderName}
* **Archivo Original:** \`${file.name}\`
* **Total de Páginas:** ${data.numpages}
* **Hash de Integridad (SHA-256):** \`${fileHash}\`
* **ID en Google Drive:** \`${file.id}\`
* **Enlace Drive:** [Ver documento original en Google Drive](${url})

---

## 3. Competencias y Resultados de Aprendizaje (RAP)

${
  parsed.competencies.length > 0
    ? parsed.competencies.map(c => `* ${c}`).join('\n')
    : '* Competencias técnicas y transversales del programa formativo ADSO estipuladas para este módulo.'
}

---

## 4. Síntesis y Desarrollo de Contenidos

${
  parsed.keyTopics.length > 0
    ? `### Secciones Principales Identificadas:\n\n${parsed.keyTopics.map(t => `* **${t}**`).join('\n')}\n\n`
    : ''
}
${parsed.summary}

---

## 5. Recursos y Ficha de Clase Asociada

* 🎓 **Clase Principal:** [[../${classSlug}|← Volver a la Ficha y Digest de la Clase]]
* 👥 **Equipo Docente:** [[Profesores/00. PROFESORES_INDEX|Directorio de Profesores SENA]]

---

## 6. Historial de Revisiones

| Versión | Fecha | Autor | Cambios Realizados |
|---|---|---|---|
| \`v1.0\` | ${today} | Motor de Ingesta SENA (PDF Parser) | Extracción y digest automático con plan de acción prioritario en Sección 1 y validación de hash SHA-256. |
`;

  fs.writeFileSync(targetFile, content, 'utf8');
  console.log(`[Markdown] ✓ Digest de PDF generado en: ${targetFile}`);

  linkMaterialToClassDigest(classSlug, materialSlug, cleanTitle, 'PDF');
  triggerSourcesSync();

  return targetFile;
}

/**
 * Generates an academic Markdown digest for a presentation document (PPTX, PPT, Google Slides).
 */
export function generatePresentationMarkdown(
  data: PptxExtractionResult,
  file: DiscoveredDriveItem,
  fileHash: string,
  classSlug: string
): string {
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const cleanTitle = `Diapositivas: ${baseName.replace(/_/g, ' ')}`;
  const materialSlug = slugify(baseName);

  const materialsDir = path.join(CLASES_DIR, classSlug, 'Materiales');
  fs.mkdirSync(materialsDir, { recursive: true });

  const targetFile = path.join(materialsDir, `${materialSlug}.md`);

  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const url = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;

  // First 5 slides for quick digest
  const slideSummaries = data.slides.map(s => {
    let out = `### Diapositiva ${s.index}: ${s.title}\n`;
    if (s.bullets.length > 0) {
      out += s.bullets.map(b => `* ${b}`).join('\n') + '\n';
    }
    if (s.notes) {
      out += `> [!NOTE] Notas del Instructor\n> ${s.notes}\n`;
    }
    return out;
  }).join('\n');

  const content = `---
type: source
kind: presentation
title: "${cleanTitle}"
authors: ["Equipo Instructor SENA"]
year: ${currentYear}
date_ingested: ${today}
source_url: "${url}"
drive_file_id: "${file.id}"
file_hash: "${fileHash}"
program: "Análisis y Desarrollo de Software (ADSO) / Sistemas"
status: converted
version: "1.0"
workflow: presentation-ingest
tags:
  - sena
  - formacion-virtual
  - material-clase
  - diapositivas
  - ${slugify(file.classFolderName)}
---

# ${cleanTitle}

> [!NOTE] Resumen Ejecutivo
> Material de apoyo visual y conceptual correspondiente a **${file.classFolderName}** (\`${file.name}\`). Condensa la estructura temática de las diapositivas (${data.totalSlides} láminas), puntos destacados por los instructores y notas explicativas de la sesión.

---

## 1. Plan de Acción y Conclusiones Clave de la Sesión

> [!IMPORTANT] Acciones y Puntos Clave
> Conclusiones formativas extraídas de la presentación:

- [ ] Repasar los conceptos y diagramas expuestos en las láminas de la sesión.
- [ ] Contrastar las directrices de las diapositivas con la Guía de Aprendizaje correspondiente.
- [ ] Aplicar los lineamientos técnicos explicados en las actividades del trimestre.

---

## 2. Información General de la Presentación

* **Módulo / Carpeta:** ${file.classFolderName}
* **Archivo Original:** \`${file.name}\`
* **Total de Diapositivas:** ${data.totalSlides}
* **Hash de Integridad (SHA-256):** \`${fileHash}\`
* **ID en Google Drive:** \`${file.id}\`
* **Enlace Drive:** [Ver presentación en Google Drive](${url})

---

## 3. Desglose Diapositiva por Diapositiva

${slideSummaries || '_No se pudieron extraer láminas individuales de texto plano._'}

---

## 4. Recursos y Ficha de Clase Asociada

* 🎓 **Clase Principal:** [[../${classSlug}|← Volver a la Ficha y Digest de la Clase]]
* 👥 **Equipo Docente:** [[Profesores/00. PROFESORES_INDEX|Directorio de Profesores SENA]]

---

## 5. Historial de Revisiones

| Versión | Fecha | Autor | Cambios Realizados |
|---|---|---|---|
| \`v1.0\` | ${today} | Motor de Ingesta SENA (PPTX Parser) | Extracción y digest de láminas con notas del orador, plan de acción y hash SHA-256. |
`;

  fs.writeFileSync(targetFile, content, 'utf8');
  console.log(`[Markdown] ✓ Digest de Presentación generado en: ${targetFile}`);

  linkMaterialToClassDigest(classSlug, materialSlug, cleanTitle, 'PPTX');
  triggerSourcesSync();

  return targetFile;
}
