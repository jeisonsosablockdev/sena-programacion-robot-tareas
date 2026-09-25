import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Readable } from 'stream';
import { updateEnvVariables } from './config';

export type DriveItemKind = 'video' | 'pdf' | 'presentation' | 'document' | 'other';

export interface DiscoveredDriveItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  classFolderName: string;
  webViewLink?: string;
  md5Checksum?: string;
  modifiedTime?: string;
  kind: DriveItemKind;
}

export interface DriveFolderItem {
  id: string;
  name: string;
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

export function classifyDriveItem(file: { name?: string; mimeType?: string }): DriveItemKind {
  const mime = (file.mimeType || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (
    mime.startsWith('video/') ||
    mime.startsWith('audio/') ||
    /\.(mp4|mkv|mov|webm|avi|mp3|m4a|wav|aac)$/i.test(name)
  ) {
    return 'video';
  }
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mime === 'application/vnd.ms-powerpoint' ||
    mime === 'application/vnd.google-apps.presentation' ||
    /\.(pptx|ppt)$/i.test(name)
  ) {
    return 'presentation';
  }
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/vnd.google-apps.document' ||
    /\.(docx|doc)$/i.test(name)
  ) {
    return 'document';
  }

  return 'other';
}

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
 * Recursively discovers all learning materials (videos, PDFs, PPTX, Docs) organized under class folders.
 */
export async function listFilesInFolder(
  accessToken: string,
  rootFolderId: string
): Promise<DiscoveredDriveItem[]> {
  const itemsDiscovered: DiscoveredDriveItem[] = [];

  // 1. Get immediate children of root folder
  const queryChildren = encodeURIComponent(`'${rootFolderId}' in parents and trashed = false`);
  const fields = encodeURIComponent('files(id, name, mimeType, size, webViewLink, md5Checksum, modifiedTime)');
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

  async function crawlFolder(folderId: string, classFolderName: string): Promise<void> {
    const subQuery = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const subUrl = `${DRIVE_API_BASE}?q=${subQuery}&fields=${fields}&pageSize=100`;

    const subRes = await fetch(subUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!subRes.ok) return;

    const subData = await subRes.json() as any;
    const children = subData.files || [];

    for (const child of children) {
      if (!child.id || !child.name) continue;

      if (child.mimeType === 'application/vnd.google-apps.folder') {
        // Recurse into nested folders (e.g. Materiales, Anexos) keeping the parent class name
        await crawlFolder(child.id, classFolderName);
      } else {
        const kind = classifyDriveItem(child);
        if (kind !== 'other') {
          itemsDiscovered.push({
            id: child.id,
            name: child.name,
            mimeType: child.mimeType || '',
            sizeBytes: parseInt(child.size || '0', 10),
            classFolderName,
            webViewLink: child.webViewLink || undefined,
            md5Checksum: child.md5Checksum || undefined,
            modifiedTime: child.modifiedTime || undefined,
            kind
          });
        }
      }
    }
  }

  for (const item of items) {
    if (!item.id || !item.name) continue;

    if (item.mimeType === 'application/vnd.google-apps.folder') {
      // Subfolder for a class (e.g. "Clase 1")
      await crawlFolder(item.id, item.name);
    } else {
      const kind = classifyDriveItem(item);
      if (kind !== 'other') {
        itemsDiscovered.push({
          id: item.id,
          name: item.name,
          mimeType: item.mimeType || '',
          sizeBytes: parseInt(item.size || '0', 10),
          classFolderName: 'Raíz SENA',
          webViewLink: item.webViewLink || undefined,
          md5Checksum: item.md5Checksum || undefined,
          modifiedTime: item.modifiedTime || undefined,
          kind
        });
      }
    }
  }

  return itemsDiscovered;
}

/**
 * Downloads a file or exports a Google Doc/Slide from Google Drive to a local path using native fetch stream.
 */
export async function downloadDriveFile(
  accessToken: string,
  fileId: string,
  destinationPath: string,
  isGoogleNative: boolean = false
): Promise<string> {
  const dir = path.dirname(destinationPath);
  fs.mkdirSync(dir, { recursive: true });

  console.log(`[Drive] Iniciando descarga de archivo ID: ${fileId}...`);

  let url: string;
  if (isGoogleNative) {
    url = `${DRIVE_API_BASE}/${fileId}/export?mimeType=application/pdf`;
  } else {
    url = `${DRIVE_API_BASE}/${fileId}?alt=media`;
  }

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
 * Interactive CLI assistant to search and select Google Drive folder.
 */
export async function interactiveSetupFolder(accessToken: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));

  console.log('\n--- ASISTENTE DE CONFIGURACIÓN DE CARPETA SENA EN GOOGLE DRIVE ---');
  console.log('1. Buscar carpeta por nombre (ej: "ADSO", "SENA", "Clases")');
  console.log('2. Ingresar ID de carpeta directamente (si ya lo tienes)');

  const choice = (await question('Selecciona una opción (1/2): ')).trim();

  let selectedFolderId = '';
  let selectedFolderName = '';

  if (choice === '1') {
    const term = (await question('Ingresa término de búsqueda: ')).trim();
    console.log(`Buscando carpetas que coincidan con "${term}"...`);
    const folders = await searchFolders(accessToken, term);

    if (folders.length === 0) {
      console.log('No se encontraron carpetas con ese nombre. Intenta de nuevo.');
      rl.close();
      return '';
    }

    console.log('\nCarpetas encontradas:');
    folders.forEach((f, idx) => {
      console.log(`  [${idx + 1}] ${f.name} (ID: ${f.id})`);
    });

    const selIdxStr = (await question(`Selecciona el número de carpeta (1-${folders.length}): `)).trim();
    const selIdx = parseInt(selIdxStr, 10) - 1;

    if (selIdx >= 0 && selIdx < folders.length) {
      selectedFolderId = folders[selIdx].id;
      selectedFolderName = folders[selIdx].name;
    } else {
      console.log('Opción inválida.');
      rl.close();
      return '';
    }
  } else {
    selectedFolderId = (await question('Pega el ID de la carpeta de Google Drive: ')).trim();
    try {
      const details = await getFolderDetails(accessToken, selectedFolderId);
      selectedFolderName = details.name;
    } catch {
      selectedFolderName = 'Carpeta SENA';
    }
  }

  rl.close();

  if (selectedFolderId) {
    console.log(`\n✓ Carpeta seleccionada: "${selectedFolderName}" (ID: ${selectedFolderId})`);
    updateEnvVariables({ GOOGLE_DRIVE_FOLDER_ID: selectedFolderId });
    console.log(`✓ GOOGLE_DRIVE_FOLDER_ID guardado en archivo de entorno.`);
    return selectedFolderId;
  }

  return '';
}
