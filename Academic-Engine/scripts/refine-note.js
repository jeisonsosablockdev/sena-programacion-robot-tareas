#!/usr/bin/env node

/**
 * Non-Destructive Refinement & Content Governance CLI for BRIDS
 * Ensures notes are never accidentally wiped, takes safety snapshots,
 * manages incremental versioning, and appends to the document Changelog.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_ROOT = path.join(ROOT_DIR, 'Academic Vault');
const ARCHIVE_DIR = path.join(VAULT_ROOT, 'Inbox', 'Archive');

function ensureArchiveDir() {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
}

function resolveVaultPath(inputPath) {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }
  // Check if relative to workspace root or to vault root
  const directPath = path.join(ROOT_DIR, inputPath);
  if (fs.existsSync(directPath)) return directPath;

  const vaultPath = path.join(VAULT_ROOT, inputPath);
  return vaultPath;
}

function createSnapshot(filePath) {
  if (!fs.existsSync(filePath)) return null;
  ensureArchiveDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = path.basename(filePath);
  const snapshotName = `${baseName}.${timestamp}.bak.md`;
  const snapshotPath = path.join(ARCHIVE_DIR, snapshotName);

  fs.copyFileSync(filePath, snapshotPath);
  return snapshotPath;
}

function parseMarkdown(content) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: {},
      rawFrontmatter: '',
      body: content,
      hasFrontmatter: false
    };
  }

  const rawFrontmatter = match[1];
  const body = match[2];
  const frontmatter = {};

  for (const line of rawFrontmatter.split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && !line.trim().startsWith('-')) {
      const key = line.substring(0, colonIdx).trim();
      const val = line.substring(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = val;
    }
  }

  return { frontmatter, rawFrontmatter, body, hasFrontmatter: true };
}

function bumpVersion(currentVersion, bumpType = 'minor') {
  if (!currentVersion) return '1.1';
  const parts = String(currentVersion).split('.').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return '1.1';

  let [major, minor] = parts;
  if (bumpType === 'major') {
    major += 1;
    minor = 0;
  } else {
    minor += 1;
  }
  return `${major}.${minor}`;
}

// -------------------------------------------------------------
// COMMANDS
// -------------------------------------------------------------

function cmdInspect(targetInput) {
  if (!targetInput) {
    console.error('Uso: refine-note inspect <ruta-del-archivo>');
    process.exit(1);
  }
  const filePath = resolveVaultPath(targetInput);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: El archivo no existe en ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body, hasFrontmatter } = parseMarkdown(content);
  const headings = (body.match(/^#{1,3}\s+.+$/gm) || []).map(h => h.trim());

  console.log('\n' + '═'.repeat(75));
  console.log(`📄 AUDITORÍA DE CONTENIDO: ${path.basename(filePath)}`);
  console.log('═'.repeat(75));
  console.log(`📍 Ruta:     ${filePath}`);
  console.log(`🏷️ Frontmatter: ${hasFrontmatter ? 'Presente' : 'Sin Frontmatter'}`);
  if (hasFrontmatter) {
    console.log(`   • Título:    ${frontmatter.title || 'N/A'}`);
    console.log(`   • Versión:   ${frontmatter.version || '1.0'}`);
    console.log(`   • Estado:    ${frontmatter.status || 'draft'}`);
    console.log(`   • Workflow:  ${frontmatter.workflow || 'N/A'}`);
  }
  console.log(`\n📑 Secciones y Encabezados Detectados (${headings.length}):`);
  for (const h of headings) {
    console.log(`   ${h}`);
  }
  console.log('═'.repeat(75) + '\n');
}

function cmdBackup(targetInput) {
  if (!targetInput) {
    console.error('Uso: refine-note backup <ruta-del-archivo>');
    process.exit(1);
  }
  const filePath = resolveVaultPath(targetInput);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: El archivo no existe en ${filePath}`);
    process.exit(1);
  }

  const snapshotPath = createSnapshot(filePath);
  console.log(`\n🛡️ Snapshot de seguridad creado exitosamente:`);
  console.log(`   Origen:  ${filePath}`);
  console.log(`   Copia:   ${snapshotPath}\n`);
}

function cmdRefine(targetInput, changeSummary, bumpType = 'minor') {
  if (!targetInput || !changeSummary) {
    console.error('Uso: refine-note refine <ruta-del-archivo> "<resumen-del-refinamiento>" [minor|major]');
    console.error('Ejemplo: refine-note refine "03 Website & Copy/landing-v1.md" "Pulido de titulares y propuesta de valor" minor');
    process.exit(1);
  }

  const filePath = resolveVaultPath(targetInput);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: El archivo no existe en ${filePath}`);
    process.exit(1);
  }

  // 1. Crear Snapshot de respaldo automático
  const snapshotPath = createSnapshot(filePath);

  // 2. Leer y parsear contenido
  let content = fs.readFileSync(filePath, 'utf8');
  let { frontmatter, body, hasFrontmatter } = parseMarkdown(content);

  const currentVersion = frontmatter.version || '1.0';
  const newVersion = bumpVersion(currentVersion, bumpType);
  const now = new Date().toISOString().split('T')[0];

  // 3. Actualizar Frontmatter
  if (hasFrontmatter) {
    content = content.replace(/^version:\s*.*$/m, `version: "${newVersion}"`);
    if (!content.includes('version:')) {
      content = content.replace(/^---\r?\n/, `---\nversion: "${newVersion}"\n`);
    }
    content = content.replace(/^updated_at:\s*.*$/m, `updated_at: ${now}`);
    if (!content.includes('updated_at:')) {
      content = content.replace(/^---\r?\n/, `---\nupdated_at: ${now}\n`);
    }
  }

  // 4. Actualizar / Insertar Changelog
  const changelogEntry = `- **v${newVersion} (${now}):** ${changeSummary.trim()}`;
  if (content.includes('## 🔄 Historial de Revisiones (Changelog)')) {
    content = content.replace(
      '## 🔄 Historial de Revisiones (Changelog)',
      `## 🔄 Historial de Revisiones (Changelog)\n${changelogEntry}`
    );
  } else if (content.includes('## Historial de Revisiones')) {
    content = content.replace(
      '## Historial de Revisiones',
      `## Historial de Revisiones\n${changelogEntry}`
    );
  } else {
    // Insertar al pie antes de referencias
    if (content.includes('## 🔗 Referencias Cruzadas')) {
      content = content.replace(
        '## 🔗 Referencias Cruzadas',
        `## 🔄 Historial de Revisiones (Changelog)\n${changelogEntry}\n\n## 🔗 Referencias Cruzadas`
      );
    } else {
      content += `\n\n## 🔄 Historial de Revisiones (Changelog)\n${changelogEntry}\n`;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');

  console.log(`\n✨ Documento refinado con éxito (No-Destructivo):`);
  console.log(`   Archivo:       ${filePath}`);
  console.log(`   Versión:       v${currentVersion} ➔ v${newVersion}`);
  console.log(`   Registro:      ${changelogEntry}`);
  console.log(`   Snapshot Prev: ${snapshotPath}\n`);
}

function cmdBranchVersion(targetInput, newVersionLabel, purpose) {
  if (!targetInput || !newVersionLabel) {
    console.error('Uso: refine-note branch <ruta-del-archivo> <v2|v3|nueva-etiqueta> "[proposito]"');
    console.error('Ejemplo: refine-note branch "03 Website & Copy/landing-v1.md" v2 "Enfoque agresivo para lanzamiento"');
    process.exit(1);
  }

  const filePath = resolveVaultPath(targetInput);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: El archivo no existe en ${filePath}`);
    process.exit(1);
  }

  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseNoExt = path.basename(filePath, ext).replace(/-v\d+.*$/, '');
  const now = new Date().toISOString().split('T')[0];
  const newFileName = `${baseNoExt}-${newVersionLabel}-${now}${ext}`;
  const newFilePath = path.join(dir, newFileName);

  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/^version:\s*.*$/m, `version: "2.0"`);
  content = content.replace(/^created_at:\s*.*$/m, `created_at: ${now}`);
  content = content.replace(/^updated_at:\s*.*$/m, `updated_at: ${now}`);

  const changelogEntry = `- **v2.0 (${now}):** Nueva ramificación independiente: ${purpose || 'Nueva versión'}`;
  if (content.includes('## 🔄 Historial de Revisiones (Changelog)')) {
    content = content.replace(
      '## 🔄 Historial de Revisiones (Changelog)',
      `## 🔄 Historial de Revisiones (Changelog)\n${changelogEntry}`
    );
  }

  fs.writeFileSync(newFilePath, content, 'utf8');
  console.log(`\n🌱 Nueva versión ramificada creada (Original preservado intacto):`);
  console.log(`   Original: ${filePath}`);
  console.log(`   Nuevo:    ${newFilePath}\n`);
}

function cmdRollback(targetInput) {
  if (!targetInput) {
    console.error('Uso: refine-note rollback <ruta-del-archivo>');
    process.exit(1);
  }
  const filePath = resolveVaultPath(targetInput);
  const baseName = path.basename(filePath);

  ensureArchiveDir();
  const backups = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.startsWith(baseName) && f.endsWith('.bak.md'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    console.error(`❌ No se encontraron snapshots de respaldo para "${baseName}" en Inbox/Archive.`);
    process.exit(1);
  }

  const latestBackup = path.join(ARCHIVE_DIR, backups[0]);
  fs.copyFileSync(latestBackup, filePath);

  console.log(`\n⏪ Documento restaurado exitosamente desde el snapshot más reciente:`);
  console.log(`   Restaurado en: ${filePath}`);
  console.log(`   Desde backup:  ${latestBackup}\n`);
}

// -------------------------------------------------------------
// CLI ROUTER
// -------------------------------------------------------------

const [,, command, ...args] = process.argv;

switch (command) {
  case 'inspect':
    cmdInspect(args[0]);
    break;
  case 'backup':
    cmdBackup(args[0]);
    break;
  case 'refine':
    cmdRefine(args[0], args[1], args[2]);
    break;
  case 'branch':
  case 'version':
    cmdBranchVersion(args[0], args[1], args[2]);
    break;
  case 'rollback':
  case 'restore':
    cmdRollback(args[0]);
    break;
  default:
    console.log(`
Non-Destructive Refinement & Content Governance CLI (BRIDS)

Comandos disponibles:
  inspect   <ruta>                            Audita el estado, frontmatter y secciones del archivo
  backup    <ruta>                            Crea un snapshot de seguridad en Inbox/Archive/
  refine    <ruta> "<resumen>" [minor|major]  Actualiza versión, registra changelog y crea snapshot previo
  branch    <ruta> <v2|v3> "[proposito]"      Crea una nueva versión manteniendo el original intacto
  rollback  <ruta>                            Restaura el archivo al snapshot de seguridad más reciente
`);
    break;
}
