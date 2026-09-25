import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Readable } from 'stream';
import { updateEnvVariables } from './config';

export interface DiscoveredVideo {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  classFolderName: string;
  webViewLink?: string;
}

export interface DriveFolderItem {
  id: string;
  name: string;
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

/**
 * Searches for folders containing a specific name string.
 */
export async function searchFolders(accessToken: string, queryName: string): Promise<DriveFolderItem[]> {
  const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name contains '${queryName}' and trashed = false`);
  const fields = encodeURIComponent('files(id, name)');
  const url = `${DRIVE_API_BASE}?q=${query}&fields=${fields}&pageSize=10`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const data = await res.json() as any;
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name || 'Sin nombre'
  }));
}

/**
 * Gets details of a single folder by ID.
 */
export async function getFolderDetails(accessToken: string, folderId: string): Promise<DriveFolderItem> {
  const url = `${DRIVE_API_BASE}/${folderId}?fields=id,name`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al consultar carpeta ${folderId}: ${res.status} - ${errorText}`);
  }

  const data = await res.json() as any;
  return {
    id: data.id,
    name: data.name || 'Carpeta'
  };
}

/**
 * Recursively discovers video/audio files organized under class folders.
 */
export async function listVideosInFolder(
  accessToken: string,
  rootFolderId: string
): Promise<DiscoveredVideo[]> {
  const videos: DiscoveredVideo[] = [];

  // 1. Get immediate children of root folder
  const queryChildren = encodeURIComponent(`'${rootFolderId}' in parents and trashed = false`);
  const fields = encodeURIComponent('files(id, name, mimeType, size, webViewLink)');
  const url = `${DRIVE_API_BASE}?q=${queryChildren}&fields=${fields}&pageSize=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al listar archivos en ${rootFolderId}: ${res.status} - ${errText}`);
  }

  const data = await res.json() as any;
  const items = data.files || [];

  for (const item of items) {
    if (!item.id || !item.name) continue;

    if (item.mimeType === 'application/vnd.google-apps.folder') {
      // Subfolder (e.g. "Clase 1 - Introduccion", "Clase 2")
      const subQuery = encodeURIComponent(`'${item.id}' in parents and trashed = false`);
      const subUrl = `${DRIVE_API_BASE}?q=${subQuery}&fields=${fields}&pageSize=50`;

      const subRes = await fetch(subUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (subRes.ok) {
        const subData = await subRes.json() as any;
        const subFiles = subData.files || [];
        for (const subFile of subFiles) {
          if (isVideoOrAudio(subFile)) {
            videos.push({
              id: subFile.id,
              name: subFile.name,
              mimeType: subFile.mimeType || 'video/mp4',
              sizeBytes: parseInt(subFile.size || '0', 10),
              classFolderName: item.name,
              webViewLink: subFile.webViewLink || undefined
            });
          }
        }
      }
    } else if (isVideoOrAudio(item)) {
      // Video located directly in the root folder
      videos.push({
        id: item.id,
        name: item.name,
        mimeType: item.mimeType || 'video/mp4',
        sizeBytes: parseInt(item.size || '0', 10),
        classFolderName: 'Raíz SENA',
        webViewLink: item.webViewLink || undefined
      });
    }
  }

  return videos;
}

function isVideoOrAudio(file: { name?: string; mimeType?: string }): boolean {
  const mime = file.mimeType || '';
  const name = (file.name || '').toLowerCase();
  const isVideoMime = mime.startsWith('video/') || mime.startsWith('audio/');
  const hasExt = /\.(mp4|mkv|mov|webm|avi|mp3|m4a|wav|aac)$/i.test(name);
  return isVideoMime || hasExt;
}

/**
 * Downloads a file from Google Drive to a local path using native fetch stream.
 */
