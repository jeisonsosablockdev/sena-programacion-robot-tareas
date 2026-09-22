#!/usr/bin/env node

/**
 * PDF Ingest & Source Conversion Engine
 * Academic-Engine
 * 
 * Processes PDF files from "Sources/PDF Unconverted/" or a specified path,
 * converts them to structured Markdown notes with YAML metadata,
 * moves the original into "Sources/PDF Converted/<slug>/", and registers
 * them in "Sources/SOURCES_INDEX.md".
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');
const UNCONVERTED_DIR = path.join(VAULT_DIR, 'Sources', 'PDF Unconverted');
const CONVERTED_DIR = path.join(VAULT_DIR, 'Sources', 'PDF Converted');
const SOURCES_INDEX_PATH = path.join(VAULT_DIR, 'Sources', 'SOURCES_INDEX.md');

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractPdfText(pdfPath) {
  // Try pdftotext first (poppler)
  try {
    const text = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (text && text.trim().length > 50) return text.trim();
  } catch (e) {
    // pdftotext not available or failed
  }

  // Fallback: Python script if available
  try {
    const pythonCode = `
import sys
try:
    import pypdf
    reader = pypdf.PdfReader(sys.argv[1])
    text = "\\n".join([page.extract_text() or "" for page in reader.pages])
    print(text)
except Exception:
    try:
        import fitz # PyMuPDF
        doc = fitz.open(sys.argv[1])
        text = "\\n".join([page.get_text() for page in doc])
        print(text)
    except Exception:
        sys.exit(1)
`;
    const text = execSync(`python3 -c '${pythonCode.replace(/\n/g, '; ')}' "${pdfPath}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (text && text.trim().length > 50) return text.trim();
  } catch (e) {
    // Python extraction not available
  }

  return null;
}

function updateSourcesIndex(title, slug, year = '2026', authors = '—', kind = 'pdf', ref = 'PDF', status = 'converted') {
  if (!fs.existsSync(SOURCES_INDEX_PATH)) {
    fs.writeFileSync(SOURCES_INDEX_PATH, `# Sources Index\n\n| Source | Authors | Year | Kind | Reference | Projects | Status |\n| --- | --- | --- | --- | --- | --- | --- |\n`, 'utf8');
  }

  let indexContent = fs.readFileSync(SOURCES_INDEX_PATH, 'utf8');
  const sourceLink = `[[Sources/PDF Converted/${slug}/${slug}.md|${title}]]`;

  // Check if already present
  if (indexContent.includes(slug)) {
    console.log(`  [INDEX] "${slug}" already exists in SOURCES_INDEX.md`);
    return;
  }

  const newRow = `| ${sourceLink} | ${authors} | ${year} | ${kind} | ${ref} | — | ${status} |\n`;
  indexContent = indexContent.trimEnd() + '\n' + newRow;
  fs.writeFileSync(SOURCES_INDEX_PATH, indexContent, 'utf8');
  console.log(`  [INDEX] Added "${title}" to SOURCES_INDEX.md`);
}

function processSinglePdf(filePath) {
  const fileName = path.basename(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  const slug = slugify(baseName);
  const targetFolder = path.join(CONVERTED_DIR, slug);

  console.log(`\n📄 Processing: "${fileName}"`);
  console.log(`   Slug: ${slug}`);

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const targetPdf = path.join(targetFolder, 'original.pdf');
  fs.copyFileSync(filePath, targetPdf);

  // Extract text
  const extractedText = extractPdfText(filePath);
  const markdownNotePath = path.join(targetFolder, `${slug}.md`);

  const currentDate = new Date().toISOString().split('T')[0];
  let noteContent = `---
title: "${baseName.replace(/"/g, '\\"')}"
type: source
kind: pdf
slug: "${slug}"
status: ${extractedText ? 'converted' : 'intake-pending-ocr'}
date_ingested: "${currentDate}"
original_file: "original.pdf"
tags:
  - source
  - pdf
  - academic
---

# ${baseName}

> [!NOTE] Metadatos de la Fuente
> - **Archivo original:** \`original.pdf\`
> - **Fecha de ingesta:** ${currentDate}
> - **Estado:** ${extractedText ? 'Texto extraído exitosamente' : 'Pendiente de OCR / extracción manual'}

## Resumen Ejecutivo

[Pendiente de síntesis por el research-librarian o usuario]

## Puntos Clave

- 

## Texto Extraído

${extractedText ? extractedText : '_No se pudo extraer texto seleccionable de forma nativa. Requiere revisión de OCR o transcripción._'}

## Enlaces & Referencias

- [[Sources/SOURCES_INDEX|Índice Maestro de Fuentes]]
`;

  fs.writeFileSync(markdownNotePath, noteContent, 'utf8');
  console.log(`  [NOTE] Created note at: Sources/PDF Converted/${slug}/${slug}.md`);

  // Update index
  updateSourcesIndex(baseName, slug, new Date().getFullYear().toString(), '—', 'pdf', '[PDF](original.pdf)', extractedText ? 'converted' : 'intake-pending');

  // If in unconverted queue, remove it
  if (filePath.startsWith(UNCONVERTED_DIR)) {
    fs.unlinkSync(filePath);
    console.log(`  [CLEANUP] Removed from intake queue: ${fileName}`);
  }

  return { slug, markdownNotePath };
}

function main() {
  const args = process.argv.slice(2);
  
  if (!fs.existsSync(UNCONVERTED_DIR)) {
    fs.mkdirSync(UNCONVERTED_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONVERTED_DIR)) {
    fs.mkdirSync(CONVERTED_DIR, { recursive: true });
  }

  if (args.length > 0 && args[0] !== '--queue') {
    // Process specific file
    const targetPath = path.resolve(process.cwd(), args[0]);
    if (!fs.existsSync(targetPath)) {
      console.error(`Error: File not found: ${targetPath}`);
      process.exit(1);
    }
    processSinglePdf(targetPath);
    return;
  }

  // Batch queue mode
  const files = fs.readdirSync(UNCONVERTED_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  
  if (files.length === 0) {
    console.log(`No pending PDFs found in: "Academic Vault/Sources/PDF Unconverted/"`);
    console.log(`Drop your PDF files there and rerun: bash Academic-Engine/scripts/ingest-pdf.sh`);
    return;
  }

  console.log(`Found ${files.length} pending PDF(s) in queue.`);
  for (const file of files) {
    processSinglePdf(path.join(UNCONVERTED_DIR, file));
  }

  console.log(`\n✅ PDF Intake Queue processing completed.`);
}

if (require.main === module) {
  main();
}

module.exports = { processSinglePdf, slugify };
