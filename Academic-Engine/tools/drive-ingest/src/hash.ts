import fs from 'fs';
import crypto from 'crypto';

/**
 * Computes the SHA-256 hash of a local file.
 */
export function computeFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Formats a hash for compact display in logs (first 10 chars).
 */
export function shortHash(hash: string): string {
  if (!hash) return '--------';
  return hash.slice(0, 10);
}