export async function downloadDriveFile(
  accessToken: string,
  fileId: string,
  destinationPath: string
): Promise<string> {
  const dir = path.dirname(destinationPath);
  fs.mkdirSync(dir, { recursive: true });

  console.log(`[Drive] Iniciando descarga de archivo ID: ${fileId}...`);

  const url = `${DRIVE_API_BASE}/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok || !res.body) {
    const errText = await res.text();
    throw new Error(`Error descargando archivo de Drive: ${res.status} - ${errText}`);
  }

  return new Promise((resolve, reject) => {
    const dest = fs.createWriteStream(destinationPath);
    let downloadedBytes = 0;

    const stream = Readable.fromWeb(res.body as any);

    stream.on('data', (chunk: Buffer) => {
      downloadedBytes += chunk.length;
      const mb = (downloadedBytes / (1024 * 1024)).toFixed(1);
      process.stdout.write(`\r[Drive] Descargando: ${mb} MB`);
    });

    stream.on('end', () => {
      process.stdout.write('\n');
      console.log(`[Drive] ✓ Descarga completada en: ${destinationPath}`);
      resolve(destinationPath);
    });

    stream.on('error', (err) => {
      reject(new Error(`Error en el stream de descarga: ${err.message}`));
    });

    stream.pipe(dest);
  });
}

/**
 * Interactive folder setup assistant:
 */
export async function interactiveSetupFolder(accessToken: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => rl.question(prompt, (ans) => resolve(ans.trim())));
  };

  try {
    console.log('\n======================================================');
    console.log('   ASISTENTE DE CONFIGURACIÓN DE CARPETA GOOGLE DRIVE');
    console.log('======================================================\n');
    console.log('[Setup] Buscando carpetas relacionadas con "SENA" en tu Google Drive...');

    const foundFolders = await searchFolders(accessToken, 'SENA');

    let selectedFolderId = '';

    if (foundFolders.length > 0) {
      console.log('\nSe encontraron las siguientes carpetas:');
      foundFolders.forEach((f, idx) => {
        console.log(`  [${idx + 1}] 📁 ${f.name} (ID: ${f.id})`);
      });
      console.log(`  [${foundFolders.length + 1}] Pegar otra URL o ID manualmente`);

      const choice = await question(`\nSelecciona una opción [1-${foundFolders.length + 1}] (default: 1): `);
      const choiceNum = parseInt(choice || '1', 10);

      if (choiceNum >= 1 && choiceNum <= foundFolders.length) {
        selectedFolderId = foundFolders[choiceNum - 1].id;
      }
    }

    if (!selectedFolderId) {
      const input = await question('\nPega el enlace completo de la carpeta de Drive o su ID: ');
      const match = input.match(/folders\/([a-zA-Z0-9_-]+)/);
      selectedFolderId = match ? match[1] : input;
    }

    if (!selectedFolderId) {
      throw new Error('No se proporcionó un ID de carpeta válido.');
    }

    console.log(`\n[Setup] Verificando acceso a la carpeta: ${selectedFolderId}...`);
    const details = await getFolderDetails(accessToken, selectedFolderId);
    console.log(`[Setup] ✓ Carpeta confirmada: "${details.name}"`);

    const videos = await listVideosInFolder(accessToken, selectedFolderId);
    console.log(`[Setup] Contenido inicial detectado: ${videos.length} archivo(s) de video/audio.`);

    if (videos.length > 0) {
      const folders = Array.from(new Set(videos.map(v => v.classFolderName)));
      folders.forEach(folder => {
        const count = videos.filter(v => v.classFolderName === folder).length;
        console.log(`  ├── 📁 ${folder} (${count} video(s))`);
      });
    }

    updateEnvVariables({ GOOGLE_DRIVE_FOLDER_ID: selectedFolderId });
    console.log(`\n[Setup] ✓ GOOGLE_DRIVE_FOLDER_ID="${selectedFolderId}" guardado con éxito en tu archivo .env.local!\n`);

    rl.close();
    return selectedFolderId;
  } catch (err) {
    rl.close();
    throw err;
  }
}
