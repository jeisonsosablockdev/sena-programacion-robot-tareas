#!/usr/bin/env node

/**
 * Vault Governance & Deliverables Linter
 * Enforces file naming, folder taxonomy, YAML properties, callouts, and changelog compliance.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_ROOT = path.join(ROOT_DIR, 'Academic Vault');

const ALLOWED_TOP_FOLDERS = [
  'Sources',
  'Reviews',
  'Hypotheses',
  'Drafts',
  'Concepts',
  'Projects',
  'Inbox',
  'Exports',
  '00 System',
  'Clases',
  'Profesores'
];

function getAllMarkdownFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);

  for (const item of items) {
    if (item.startsWith('.')) continue; // ignore .obsidian, etc.
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (item === 'Archive' || item === 'Assets' || item === 'Specs' || item === 'raw-sources') continue; // skip archive snapshots, asset folders, in-flight specs, and raw research transcripts from strict deliverable linting
      getAllMarkdownFiles(fullPath, fileList);
    } else if (item.endsWith('.md')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function lintNote(filePath) {
  const relPath = path.relative(VAULT_ROOT, filePath);
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  const errors = [];
  const warnings = [];

  // 1. Skip Workspace Map, root guides or Index files from strict frontmatter rules
  const isSpecialDoc = 
    fileName.toLowerCase() === 'workspace map.md' || 
    fileName.toLowerCase() === 'index.md' ||
    fileName.toLowerCase() === 'master_index.md' ||
    fileName.toLowerCase() === 'projects_index.md' ||
    fileName.toLowerCase() === 'sources_index.md' ||
    fileName.toLowerCase() === 'readme.md' ||
    fileName.toLowerCase() === 'bienvenido.md' ||
    fileName.endsWith('_INDEX.md') ||
    fileName.endsWith('_WORKFLOW.md');

  // 2. Check Naming Convention (Kebab-case, lowercase)
  if (!isSpecialDoc) {
    const baseNoExt = path.basename(filePath, '.md');
    const isKebab = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(baseNoExt);
    if (!isKebab) {
      warnings.push(`Nombre de archivo no sigue kebab-case estricto: "${fileName}"`);
    }
  }

  // 3. Check Taxonomy Folder
  const pathParts = relPath.split(path.sep);
  const isRootFile = pathParts.length === 1;
  const topFolder = pathParts[0];

  if (!isSpecialDoc && !isRootFile && !ALLOWED_TOP_FOLDERS.includes(topFolder)) {
    errors.push(`Carpeta fuera de la taxonomía oficial del vault: "${topFolder}"`);
  }

  // 4. Check Frontmatter
  if (!isSpecialDoc) {
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) {
      warnings.push('Falta YAML Frontmatter (Properties de Obsidian)');
    } else {
      const fmText = fmMatch[1];
      if (!fmText.includes('version:')) warnings.push('Falta propiedad "version" en frontmatter');
      if (!fmText.includes('status:')) warnings.push('Falta propiedad "status" en frontmatter');
      if (!fmText.includes('workflow:')) warnings.push('Falta propiedad "workflow" en frontmatter');
    }

    // 5. Check Executive Summary Callout
    if (!content.includes('> [!NOTE]')) {
      warnings.push('Falta callout de Resumen Ejecutivo (> [!NOTE])');
    }

    // 6. Check Changelog
    if (!content.includes('Historial de Revisiones') && !content.includes('Changelog')) {
      warnings.push('Falta sección de Historial de Revisiones (Changelog)');
    }
  }

  return { file: relPath, errors, warnings, isSpecialDoc };
}

function runAudit() {
  console.log('\n' + '═'.repeat(75));
  console.log('🏛️ AUDITORÍA DE ENFORCEMENT: BÓVEDA OBSIDIAN (ACADEMIC VAULT)');
  console.log('═'.repeat(75));

  const files = getAllMarkdownFiles(VAULT_ROOT);
  let totalErrors = 0;
  let totalWarnings = 0;
  let passedCount = 0;

  console.log(`📁 Total de documentos analizados: ${files.length}\n`);

  for (const f of files) {
    const result = lintNote(f);
    if (result.errors.length > 0 || result.warnings.length > 0) {
      console.log(`📄 ${result.file}`);
      for (const err of result.errors) {
        console.log(`   ❌ Error:   ${err}`);
        totalErrors++;
      }
      for (const warn of result.warnings) {
        console.log(`   ⚠️ Aviso:   ${warn}`);
        totalWarnings++;
      }
      console.log('');
    } else {
      console.log(`✅ ${result.file} (Cumple 100% las normas)`);
      passedCount++;
    }
  }

  console.log('─'.repeat(75));
  console.log(`Resumen de Cumplimiento de la Bóveda:`);
  console.log(`   • Notas 100% conformes: ${passedCount}`);
  console.log(`   • Avisos detectados:    ${totalWarnings}`);
  console.log(`   • Errores críticos:     ${totalErrors}`);
  console.log('═'.repeat(75) + '\n');

  return totalErrors === 0;
}

runAudit();
