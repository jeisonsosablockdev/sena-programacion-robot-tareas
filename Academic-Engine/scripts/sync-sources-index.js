#!/usr/bin/env node

/**
 * Sources Index Reconciler & Sync Engine
 * Academic-Engine
 * 
 * Synchronizes Sources/SOURCES_INDEX.md with all converted source notes
 * residing in Sources/PDF Converted/ and Sources/Web Converted/.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');
const SOURCES_DIR = path.join(VAULT_DIR, 'Sources');
const PDF_CONVERTED = path.join(SOURCES_DIR, 'PDF Converted');
const WEB_CONVERTED = path.join(SOURCES_DIR, 'Web Converted');
const VIDEO_CONVERTED = path.join(SOURCES_DIR, 'Video Converted');
const CLASES_DIR = path.join(VAULT_DIR, 'Clases');
const INDEX_FILE = path.join(SOURCES_DIR, 'SOURCES_INDEX.md');

function parseFrontmatter(content) {
  const match = content.match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const meta = {};
  for (const line of lines) {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join(':').trim().replace(/^["']|["']$/g, '');
      meta[key] = val;
    }
  }
  return meta;
}

function scanConvertedFolder(baseDir, defaultKind) {
  if (!fs.existsSync(baseDir)) return [];
  const entries = [];
  const items = fs.readdirSync(baseDir);

  for (const item of items) {
    if (item.startsWith('.')) continue;
    const fullPath = path.join(baseDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.md') && !f.startsWith('.'));
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const meta = parseFrontmatter(content);
        entries.push({
          slug: item,
          title: meta.title || item,
          kind: meta.kind || defaultKind,
          year: meta.year || (meta.date_ingested ? (meta.date_ingested || '').slice(0, 4) : '2026'),
          authors: meta.authors || meta.author || '—',
          url: meta.source_url || (defaultKind === 'pdf' ? '[PDF](original.pdf)' : 'web'),
          status: meta.status || 'converted',
          relVaultPath: path.relative(VAULT_DIR, filePath)
        });
      }
    } else if (item.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const meta = parseFrontmatter(content);
      const slug = path.basename(item, '.md');
      entries.push({
        slug,
        title: meta.title || slug,
        kind: meta.kind || defaultKind,
        year: meta.year || (meta.date_ingested ? (meta.date_ingested || '').slice(0, 4) : '2026'),
        authors: meta.authors || meta.author || '—',
        url: meta.source_url || (defaultKind === 'pdf' ? '[PDF](original.pdf)' : 'web'),
        status: meta.status || 'converted',
        relVaultPath: path.relative(VAULT_DIR, fullPath)
      });
    }
  }
  return entries;
}

function main() {
  console.log(`Auditing & Syncing Sources Index...`);

  const pdfSources = scanConvertedFolder(PDF_CONVERTED, 'pdf');
  const webSources = scanConvertedFolder(WEB_CONVERTED, 'web');
  const videoSources = scanConvertedFolder(VIDEO_CONVERTED, 'video');
  const clasesSources = scanConvertedFolder(CLASES_DIR, 'video');
  const allSources = [...pdfSources, ...webSources, ...videoSources, ...clasesSources];

  console.log(`Found ${pdfSources.length} converted PDF source(s).`);
  console.log(`Found ${webSources.length} converted Web source(s).`);
  console.log(`Found ${videoSources.length} converted Video source(s).`);
  console.log(`Found ${clasesSources.length} converted Clases source(s).`);

  // Parse existing index to preserve project approvals
  const approvedProjectsMap = new Map();
  if (fs.existsSync(INDEX_FILE)) {
    const lines = fs.readFileSync(INDEX_FILE, 'utf8').split('\n');
    for (const line of lines) {
      if (!line.startsWith('|') || line.includes('---') || line.includes('Source | Authors')) continue;
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 6) {
        const linkCell = cells[0];
        const projectsCell = cells[5];
        if (projectsCell && projectsCell !== '—') {
          // Extract slug
          const match = linkCell.match(/\[\[(?:[^\|\]]+\/)?([^\|\]]+)\.md(?:\|[^\]]+)?\]\]/);
          if (match) {
            approvedProjectsMap.set(match[1], projectsCell);
          }
        }
      }
    }
  }

  let tableHeader = `# Sources Index\n\nThis table is the canonical index of converted sources in the vault.\n\nRules:\n\n- Add or update one row every time a source is converted.\n- Keep titles and references human-readable in this table.\n- The \`Projects\` column only changes after explicit user approval.\n- If a source stops being used in a project, remove that project from the \`Projects\` column.\n\n| Source | Authors | Year | Kind | Reference | Projects | Status |\n| --- | --- | --- | --- | --- | --- | --- |\n`;

  let rows = '';
  for (const src of allSources) {
    const sourceLink = `[[${src.relVaultPath}|${src.title}]]`;
    const refMarkdown = src.url.startsWith('http') ? `[Link](${src.url})` : src.url;
    const projectApproval = approvedProjectsMap.get(src.slug) || '—';

    rows += `| ${sourceLink} | ${src.authors} | ${src.year} | ${src.kind} | ${refMarkdown} | ${projectApproval} | ${src.status} |\n`;
  }

  const finalContent = tableHeader + rows;
  fs.writeFileSync(INDEX_FILE, finalContent, 'utf8');

  console.log(`\n✅ Sincronizado exitosamente "${INDEX_FILE}" con ${allSources.length} fuente(s).`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
