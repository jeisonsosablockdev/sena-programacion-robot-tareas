#!/usr/bin/env node

/**
 * Master Content Alignment & Synchronization Tool for BRIDS.io
 *
 * Ensures 1-to-1 alignment between:
 * 1. La Parrilla de Publicaciones Estratégica (15 Días)
 * 2. Las Notas Entregables en Obsidian (Social Content/*.md)
 * 3. Las Carpetas de Activos Visuales (Social Content/Assets/*)
 */

const fs = require('fs');
const path = require('path');
const { createCarousel } = require('./create-social-carousel');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_SOCIAL_DIR = path.join(ROOT_DIR, 'Academic Vault', 'Drafts', 'Social');
const ASSETS_ROOT = path.join(VAULT_SOCIAL_DIR, 'Assets');
const DEFAULT_PLAN_PATH = path.join(ROOT_DIR, 'Academic-Engine', 'templates', 'content-grid-plan.json');
const PARRILLA_DOC_PATH = path.join(VAULT_SOCIAL_DIR, 'parrilla-publicaciones-redes-sociales.md');
const CREATE_POST_SCRIPT = path.join(ROOT_DIR, 'Academic-Engine', 'scripts', 'create-social-post.js');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadPlan(planPath = DEFAULT_PLAN_PATH) {
  if (!fs.existsSync(planPath)) {
    throw new Error(`No se encontró el plan de contenido en: ${planPath}`);
  }
  return JSON.parse(fs.readFileSync(planPath, 'utf8'));
}

/**
 * Scans the vault to assess the alignment status of each post in the plan
 */
function auditAlignment(plan) {
  const posts = plan.posts || [];
  const report = [];

  const existingNotes = fs.existsSync(VAULT_SOCIAL_DIR)
    ? fs.readdirSync(VAULT_SOCIAL_DIR).filter(f => f.endsWith('.md'))
    : [];

  const existingAssets = fs.existsSync(ASSETS_ROOT)
    ? fs.readdirSync(ASSETS_ROOT).filter(f => fs.statSync(path.join(ASSETS_ROOT, f)).isDirectory())
    : [];

  for (const post of posts) {
    const expectedNotePattern = new RegExp(`${post.date}-.*${post.slug}`);
    const matchedNote = existingNotes.find(f => expectedNotePattern.test(f) || f.includes(post.slug));

    const expectedAssetPattern = new RegExp(`${post.date}-.*${post.slug}`);
    const matchedAsset = existingAssets.find(f => expectedAssetPattern.test(f) || f.includes(post.slug));

    let status = 'PLANIFICADO';
    let statusEmoji = '⚪';

    if (matchedNote && (matchedAsset || post.format === 'reel')) {
      status = 'LISTO';
      statusEmoji = '🟢';
    } else if (matchedNote) {
      status = 'NOTA CREADA';
      statusEmoji = '🟡';
    }

    report.push({
      postNumber: post.post_number,
      date: post.date,
      slug: post.slug,
      format: post.format,
      pillar: post.pillar,
      garment: post.garment,
      culturalRef: post.cultural_reference,
      hook: post.hook,
      cta: post.cta || '',
      altText: post.alt_text || '',
      hashtags: post.hashtags || '',
      published: post.published || false,
      matchedNote: matchedNote || null,
      matchedAsset: matchedAsset || null,
      status,
      statusEmoji
    });
  }

  return report;
}

/**
 * Automatically creates all missing notes and asset folders for the entire grid
 */
