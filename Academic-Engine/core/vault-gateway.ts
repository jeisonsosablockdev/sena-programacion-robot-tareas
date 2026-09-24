/**
 * Vault Gateway: Pure abstraction for Academic Vault filesystem operations.
 * Enforces non-destructive safety backups, spec lifecycle storage, and deliverable commitments.
 * 
 * @spec SPEC-001
 */

import fs from 'node:fs';
import path from 'node:path';

export interface SpecPaths {
  slug: string;
  specId: string;
  specMdPath: string;
  specJsonPath: string;
  workDir: string;
  approvedSpecPath: string;
  approvedDraftPath: string;
}

export interface TaskSpecData {
  slug: string;
  title: string;
  target_folder: string;
  subagents: string[];
  icp: string;
  goal: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  iteration?: number;
  evaluations?: any[];
}

export class VaultGateway {
  private vaultDir: string;
  private specsDir: string;
  private archiveDir: string;
  private templatesDir: string;

  constructor(vaultDir?: string, templatesDir?: string) {
    const scriptDir = import.meta.dirname ?? process.cwd();
    const rootDir = path.resolve(scriptDir, '../..');
    this.vaultDir = vaultDir || path.join(rootDir, 'Academic Vault');
    this.specsDir = path.join(this.vaultDir, 'Inbox', 'Specs');
    this.archiveDir = path.join(this.vaultDir, 'Inbox', 'Archive');
    this.templatesDir = templatesDir || path.join(rootDir, 'Academic-Engine', 'templates');

    this.ensureDir(this.specsDir);
    this.ensureDir(this.archiveDir);
  }

  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  getVaultDir(): string {
    return this.vaultDir;
  }

  getSpecsDir(): string {
    return this.specsDir;
  }

  getArchiveDir(): string {
    return this.archiveDir;
  }

  sanitizeSlug(slug: string): string {
    return (slug || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  getSpecPaths(slug: string): SpecPaths {
    const cleanSlug = this.sanitizeSlug(slug);
    this.ensureDir(this.specsDir);
    return {
      slug: cleanSlug,
      specId: `SPEC-${cleanSlug.toUpperCase()}`,
      specMdPath: path.join(this.specsDir, `${cleanSlug}.spec.md`),
      specJsonPath: path.join(this.specsDir, `${cleanSlug}.spec.json`),
      workDir: path.join(this.specsDir, `${cleanSlug}-work`),
      approvedSpecPath: path.join(this.specsDir, `${cleanSlug}-work`, 'approved_spec.md'),
      approvedDraftPath: path.join(this.specsDir, `${cleanSlug}-work`, 'approved_draft.md')
    };
  }

  specExists(slug: string): boolean {
    const paths = this.getSpecPaths(slug);
    return fs.existsSync(paths.specJsonPath);
  }

  loadSpec(slug: string): { data: TaskSpecData; paths: SpecPaths } {
    const paths = this.getSpecPaths(slug);
    if (!fs.existsSync(paths.specJsonPath)) {
      throw new Error(`Spec not found: "${slug}" at ${paths.specJsonPath}`);
    }
    const raw = fs.readFileSync(paths.specJsonPath, 'utf8');
    const data: TaskSpecData = JSON.parse(raw);
    return { data, paths };
  }

  saveSpec(slug: string, data: TaskSpecData, markdownContent?: string): void {
    const paths = this.getSpecPaths(slug);
    this.ensureDir(path.dirname(paths.specJsonPath));

    data.slug = paths.slug;
    data.updated_at = new Date().toISOString();
    if (!data.created_at) {
      data.created_at = data.updated_at;
    }

    fs.writeFileSync(paths.specJsonPath, JSON.stringify(data, null, 2), 'utf8');

    if (markdownContent !== undefined) {
      fs.writeFileSync(paths.specMdPath, markdownContent, 'utf8');
    }
  }

  /**
   * Creates a timestamped safety backup in Inbox/Archive before modifying a note.
   * Enforces the non-destructive content refinement rule.
   */
  createSafetyBackup(targetPath: string): string | null {
    if (!fs.existsSync(targetPath)) {
      return null;
    }

    this.ensureDir(this.archiveDir);
    const parsed = path.parse(targetPath);
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const backupFileName = `${parsed.name}-bak-${timestamp}${parsed.ext}`;
    const backupPath = path.join(this.archiveDir, backupFileName);

    fs.copyFileSync(targetPath, backupPath);
    return backupPath;
  }

  /**
   * Commits deliverable to the vault canonical folder.
   * Generates a safety backup if the deliverable file already exists.
   */
  commitDeliverable(slug: string, content: string, targetFolder: string = 'Drafts'): string {
    const cleanSlug = this.sanitizeSlug(slug);
    const targetDir = path.join(this.vaultDir, targetFolder);
    this.ensureDir(targetDir);

    const deliverablePath = path.join(targetDir, `${cleanSlug}.md`);
    if (fs.existsSync(deliverablePath)) {
      this.createSafetyBackup(deliverablePath);
    }

    fs.writeFileSync(deliverablePath, content, 'utf8');
    return deliverablePath;
  }

  listSpecs(): Array<{ slug: string; title: string; status: string }> {
    this.ensureDir(this.specsDir);
    const entries = fs.readdirSync(this.specsDir);
    const jsonFiles = entries.filter(f => f.endsWith('.spec.json'));

    const results: Array<{ slug: string; title: string; status: string }> = [];
    for (const file of jsonFiles) {
      try {
        const fullPath = path.join(this.specsDir, file);
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        results.push({
          slug: data.slug || path.basename(file, '.spec.json'),
          title: data.title || '',
          status: data.status || 'unknown'
        });
      } catch {
        // Skip corrupted JSON
      }
    }
    return results;
  }
}
