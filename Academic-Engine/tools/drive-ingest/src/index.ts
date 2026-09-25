#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { getConfig, TEMP_AUDIO_DIR, VAULT_DIR } from './config';
import { getValidAccessToken } from './auth';
import { listFilesInFolder, downloadDriveFile, interactiveSetupFolder, DiscoveredDriveItem } from './drive';
import { extractAudio } from './audio';
import { transcribeAudio } from './whisper';
import { StateManager } from './state';
import {
  generateClassMarkdown,
  generatePdfMaterialMarkdown,
  generatePresentationMarkdown,
  slugify
} from './markdown';
import { computeFileHash, shortHash } from './hash';
import { extractPdfContent } from './extractors/pdf';
import { extractPptxContent } from './extractors/pptx';

function resolveClassSlug(classFolderName: string): string {
  const baseSlug = slugify(classFolderName);
  const clasesDir = path.join(VAULT_DIR, 'Clases');
  if (fs.existsSync(clasesDir)) {
    const existing = fs.readdirSync(clasesDir).filter(d => {
      const full = path.join(clasesDir, d);
      return fs.statSync(full).isDirectory() && (d === baseSlug || d.startsWith(`${baseSlug}-`));
    });
    if (existing.length > 0) {
      return existing[0];
    }
  }
  return baseSlug;
}

