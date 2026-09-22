#!/usr/bin/env node

/**
 * Academic & Software Project Scaffolder
 * Academic-Engine
 * 
 * Creates a complete project workspace in Academic Vault following
 * canonical folder conventions, relative symlink views, project index,
 * requirements document, and export manifest.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'Academic-Engine', 'templates');

const PROJECTS_INDEX_FILE = path.join(VAULT_DIR, 'Projects', 'PROJECTS_INDEX.md');
const MASTER_INDEX_FILE = path.join(VAULT_DIR, 'MASTER_INDEX.md');

function sanitizeName(name) {
  return name.trim().replace(/[/\\?%*:|"<>]/g, '-');
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Uso:
  bash Academic-Engine/scripts/new-project.sh "<Nombre del Proyecto>" "[pregunta o meta]" "[autor]"

Ejemplo:
  bash Academic-Engine/scripts/new-project.sh "Sistema Gestion Inventario SENA" "Desarrollo de API REST con Python y MySQL" "Julian David Sosa Rico"
`);
    return;
  }

  const rawName = args[0];
  const projectName = sanitizeName(rawName);
  const goal = args[1] || 'Desarrollo de proyecto de software formativo SENA';
  const author = args[2] || 'Julian David Sosa Rico';
  const currentDate = new Date().toISOString().split('T')[0];

  console.log(`\n🚀 Initializing project: "${projectName}"`);

  // 1. Canonical directories
  const draftsDir = path.join(VAULT_DIR, 'Drafts', projectName);
  const reviewsDir = path.join(VAULT_DIR, 'Reviews', projectName);
  const hypothesesDir = path.join(VAULT_DIR, 'Hypotheses', projectName);
  const projectDir = path.join(VAULT_DIR, 'Projects', projectName);
  const exportsDir = path.join(projectDir, 'Exports');

  for (const dir of [draftsDir, reviewsDir, hypothesesDir, projectDir, exportsDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 2. Relative Symlinks inside Projects/<Project Name>/
  // Drafts -> ../../Drafts/<Project Name>
  // Reviews -> ../../Reviews/<Project Name>
  // Hypotheses -> ../../Hypotheses/<Project Name>
  const symlinks = [
    { link: path.join(projectDir, 'Drafts'), target: path.join('..', '..', 'Drafts', projectName) },
    { link: path.join(projectDir, 'Reviews'), target: path.join('..', '..', 'Reviews', projectName) },
    { link: path.join(projectDir, 'Hypotheses'), target: path.join('..', '..', 'Hypotheses', projectName) }
  ];

  for (const { link, target } of symlinks) {
    try {
      if (fs.existsSync(link)) {
        const stat = fs.lstatSync(link);
        if (stat.isSymbolicLink()) fs.unlinkSync(link);
      }
      fs.symlinkSync(target, link, 'dir');
      console.log(`  [SYMLINK] ${path.basename(link)} -> ${target}`);
    } catch (e) {
      console.warn(`  [WARN] Symlink creation warning for ${link}: ${e.message}`);
    }
  }

  // 3. PROJECT_INDEX.md
  const projectIndexPath = path.join(projectDir, 'PROJECT_INDEX.md');
  if (!fs.existsSync(projectIndexPath)) {
    const content = `# Project Index: ${projectName}

## Metadatos del Proyecto

- **Título:** ${projectName}
- **Institución:** SENA (Servicio Nacional de Aprendizaje)
- **Programa:** Programación de Software (Virtual)
- **Aprendiz / Autor:** ${author}
- **Fecha de Inicio:** ${currentDate}
- **Estado:** active

## Objetivo General

${goal}

## Enlaces Canónicos del Proyecto

- [[Projects/${projectName}/PROJECT_REQUIREMENTS|Requerimientos del Proyecto]]
- [[Projects/${projectName}/EXPORT_MANIFEST|Manifiesto de Exportación]]
- **Borradores Canónicos:** \`Academic Vault/Drafts/${projectName}/\`
- **Revisiones Canónicas:** \`Academic Vault/Reviews/${projectName}/\`
- **Hipótesis / Decisiones de Arquitectura:** \`Academic Vault/Hypotheses/${projectName}/\`

## Fuentes Aprobadas

| Fuente | Tipo | Aporte al Proyecto |
|---|---|---|

## Registro de Entregables

- 

## Próximos Pasos

1. Levantar historias de usuario y especificación de requisitos
2. Modelar base de datos y arquitectura
3. Iniciar sprint de desarrollo y pruebas
`;
    fs.writeFileSync(projectIndexPath, content, 'utf8');
    console.log(`  [FILE] Created PROJECT_INDEX.md`);
  }

  // 4. PROJECT_REQUIREMENTS.md
  const reqPath = path.join(projectDir, 'PROJECT_REQUIREMENTS.md');
  if (!fs.existsSync(reqPath)) {
    const reqContent = `# Project Requirements: ${projectName}

## 1. Alcance y Propósito

${goal}

## 2. Requerimientos Funcionales

- [ ] RF-01: 
- [ ] RF-02: 

## 3. Requerimientos No Funcionales

- [ ] RNF-01: Seguridad y validación de datos
- [ ] RNF-02: Código estructurado y documentado (Clean Code, SOLID)
- [ ] RNF-03: Cobertura de pruebas unitarias

## 4. Criterios de Evaluación SENA

- Lista de chequeo de la evidencia de aprendizaje cumplida al 100%
- Repositorio Git estructurado con historial de commits profesional
- Documento técnico exportado en PDF bajo formato institucional
`;
    fs.writeFileSync(reqPath, reqContent, 'utf8');
    console.log(`  [FILE] Created PROJECT_REQUIREMENTS.md`);
  }

  // 5. EXPORT_MANIFEST.md
  const manifestPath = path.join(projectDir, 'EXPORT_MANIFEST.md');
  if (!fs.existsSync(manifestPath)) {
    const manifestContent = `---
title: "${projectName}"
authors:
  - "${author}"
institution: "SENA - Servicio Nacional de Aprendizaje"
date: "${currentDate}"
status: draft
citation_style: apa
draft_order: []
watermark: true
output_dir: "Projects/${projectName}/Exports/"
---

# Export Manifest

Use este archivo para definir la secuencia de notas que conforman el documento final a compilar a PDF/DOCX.
`;
    fs.writeFileSync(manifestPath, manifestContent, 'utf8');
    console.log(`  [FILE] Created EXPORT_MANIFEST.md`);
  }

  // 6. Update PROJECTS_INDEX.md
  if (fs.existsSync(PROJECTS_INDEX_FILE)) {
    let pContent = fs.readFileSync(PROJECTS_INDEX_FILE, 'utf8');
    if (!pContent.includes(projectName)) {
      const row = `| ${projectName} | active | [[Projects/${projectName}/PROJECT_INDEX|Project Index]] | [[Projects/${projectName}/PROJECT_REQUIREMENTS|Requirements]] | [[Projects/${projectName}/EXPORT_MANIFEST|Manifest]] | ${goal} |\n`;
      pContent = pContent.trimEnd() + '\n' + row;
      fs.writeFileSync(PROJECTS_INDEX_FILE, pContent, 'utf8');
      console.log(`  [INDEX] Added to PROJECTS_INDEX.md`);
    }
  }

  // 7. Update MASTER_INDEX.md
  if (fs.existsSync(MASTER_INDEX_FILE)) {
    let mContent = fs.readFileSync(MASTER_INDEX_FILE, 'utf8');
    if (!mContent.includes(projectName)) {
      const activeProjectsIndex = mContent.indexOf('## Active Projects');
      if (activeProjectsIndex !== -1) {
        const tableEndIndex = mContent.indexOf('\n## Global Rules', activeProjectsIndex);
        if (tableEndIndex !== -1) {
          const row = `| ${projectName} | active | [[Projects/${projectName}/PROJECT_INDEX|${projectName}]] | [[Projects/${projectName}/PROJECT_REQUIREMENTS|Requirements]] | [[Projects/${projectName}/EXPORT_MANIFEST|Manifest]] |\n`;
          mContent = mContent.slice(0, tableEndIndex) + row + mContent.slice(tableEndIndex);
          fs.writeFileSync(MASTER_INDEX_FILE, mContent, 'utf8');
          console.log(`  [INDEX] Added to MASTER_INDEX.md`);
        }
      }
    }
  }

  console.log(`\n✅ Proyecto "${projectName}" creado exitosamente.`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
