import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Resolve project root (two levels up from tools/drive-ingest)
export const ROOT_DIR = path.resolve(__dirname, '../../../..');
export const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');
export const VIDEO_RAW_DIR = path.join(VAULT_DIR, 'Sources', 'Video Raw');
export const CLASES_DIR = path.join(VAULT_DIR, 'Clases');
export const TEMP_AUDIO_DIR = path.join(ROOT_DIR, 'Academic-Engine', 'scratch', 'temp_audio');
export const MODELS_DIR = path.join(__dirname, '..', 'models');
export const ENV_PATH = path.join(ROOT_DIR, '.env');
export const ENV_LOCAL_PATH = path.join(ROOT_DIR, '.env.local');

// Load environment variables (.env.local overrides .env)
if (fs.existsSync(ENV_PATH)) {
  dotenv.config({ path: ENV_PATH });
}
if (fs.existsSync(ENV_LOCAL_PATH)) {
  dotenv.config({ path: ENV_LOCAL_PATH, override: true });
}

export function getActiveEnvPath(): string {
  if (fs.existsSync(ENV_LOCAL_PATH)) return ENV_LOCAL_PATH;
  return ENV_PATH;
}

export interface AppConfig {
  googleClientId: string;
  googleClientSecret: string;
  googleDriveFolderId: string;
  googleRefreshToken: string;
  whisperModelPath: string;
  whisperLanguage: string;
}

export function getConfig(): AppConfig {
  const modelName = process.env.WHISPER_MODEL || 'ggml-large-v3-turbo.bin';
  const modelPath = path.isAbsolute(modelName) ? modelName : path.join(MODELS_DIR, modelName);

  return {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
    googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
    whisperModelPath: modelPath,
    whisperLanguage: process.env.WHISPER_LANGUAGE || 'es'
  };
}

/**
 * Updates or adds keys in .env file safely preserving existing contents.
 */
export function updateEnvVariables(updates: Record<string, string>): void {
  const targetPath = getActiveEnvPath();
  let content = '';
  if (fs.existsSync(targetPath)) {
    content = fs.readFileSync(targetPath, 'utf8');
  } else if (fs.existsSync(path.join(ROOT_DIR, '.env.example'))) {
    content = fs.readFileSync(path.join(ROOT_DIR, '.env.example'), 'utf8');
  }

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}="${value}"`;
    if (regex.test(content)) {
      content = content.replace(regex, newLine);
    } else {
      content = content.trimEnd() + `\n${newLine}\n`;
    }
    // Update active process.env
    process.env[key] = value;
  }

  fs.writeFileSync(targetPath, content, 'utf8');
}