function scaffoldAllMissing(plan) {
  const audit = auditAlignment(plan);
  console.log(`\n🚀 Sincronizando y generando entregables faltantes de la parrilla...\n`);

  let createdCount = 0;

  for (const item of audit) {
    const isCarousel = item.format === 'carrusel';

    if (!item.matchedNote) {
      if (isCarousel) {
        // Create 4-slide carousel
        try {
          createCarousel({
            idea: item.slug,
            garment: item.garment,
            culturalRef: item.culturalRef,
            platform: 'instagram',
            date: item.date
          });
          createdCount++;
          console.log(`✅ [Post ${item.postNumber} - ${item.date}] Carrusel generado: ${item.slug}`);
        } catch (e) {
          console.error(`❌ Error al crear carrusel ${item.slug}: ${e.message}`);
        }
      } else {
        // Create standard Reel / Post
        const noteFileName = `${item.date}-instagram-${item.slug}.md`;
        const notePath = path.join(VAULT_SOCIAL_DIR, noteFileName);

        const reelContent = `---
title: "[INSTAGRAM REEL] ${item.slug.replace(/-/g, ' ')}"
category: "Drafts"
workflow: "W5_CONTENT_SOCIAL"
skills_used:
  - "mas-social-content"
  - "mas-ad-creative"
  - "mas-copywriting"
platform: "instagram"
content_type: "reel-vertical"
pillar: "${item.pillar}"
cultural_reference: "${item.culturalRef}"
topic: "${item.garment}"
status: draft
version: "1.0"
created_at: ${item.date}
updated_at: ${item.date}
tags:
  - marketing
  - social-content
  - reel
  - instagram
  - rwa
  - solana
  - ${item.slug}
---

# [INSTAGRAM REEL] ${item.slug.replace(/-/g, ' ').toUpperCase()}

> [!NOTE]
> **Resumen Ejecutivo:** Video vertical Reel 9:16 para Instagram enfocado en ${item.garment} (${item.culturalRef}). Formato institucional de 15-30s con desglose técnico de infraestructura y propuesta de valor RWA en Solana.

---

## 🎯 Contexto y Objetivo
- **Plataforma:** Instagram Reels (\`@brids_io\`)
- **Pilar de Contenido:** ${item.pillar}
- **Concepto / Tesis:** ${item.garment}
- **Referencia Técnica:** *${item.culturalRef}*
- **Gancho Visual / Hook:** *"${item.hook}"*
- **Llamado a la Acción (CTA):** *${item.cta}*

---

## 🎬 1. Especificaciones Técnicas (Guía de Producción RWA)
- **Formato:** 9:16 Vertical (1080p @ 60fps)
- **Duración:** 15 a 30 segundos
- **Audio:** Voz en off institucional clara + música fintech rítmica de fondo
- **Paleta Visual:** Azul Profundo (\`#0B192C\`), Verde Solana (\`#14F195\`), Blanco (\`#F8FAFC\`)

---

## ⏱️ 2. Guión de Grabación & Edición (4 Escenas)

| Tiempo | Escena | Ángulo & Tomas | Acción en Pantalla | Audio / Voz en Off |
|---|---|---|---|---|
| **00:00 - 00:03** | **Escena 1 (Hook)** | Pantalla dividida / Tipografía cinética | Comparación visual de fricción tradicional vs solución on-chain. | *"${item.hook}"* |
| **00:03 - 00:12** | **Escena 2 (Arquitectura)** | Screen recording de UI / B-roll inmobiliario | Demostración de trazabilidad en Solana y Delaware SPVs dedicados. | *"Cada propiedad vive en un SPV independiente, garantizando segregación de riesgos y titularidad jurídica."* |
| **00:12 - 00:22** | **Escena 3 (Rendimiento)** | Motion graphic de flujo financiero USDC | Distribución automática de rentas y plugins de recuperación Metaplex Core. | *"Liquidación instantánea en USDC, auditoría pública on-chain y custodia sin intermediarios bancarios lentos."* |
| **00:22 - 00:30** | **Escena 4 (Cierre CTA)** | Tarjeta de activo + URL brids.io | Logo BRIDS con llamado a la acción comercial. | *"${item.cta}"* |

---

## ✍️ 3. Copy Oficial para Publicación

\`\`\`text
${item.hook}

${item.garment}: Infraestructura Web3 de software para la sindicación e inversión inmobiliaria estructurada en EE.UU.

Respaldado por Delaware SPVs segregadas, verificación KYC biométrica con Stripe Identity y plugins nativos de Metaplex Core en la red de Solana.

${item.cta}

${item.hashtags}
\`\`\`

---

## 📋 4. Checklist Técnico de Verificación
- [ ] Cámara y render en modo 1080p 60fps vertical 9:16.
- [ ] Subtítulos centrados dentro del área segura de Instagram / Reels.
- [ ] Copy verificado con llamado a la acción oficial y URL de brids.io.
- [ ] Blindaje legal confirmado: sin promesa de retornos garantizados ni rol broker-dealer.

---

## 🔄 Historial de Revisiones (Changelog)
- **v1.0 (${item.date}):** Creación del guión de Reel institucional alineado con la Parrilla Estratégica de 15 Días.

---

## 🔗 Referencias Cruzadas
- Conceptos Clave: [[Concepts/]]
`;

        fs.writeFileSync(notePath, reelContent, 'utf8');
        createdCount++;
        console.log(`✅ [Post ${item.postNumber} - ${item.date}] Reel generado: ${item.slug}`);
      }
    }
  }

  console.log(`\n✨ Sincronización completada. Se generaron ${createdCount} nuevos entregables alineados.`);
}

/**
 * Updates the master Parrilla Markdown document with aligned dashboard table and wikilinks
 */
