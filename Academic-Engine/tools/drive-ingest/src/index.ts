#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { getConfig, TEMP_AUDIO_DIR } from './config';
import { getValidAccessToken } from './auth';
import { listVideosInFolder, downloadDriveFile, interactiveSetupFolder } from './drive';
import { extractAudio } from './audio';
import { transcribeAudio } from './whisper';
import { StateManager } from './state';
import { generateClassMarkdown } from './markdown';

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
  --dry-run      Lista los videos encontrados y su estado sin descargar ni transcribir
  --help, -h     Muestra este mensaje de ayuda
`);
    process.exit(0);
  }

  console.log('================================================================');
  console.log('  SENA ACADEMIC ENGINE - INGESTA DE CLASES DRIVE & WHISPER GPU');
  console.log('================================================================\n');

  // 1. Authenticate with Google OAuth 2.0 (native fetch)
  const accessToken = await getValidAccessToken();

  let config = getConfig();

  // 2. Folder Setup Assistant (if requested or folderId missing)
  if (isSetup || isSetFolder || !config.googleDriveFolderId) {
    if (!config.googleDriveFolderId) {
      console.log('[Setup] No se encontró GOOGLE_DRIVE_FOLDER_ID configurado en .env.local.');
    }
    await interactiveSetupFolder(accessToken);
    config = getConfig(); // Reload config after update
    if (isSetup || isSetFolder) {
      console.log('✓ Configuración completada con éxito.');
      process.exit(0);
    }
  }

  // 3. Discover classes and videos
  console.log(`[Ingest] Explorando carpeta raíz: ${config.googleDriveFolderId}...`);
  const allVideos = await listVideosInFolder(accessToken, config.googleDriveFolderId);
  console.log(`[Ingest] Se encontraron ${allVideos.length} archivo(s) de video/audio en total.`);

  const state = new StateManager();
  const pendingVideos = allVideos.filter(v => !state.isProcessed(v.id));

  console.log(`[Ingest] Ya procesados previamente: ${allVideos.length - pendingVideos.length}`);
  console.log(`[Ingest] Pendientes de transcripción: ${pendingVideos.length}\n`);

  if (isDryRun) {
    console.log('--- MODO DRY RUN (Sin descargas) ---');
    pendingVideos.forEach(v => {
      const mb = (v.sizeBytes / (1024 * 1024)).toFixed(1);
      console.log(`- [PENDIENTE] [${v.classFolderName}] ${v.name} (${mb} MB)`);
    });
    process.exit(0);
  }

  if (pendingVideos.length === 0) {
    console.log('✓ Todas las clases de Google Drive están al día. No hay videos nuevos por procesar.');
    process.exit(0);
  }

  // 4. Process each pending video
  for (let i = 0; i < pendingVideos.length; i++) {
    const video = pendingVideos[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`Procesando clase [${i + 1}/${pendingVideos.length}]:`);
    console.log(`  Carpeta: ${video.classFolderName}`);
    console.log(`  Archivo: ${video.name}`);
    console.log(`----------------------------------------------------------------`);

    const ext = path.extname(video.name) || '.mp4';
    const tempVideoPath = path.join(TEMP_AUDIO_DIR, `temp_${video.id}${ext}`);

    let wavPath = '';
    try {
      // Step A: Download from Drive (streaming fetch)
      await downloadDriveFile(accessToken, video.id, tempVideoPath);

      // Step B: Extract 16kHz WAV with ffmpeg
      wavPath = await extractAudio(tempVideoPath, `${video.classFolderName}_${video.name}`);

      // Step C: Transcribe with whisper-cli on Apple Silicon Metal GPU
      const result = await transcribeAudio(wavPath, video.classFolderName, video.name, video.id);

      // Step D: Generate structured Markdown note directly into Academic Vault/Clases/
      const markdownPath = generateClassMarkdown(result.data, video);

      // Step E: Mark as processed in state
      state.markProcessed({
        fileId: video.id,
        fileName: video.name,
        classFolderName: video.classFolderName,
        mimeType: video.mimeType,
        processedAt: new Date().toISOString(),
        rawJsonPath: result.jsonPath,
        markdownPath
      });

      console.log(`✓ Clase procesada exitosamente: ${video.name}`);
      console.log(`✓ Nota Markdown creada automáticamente en: ${markdownPath}`);
    } catch (err) {
      console.error(`❌ Error procesando el video ${video.name}:`, err);
    } finally {
      // Step E: Clean up scratch temp files to preserve disk space
      fs.rmSync(tempVideoPath, { force: true });
      if (wavPath) {
        fs.rmSync(wavPath, { force: true });
      }
    }
  }

  console.log('\n================================================================');
  console.log('✓ Ingesta completada con éxito.');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('\n❌ Error fatal durante la ejecución:', err.message || err);
  process.exit(1);
});
