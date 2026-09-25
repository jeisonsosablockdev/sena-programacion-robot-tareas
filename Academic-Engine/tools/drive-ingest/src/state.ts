import fs from 'fs';
import path from 'path';
import { VAULT_DIR } from './config';

export interface IngestedVideoRecord {
  fileId: string;
  fileName: string;
  classFolderName: string;
  mimeType: string;
  processedAt: string;
  rawJsonPath: string;
  markdownPath?: string;
}

const STATE_FILE_PATH = path.join(VAULT_DIR, 'Sources', '.ingested_videos.json');

export class StateManager {
  private records: Map<string, IngestedVideoRecord> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    if (fs.existsSync(STATE_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(STATE_FILE_PATH, 'utf8');
        const list: IngestedVideoRecord[] = JSON.parse(raw);
        for (const item of list) {
          this.records.set(item.fileId, item);
        }
      } catch (err) {
        console.warn(`[StateManager] Warning: could not parse state file: ${err}`);
      }
    }
  }

  public save(): void {
    const list = Array.from(this.records.values());
    const dir = path.dirname(STATE_FILE_PATH);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(list, null, 2), 'utf8');
  }

  public isProcessed(fileId: string): boolean {
    return this.records.has(fileId);
  }

  public markProcessed(record: IngestedVideoRecord): void {
    this.records.set(record.fileId, record);
    this.save();
  }
}