async function main() {
  const args = process.argv.slice(2);
  const isSetup = args.includes('--setup');
  const isSetFolder = args.includes('--set-folder');
  const isDryRun = args.includes('--dry-run');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: ingest-drive-video [opciones]

Opciones:
  --setup        Ejecuta el asistente de autenticación OAuth 2.0 y selección de carpeta
  --set-folder   Permite buscar o cambiar la carpeta de Google Drive asignada en .env
  --dry-run      Lista los archivos encontrados y estado de deduplicación sin procesar
  --help, -h     Muestra este mensaje de ayuda
`);
    process.exit(0);
  }

  console.log('================================================================');
  console.log('  SENA ACADEMIC ENGINE - INGESTA MULTI-FORMATO & HASH DEDUP');
  console.log('  Videos (Whisper GPU) | Guías (PDF) | Presentaciones (PPTX)');
  console.log('================================================================\n');

  // 1. Authenticate with Google OAuth 2.0
  const accessToken = await getValidAccessToken();
  let config = getConfig();

  // 2. Folder Setup Assistant
  if (isSetup || isSetFolder || !config.googleDriveFolderId) {
    if (!config.googleDriveFolderId) {
      console.log('[Setup] No se encontró GOOGLE_DRIVE_FOLDER_ID configurado en .env.local.');
    }
    await interactiveSetupFolder(accessToken);
    config = getConfig();
    if (isSetup || isSetFolder) {
      console.log('✓ Configuración completada con éxito.');
      process.exit(0);
    }
  }

  // 3. Discover all learning materials in Google Drive
  console.log(`[Ingest] Explorando carpeta raíz: ${config.googleDriveFolderId}...`);
  const allItems = await listFilesInFolder(accessToken, config.googleDriveFolderId);
  console.log(`[Ingest] Se encontraron ${allItems.length} archivo(s) de formación en total.`);

  const state = new StateManager();

  // 4. Pre-filter with Drive Checksum / FileId
  const pendingItems: DiscoveredDriveItem[] = [];
  let skippedDuplicates = 0;
  let alreadyProcessed = 0;

  for (const item of allItems) {
    const status = state.checkStatus(item.id, undefined, item.md5Checksum);
    if (status.status === 'ALREADY_PROCESSED') {
      alreadyProcessed++;
    } else if (status.status === 'DUPLICATE_CONTENT') {
      console.log(
        `[Deduplicación Pre-Download] ⚡ Contenido duplicado detectado: "${item.name}" ` +
        `(MD5: ${shortHash(item.md5Checksum || '')}) coincide con "${status.existing.fileName}". Se omitirá descarga redundante.`
      );
      skippedDuplicates++;
      state.markDuplicate(item, status.existing);
    } else {
      pendingItems.push(item);
    }
  }

  console.log(`[Ingest] Ya procesados previamente: ${alreadyProcessed}`);
  console.log(`[Ingest] Duplicados omitidos por Hash: ${skippedDuplicates}`);
  console.log(`[Ingest] Pendientes de procesamiento: ${pendingItems.length}\n`);

  if (isDryRun) {
    console.log('--- MODO DRY RUN (Sin descargas) ---');
    pendingItems.forEach(item => {
      const mb = (item.sizeBytes / (1024 * 1024)).toFixed(1);
      console.log(`- [PENDIENTE] [${item.kind.toUpperCase()}] [${item.classFolderName}] ${item.name} (${mb} MB, MD5: ${shortHash(item.md5Checksum || '')})`);
    });
    process.exit(0);
  }

  if (pendingItems.length === 0) {
    console.log('✓ Todos los archivos de Google Drive están al día y deduplicados. No hay elementos pendientes.');
    process.exit(0);
  }

  // 5. Process each pending file
  for (let i = 0; i < pendingItems.length; i++) {
    const item = pendingItems[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`Procesando [${i + 1}/${pendingItems.length}] - Tipo: ${item.kind.toUpperCase()}`);
    console.log(`  Carpeta: ${item.classFolderName}`);
    console.log(`  Archivo: ${item.name}`);
    console.log(`----------------------------------------------------------------`);

    const isGoogleNative =
      item.mimeType === 'application/vnd.google-apps.presentation' ||
      item.mimeType === 'application/vnd.google-apps.document';

    const ext = isGoogleNative ? '.pdf' : (path.extname(item.name) || (item.kind === 'video' ? '.mp4' : '.bin'));
    const tempFilePath = path.join(TEMP_AUDIO_DIR, `temp_${item.id}${ext}`);

    let wavPath = '';
    try {
      // Step A: Download / Export from Drive
      await downloadDriveFile(accessToken, item.id, tempFilePath, isGoogleNative);

      // Step B: Calculate local SHA-256 hash for strict integrity check
      const localHash = computeFileHash(tempFilePath);
      console.log(`[Hashing] SHA-256 calculado: ${localHash} (${shortHash(localHash)})`);

      // Second check: Did this hash appear in another file with different ID/name?
      const hashCheck = state.checkStatus(item.id, localHash);
      if (hashCheck.status === 'DUPLICATE_CONTENT') {
        console.log(
          `[Deduplicación Post-Download] ⚡ Contenido idéntico verificado: "${item.name}" ` +
          `(SHA-256: ${shortHash(localHash)}) coincide exactamente con "${hashCheck.existing.fileName}". Reutilizando ingesta.`
        );
        state.markDuplicate(item, hashCheck.existing, localHash);
        continue;
      }

      // Step C: Process according to kind
      const classSlug = resolveClassSlug(item.classFolderName);

      if (item.kind === 'video') {
        // Audio extraction & Whisper Metal GPU transcription
        wavPath = await extractAudio(tempFilePath, `${item.classFolderName}_${item.name}`);
        const result = await transcribeAudio(wavPath, item.classFolderName, item.name, item.id);
        const markdownPath = generateClassMarkdown(result.data, item);

        state.markProcessed({
          fileId: item.id,
          fileName: item.name,
          fileHash: localHash,
          md5Checksum: item.md5Checksum,
          sizeBytes: item.sizeBytes,
          classFolderName: item.classFolderName,
          mimeType: item.mimeType,
          kind: 'video',
          processedAt: new Date().toISOString(),
          rawJsonPath: result.jsonPath,
          markdownPath
        });

        console.log(`✓ Video transcrito y nota generada: ${markdownPath}`);

      } else if (item.kind === 'pdf' || (isGoogleNative && item.mimeType === 'application/vnd.google-apps.document')) {
        // PDF Ingestion & Digest
        console.log(`[PDF] Extrayendo contenido de: ${item.name}...`);
        const pdfData = await extractPdfContent(tempFilePath);
        console.log(`[PDF] Páginas extraídas: ${pdfData.numpages}, caracteres: ${pdfData.text.length}`);

        const markdownPath = generatePdfMaterialMarkdown(pdfData, item, localHash, classSlug);

        // Copy raw PDF to vault materials folder for persistence
        const rawDestDir = path.join(VAULT_DIR, 'Clases', classSlug, 'Materiales', 'raw');
        fs.mkdirSync(rawDestDir, { recursive: true });
        const rawDestPath = path.join(rawDestDir, item.name);
        fs.copyFileSync(tempFilePath, rawDestPath);

        state.markProcessed({
          fileId: item.id,
          fileName: item.name,
          fileHash: localHash,
          md5Checksum: item.md5Checksum,
          sizeBytes: item.sizeBytes,
          classFolderName: item.classFolderName,
          mimeType: item.mimeType,
          kind: 'pdf',
          processedAt: new Date().toISOString(),
          markdownPath,
          rawArtifactPath: rawDestPath
        });

        console.log(`✓ PDF procesado y digest generado: ${markdownPath}`);

      } else if (item.kind === 'presentation') {
        // PPTX Ingestion & Digest
        console.log(`[PPTX] Extrayendo diapositivas de: ${item.name}...`);
        const pptxData = extractPptxContent(tempFilePath);
        console.log(`[PPTX] Diapositivas extraídas: ${pptxData.totalSlides}`);

        const markdownPath = generatePresentationMarkdown(pptxData, item, localHash, classSlug);

        // Copy raw PPTX to vault materials folder
        const rawDestDir = path.join(VAULT_DIR, 'Clases', classSlug, 'Materiales', 'raw');
        fs.mkdirSync(rawDestDir, { recursive: true });
        const rawDestPath = path.join(rawDestDir, item.name);
        fs.copyFileSync(tempFilePath, rawDestPath);

        state.markProcessed({
          fileId: item.id,
          fileName: item.name,
          fileHash: localHash,
          md5Checksum: item.md5Checksum,
          sizeBytes: item.sizeBytes,
          classFolderName: item.classFolderName,
          mimeType: item.mimeType,
          kind: 'presentation',
          processedAt: new Date().toISOString(),
          markdownPath,
          rawArtifactPath: rawDestPath
        });

        console.log(`✓ Presentación procesada y digest generado: ${markdownPath}`);
      }

    } catch (err: any) {
      console.error(`❌ Error procesando archivo ${item.name}:`, err.message || err);
    } finally {
      fs.rmSync(tempFilePath, { force: true });
      if (wavPath) {
        fs.rmSync(wavPath, { force: true });
      }
    }
  }

  console.log('\n================================================================');
  console.log('✓ Ingesta y deduplicación completada con éxito.');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('\n❌ Error fatal durante la ejecución:', err.message || err);
  process.exit(1);
});
