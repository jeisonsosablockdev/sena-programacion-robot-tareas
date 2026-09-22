#!/usr/bin/env node

/**
 * Vault Integrity, Drift Repair & Coherence Engine
 * Academic-Engine
 * 
 * Verifies vault topology, restores missing canonical folders,
 * repairs symlink views, reconciles project indexes, and removes anomalies.
 */

const fs = require('fs');
const path = require('path');
const syncSources = require('./sync-sources-index.js');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');

const MANDATORY_FOLDERS = [
  'Sources',
  'Sources/PDF Unconverted',
  'Sources/PDF Converted',
  'Sources/Web Converted',
  'Reviews',
  'Hypotheses',
  'Drafts',
  'Concepts',
  'Projects',
  'Inbox',
  'Exports',
  '00 System'
];

function repairFolders() {
  console.log(`\n📁 Checking mandatory vault directories...`);
  for (const rel of MANDATORY_FOLDERS) {
    const full = path.join(VAULT_DIR, rel);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
      console.log(`  [CREATED] ${rel}`);
    }
  }
}

function removeAnomalies() {
  console.log(`\n🧹 Checking for path anomalies...`);
  const anomalyUserDir = path.join(VAULT_DIR, 'Users');
  if (fs.existsSync(anomalyUserDir)) {
    fs.rmSync(anomalyUserDir, { recursive: true, force: true });
    console.log(`  [REMOVED] Anomaly directory: "Academic Vault/Users"`);
  }
}

function repairProjects() {
  console.log(`\n🏗️  Auditing and repairing projects...`);
  const projectsDir = path.join(VAULT_DIR, 'Projects');
  if (!fs.existsSync(projectsDir)) return;

  const entries = fs.readdirSync(projectsDir);
  const projects = [];

  for (const item of entries) {
    if (item.startsWith('.') || item === 'Requirements' || item === 'PROJECTS_INDEX.md') continue;
    const projectPath = path.join(projectsDir, item);
    if (!fs.statSync(projectPath).isDirectory()) continue;

    const projectName = item;
    projects.push(projectName);
    console.log(`\n  Auditing Project: "${projectName}"`);

    // 1. Canonical folders
    const canonDrafts = path.join(VAULT_DIR, 'Drafts', projectName);
    const canonReviews = path.join(VAULT_DIR, 'Reviews', projectName);
    const canonHypotheses = path.join(VAULT_DIR, 'Hypotheses', projectName);
    const exportsDir = path.join(projectPath, 'Exports');

    for (const [name, dir] of [['Drafts', canonDrafts], ['Reviews', canonReviews], ['Hypotheses', canonHypotheses], ['Exports', exportsDir]]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`    [RESTORED] Canonical ${name} folder`);
      }
    }

    // 2. Symlink views inside Projects/<Project Name>/
    const symlinks = [
      { link: path.join(projectPath, 'Drafts'), target: path.join('..', '..', 'Drafts', projectName) },
      { link: path.join(projectPath, 'Reviews'), target: path.join('..', '..', 'Reviews', projectName) },
      { link: path.join(projectPath, 'Hypotheses'), target: path.join('..', '..', 'Hypotheses', projectName) }
    ];

    for (const { link, target } of symlinks) {
      try {
        let needsLink = true;
        if (fs.existsSync(link)) {
          const stat = fs.lstatSync(link);
          if (stat.isSymbolicLink()) {
            const currentTarget = fs.readlinkSync(link);
            if (currentTarget === target) {
              needsLink = false;
            } else {
              fs.unlinkSync(link);
            }
          } else {
            // It's a real directory, rename to avoid loss if not empty
            console.warn(`    [WARN] Non-symlink found at ${link}, renaming to backup`);
            fs.renameSync(link, `${link}.backup-${Date.now()}`);
          }
        }
        if (needsLink) {
          fs.symlinkSync(target, link, 'dir');
          console.log(`    [SYMLINK] Repaired ${path.basename(link)} -> ${target}`);
        }
      } catch (e) {
        console.warn(`    [WARN] Symlink error for ${link}: ${e.message}`);
      }
    }
  }

  // 3. Reconcile PROJECTS_INDEX.md
  const projectsIndexFile = path.join(projectsDir, 'PROJECTS_INDEX.md');
  let pHeader = `# Projects Index\n\nThis table is the canonical registry of projects in the vault.\n\nRules:\n\n- Every real project must live in its own folder under \`Projects/\`.\n- Every project folder must contain \`PROJECT_INDEX.md\`.\n- Formal delivery work should also include \`PROJECT_REQUIREMENTS.md\` and \`EXPORT_MANIFEST.md\` when applicable.\n- Canonical project writing lives in \`Drafts/<Project Name>/\`, \`Reviews/<Project Name>/\`, and \`Hypotheses/<Project Name>/\`.\n- Project folders should expose \`Drafts\`, \`Reviews\`, and \`Hypotheses\` as symlink views to those canonical folders.\n- \`PROJECT_INDEX.md\` and \`EXPORT_MANIFEST.md\` must point to the canonical paths, not to the symlink views.\n- Do not create standalone project notes directly in \`Projects/\`.\n- After creating or restructuring a project, rebuild this index.\n\n| Project | Status | Index | Requirements | Export | Question / Goal |\n| --- | --- | --- | --- | --- | --- |\n`;

  let pRows = '';
  for (const p of projects) {
    pRows += `| ${p} | active | [[Projects/${p}/PROJECT_INDEX|Project Index]] | [[Projects/${p}/PROJECT_REQUIREMENTS|Requirements]] | [[Projects/${p}/EXPORT_MANIFEST|Manifest]] | Proyecto activo |\n`;
  }
  fs.writeFileSync(projectsIndexFile, pHeader + pRows, 'utf8');
  console.log(`  [INDEX] Reconciled Projects/PROJECTS_INDEX.md (${projects.length} project(s)).`);
}

function main() {
  console.log(`========================================`);
  console.log(`  Academic Vault Drift Repair & Linter  `);
  console.log(`========================================`);

  repairFolders();
  removeAnomalies();
  repairProjects();

  console.log(`\n📚 Reconciling Sources Index...`);
  syncSources.main();

  console.log(`\n✨ Vault healthcheck & repair complete. All structures verified.\n`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
