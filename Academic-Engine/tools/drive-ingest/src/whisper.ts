import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { getConfig, VIDEO_RAW_DIR } from './config';

export interface WhisperSegment {
  id: number;
  start: string;
  end: string;
  text: string;
}

export interface TranscriptionOutput {
  fileId: string;
  fileName: string;
  classFolderName: string;
  transcribedAt: string;
  model: string;
  language: string;
  fullText: string;
  segments: WhisperSegment[];
}

function formatTimestamp(msOrSec: number | string): string {
  const totalSeconds = typeof msOrSec === 'number' ? msOrSec / 100 : parseFloat(msOrSec);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Transcribes audio using whisper-cli on Apple Silicon Metal GPU.
 */
export async function transcribeAudio(
  wavPath: string,
  classFolderName: string,
  fileName: string,
  fileId: string
): Promise<{ jsonPath: string; data: TranscriptionOutput }> {
  const config = getConfig();

  if (!fs.existsSync(config.whisperModelPath)) {
    throw new Error(
      `No se encontró el modelo de Whisper en: ${config.whisperModelPath}\n` +
      `Asegúrate de que la descarga haya terminado o configura WHISPER_MODEL en .env.`
    );
  }

  // Ensure target folder in Video Raw exists
  const rawTargetDir = path.join(VIDEO_RAW_DIR, classFolderName);
  fs.mkdirSync(rawTargetDir, { recursive: true });

  const baseOutputName = path.parse(fileName).name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const tempPrefix = path.join(rawTargetDir, `${baseOutputName}_output`);
  const finalJsonPath = path.join(rawTargetDir, `${baseOutputName}_transcript.json`);

  console.log(`\n[Whisper] Iniciando transcripción con GPU Metal (Apple Silicon)...`);
  console.log(`[Whisper] Modelo: ${path.basename(config.whisperModelPath)}`);
  console.log(`[Whisper] Idioma: ${config.whisperLanguage}`);
  console.log(`[Whisper] Archivo: ${wavPath}`);

  return new Promise((resolve, reject) => {
    // whisper-cli -m model.bin -f audio.wav -l es -oj -of prefix -pp
    const args = [
      '-m', config.whisperModelPath,
      '-f', wavPath,
      '-l', config.whisperLanguage,
      '-oj', // output JSON
      '-of', tempPrefix,
      '-pp'  // print progress
    ];

    const child = spawn('whisper-cli', args);

    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      // whisper-cli prints progress and metal init info to stderr
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      const generatedJson = `${tempPrefix}.json`;

      if (code === 0 && fs.existsSync(generatedJson)) {
        try {
          const rawContent = fs.readFileSync(generatedJson, 'utf8');
          const parsed = JSON.parse(rawContent);

          const segments: WhisperSegment[] = [];
          let fullText = '';

          // whisper.cpp json format contains transcription array
          const rawSegments = parsed.transcription || parsed.segments || [];
          for (let i = 0; i < rawSegments.length; i++) {
            const seg = rawSegments[i];
            const text = (seg.text || '').trim();
            if (!text) continue;

            // Handle timestamps (whisper.cpp provides timestamps in various formats)
            const startStr = seg.timestamps?.from || seg.from || formatTimestamp(seg.offsets?.from || 0);
            const endStr = seg.timestamps?.to || seg.to || formatTimestamp(seg.offsets?.to || 0);

            segments.push({
              id: i + 1,
              start: startStr,
              end: endStr,
              text
            });
            fullText += `${text} `;
          }

          const outputData: TranscriptionOutput = {
            fileId,
            fileName,
            classFolderName,
            transcribedAt: new Date().toISOString(),
            model: path.basename(config.whisperModelPath),
            language: config.whisperLanguage,
            fullText: fullText.trim(),
            segments
          };

          // Save formatted final JSON
          fs.writeFileSync(finalJsonPath, JSON.stringify(outputData, null, 2), 'utf8');

          // Clean up the raw whisper-cli json output if different
          if (generatedJson !== finalJsonPath && fs.existsSync(generatedJson)) {
            fs.unlinkSync(generatedJson);
          }

          console.log(`\n[Whisper] ✓ Transcripción completada con éxito!`);
          console.log(`[Whisper] Guardado en: ${finalJsonPath}\n`);

          resolve({ jsonPath: finalJsonPath, data: outputData });
        } catch (err) {
          reject(new Error(`Error al procesar el archivo JSON generado por Whisper: ${err}`));
        }
      } else {
        reject(new Error(`whisper-cli terminó con código de salida ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Error al ejecutar whisper-cli: ${err.message}`));
    });
  });
}
