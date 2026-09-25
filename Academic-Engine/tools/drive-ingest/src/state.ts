import fs from 'fs';
import path from 'path';
import { VAULT_DIR } from './config';

export type FileKind = 'video' | 'pdf' | 'presentation' | 'document' | 'other';

export interface IngestedFileRecord {
  fileId: string;
  fileName: string;
  fileHash?: string; // SHA-256 local
  md5Checksum?: string; // Google Drive md5Checksum
  sizeBytes?: number;
  classFolderName: string;
  mimeType: string;
  kind?: FileKind;
  processedAt: string;
  rawJsonPath?: string; // for video transcript json
  rawArtifactPath?: string; // for downloaded raw materials
  markdownPath?: string; // path to main digest
}

export type DeduplicationStatus =
  | { status: 'ALREADY_PROCESSED'; existing: IngestedFileRecord }
  | { status: 'NEEDS_UPDATE'; existing: IngestedFileRecord }
  | { status: 'DUPLICATE_CONTENT'; existing: IngestedFileRecord }
  | { status: 'NEW_FILE' };

const STATE_FILE_PATH = path.join(VAULT_DIR, 'Sources', '.ingested_videos.json');

export class StateManager {
  private recordsById: Map<string, IngestedFileRecord> = new Map();
  private recordsBySha256: Map<string, IngestedFileRecord> = new Map();
  private recordsByMd5: Map<string, IngestedFileRecord> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    if (fs.existsSync(STATE_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(STATE_FILE_PATH, 'utf8');
        const list: IngestedFileRecord[] = JSON.parse(raw);
        for (const item of list) {
          this.recordsById.set(item.fileId, item);
          if (item.fileHash) {
            this.recordsBySha256.set(item.fileHash.toLowerCase(), item);
          }
          if (item.md5Checksum) {
            this.recordsByMd5.set(item.md5Checksum.toLowerCase(), item);
          }
        }
      } catch (err) {
        console.warn(`[StateManager] Advertencia: no se pudo leer el archivo de estado: ${err}`);
      }
    }
  }

  public save(): void {
    const list = Array.from(this.recordsById.values());
    const dir = path.dirname(STATE_FILE_PATH);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(list, null, 2), 'utf8');
  }

  /**
   * Evaluates deduplication status of a file using both Drive fileId and content hashing.
   */
  public checkStatus(
    fileId: string,
    currentSha256?: string,
    driveMd5?: string
  ): DeduplicationStatus {
    const byId = this.recordsById.get(fileId);

    // 1. If fileId is recognized
    if (byId) {
      if (driveMd5 && byId.md5Checksum) {
        if (driveMd5.toLowerCase() !== byId.md5Checksum.toLowerCase()) {
          return { status: 'NEEDS_UPDATE', existing: byId };
        }
      }
      if (currentSha256 && byId.fileHash) {
        if (currentSha256.toLowerCase() !== byId.fileHash.toLowerCase()) {
          return { status: 'NEEDS_UPDATE', existing: byId };
        }
      }
      return { status: 'ALREADY_PROCESSED', existing: byId };
    }

    // 2. If fileId is not recognized, check if content hash matches an existing file (deduplication)
    if (driveMd5) {
      const byMd5 = this.recordsByMd5.get(driveMd5.toLowerCase());
      if (byMd5) {
        return { status: 'DUPLICATE_CONTENT', existing: byMd5 };
      }
    }

    if (currentSha256) {
      const bySha = this.recordsBySha256.get(currentSha256.toLowerCase());
      if (bySha) {
        return { status: 'DUPLICATE_CONTENT', existing: bySha };
      }
    }

    return { status: 'NEW_FILE' };
  }

  /**
   * Records a duplicate file by linking it to the existing record's artifacts.
   */
  public markDuplicate(
    item: { id: string; name: string; sizeBytes?: number; classFolderName: string; mimeType: string; kind?: FileKind; md5Checksum?: string },
    existing: IngestedFileRecord,
    localHash?: string
  ): void {
    this.markProcessed({
      fileId: item.id,
      fileName: item.name,
      fileHash: localHash || existing.fileHash,
      md5Checksum: item.md5Checksum || existing.md5Checksum,
      sizeBytes: item.sizeBytes || existing.sizeBytes,
      classFolderName: item.classFolderName,
      mimeType: item.mimeType,
      kind: item.kind || existing.kind,
      processedAt: new Date().toISOString(),
      markdownPath: existing.markdownPath,
      rawArtifactPath: existing.rawArtifactPath,
      rawJsonPath: existing.rawJsonPath
    });
  }

  public markProcessed(record: IngestedFileRecord): void {
    this.recordsById.set(record.fileId, record);
    if (record.fileHash) {
      this.recordsBySha256.set(record.fileHash.toLowerCase(), record);
    }
    if (record.md5Checksum) {
      this.recordsByMd5.set(record.md5Checksum.toLowerCase(), record);
    }
    this.save();
  }
}