function updateParrillaDocument(plan) {
  const audit = auditAlignment(plan);
  console.log(`\n📝 Actualizando documento maestro: ${path.basename(PARRILLA_DOC_PATH)}...`);

  let tableRows = '';
  for (const item of audit) {
    const noteLink = item.matchedNote
      ? `[[Drafts/Social/${item.matchedNote}|📄 Ver Nota]]`
      : `*(Pendiente)*`;

    const assetLink = item.matchedAsset
      ? `[[Drafts/Social/Assets/${item.matchedAsset}/README-ASSETS.md|📁 Assets]]`
      : (item.format === 'carrusel' ? `*(Sin assets)*` : `*(Video directo)*`);

    const formatBadge = item.format === 'carrusel' ? '🖼️ Carrusel (4:5)' : '🎬 Reel (9:16)';

    const publishedBox = item.published ? '[x]' : '[ ]';
    const fullCopy = `${item.hook}<br><br>${item.cta}<br><br>${item.hashtags}`;
    tableRows += `| **${item.postNumber}** | \`${item.date}\` | **${item.garment}** | *${item.culturalRef}* | *"${item.hook}"* | ${item.cta} | *${item.altText}* | \`${item.hashtags}\` | \`${fullCopy}\` | ${formatBadge} | ${item.statusEmoji} ${item.status} | ${publishedBox} | *(Sin link)* | ${noteLink} | ${assetLink} |\n`;
  }

  const updatedContent = `---
title: "Parrilla Estratégica de Publicaciones (15 Días)"
category: "Drafts"
workflow: "W5_CONTENT_SOCIAL"
skills_used:
  - "mas-social-content"
  - "mas-ad-creative"
  - "mas-content-strategy"
status: in_progress
version: "2.0"
protected: true
created_at: 2026-08-08
updated_at: ${getTodayString()}
tags:
  - marketing
  - social-content
  - rwa
  - solana
  - content-grid
---

# Parrilla Estratégica de Publicaciones (15 Días)

*Matriz Maestra Intercalada y Sincronizada para @brids_io*  
*Folder: Drafts / Social*  
*Last updated: ${getTodayString()}*

> [!NOTE]
> **Resumen Ejecutivo:** Matriz maestra de sincronización editorial de BRIDS para LinkedIn, X y Telegram. Mantiene alineación 1-a-1 entre la planificación estratégica, las tesis RWA, las notas entregables en Obsidian y los activos visuales.

---

## 📊 TABLA MAESTRA DE ALINEACIÓN & ESTADO (15 DÍAS)

Esta tabla mantiene la **alineación 1-a-1** entre la planificación estratégica, los ganchos comerciales, los llamados a la acción (CTA), los textos alternativos accesibles (Alt Text), los hashtags de posicionamiento, las notas de contenido en Obsidian y las carpetas de activos visuales:

| # | Fecha | Tesis / Concepto | Ancla Técnica | Gancho Principal (Hook) | Subtexto (CTA) | Texto Alt (SEO & Accesibilidad) | Hashtags | Copy Completo (Listo para Copiar) | Formato | Estado | ¿Publicado? | Link Publicación | Nota Entregable | Activos Visuales |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${tableRows}
---

## 🔄 Historial de Revisiones (Changelog)
- **v1.0 (2026-08-08):** Creación inicial de la matriz editorial.
- **v2.0 (${getTodayString()}):** Migración a formato kebab-case institucional alineado con la arquitectura BRIDS.

---

## 🔗 Referencias Cruzadas
- Conceptos Clave: [[Concepts/]]
`;

  fs.writeFileSync(PARRILLA_DOC_PATH, updatedContent, 'utf8');
  console.log(`✅ Documento de Parrilla actualizado con enlaces bidireccionales interactivos.`);
}

/**
 * Prints terminal alignment status
 */
function printAlignmentStatus(plan) {
  const audit = auditAlignment(plan);
  console.log('\n' + '═'.repeat(85));
  console.log('📊 AUDITORÍA DE ALINEACIÓN DE CONTENIDOS (PARRILLA ↔ NOTAS ↔ ASSETS)');
  console.log('═'.repeat(85));

  console.log(`\nTotal de publicaciones planificadas: ${audit.length}\n`);

  let completeCount = 0;
  for (const item of audit) {
    const noteText = item.matchedNote ? `📄 ${item.matchedNote}` : '❌ (Falta Nota)';
    const assetText = item.matchedAsset ? `📁 ${item.matchedAsset}` : (item.format === 'carrusel' ? '⚠️ (Faltan Assets)' : '🎬 (Video)');

    console.log(`Post #${String(item.postNumber).padStart(2, '0')} [${item.date}] [${item.format.toUpperCase().padEnd(8)}] ${item.statusEmoji} ${item.garment}`);
    console.log(`   ${noteText}`);
    if (item.format === 'carrusel') console.log(`   ${assetText}`);
    console.log('');

    if (item.status === 'LISTO') completeCount++;
  }

  const percent = Math.round((completeCount / audit.length) * 100);
  console.log('─'.repeat(85));
  console.log(`Resumen de Alineación: ${completeCount}/${audit.length} publicaciones listas (${percent}%)\n`);
  console.log('═'.repeat(85) + '\n');
}

// -------------------------------------------------------------
// CLI ROUTER
// -------------------------------------------------------------
function run() {
  const args = process.argv.slice(2);
  const plan = loadPlan();

  if (args.includes('--scaffold') || args.includes('-s') || args.includes('scaffold') || args.includes('sync')) {
    scaffoldAllMissing(plan);
    updateParrillaDocument(plan);
    printAlignmentStatus(plan);
  } else if (args.includes('--update-doc') || args.includes('update')) {
    updateParrillaDocument(plan);
    printAlignmentStatus(plan);
  } else {
    printAlignmentStatus(plan);
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  auditAlignment,
  scaffoldAllMissing,
  updateParrillaDocument
};
