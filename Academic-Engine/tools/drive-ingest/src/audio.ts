import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { TEMP_AUDIO_DIR } from './config';

/**
 * Extracts 16kHz mono 16-bit PCM WAV audio from a video/audio file using ffmpeg.
 */
export async function extractAudio(inputPath: string, outputBaseName: string): Promise<string> {
  fs.mkdirSync(TEMP_AUDIO_DIR, { recursive: true });

  const sanitized = outputBaseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const outputPath = path.join(TEMP_AUDIO_DIR, `${sanitized}_16k.wav`);

  // If already extracted, return it
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
    console.log(`[Audio] Audio ya extraído previamente en: ${outputPath}`);
    return outputPath;
  }

  console.log(`[Audio] Extrayendo audio 16kHz mono con ffmpeg...`);
  console.log(`[Audio] Entrada: ${inputPath}`);
  console.log(`[Audio] Destino: ${outputPath}`);

  return new Promise((resolve, reject) => {
    // ffmpeg -y -i input -vn -ar 16000 -ac 1 -c:a pcm_s16le output.wav
    const args = [
      '-y',
      '-i', inputPath,
      '-vn',
      '-ar', '16000',
      '-ac', '1',
      '-c:a', 'pcm_s16le',
      outputPath
    ];

    const child = spawn('ffmpeg', args);

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        const sizeMb = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
        console.log(`[Audio] ✓ Audio extraído con éxito (${sizeMb} MB)`);
        resolve(outputPath);
      } else {
        reject(new Error(`ffmpeg falló con código ${code}:\n${stderr.slice(-500)}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Error al invocar ffmpeg: ${err.message}`));
    });
  });
}
