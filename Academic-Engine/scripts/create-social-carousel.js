#!/usr/bin/env node

/**
 * Programmatic 4-Slide Social Carousel System & Asset Pipeline for BRIDS
 *
 * Capabilities:
 * - Single carousel creation via positional arguments or CLI flags (--idea, --image, --asset, --ref)
 * - Batch creation via JSON config (--batch <path>)
 * - Exportable Node.js module API for programmatic integration
 * - Institutional fintech prompt engine with clean Solana Green and Slate palette (#0F172A, #14F195)
 * - Direct asset management and Obsidian Markdown deliverable generation
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_SOCIAL_DIR = path.join(ROOT_DIR, 'Academic Vault', 'Drafts', 'Social');
const ASSETS_ROOT = path.join(VAULT_SOCIAL_DIR, 'Assets');
const BRAND_ASSETS_DIR = path.join(ROOT_DIR, 'Academic-Engine', 'context', 'brand-assets');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'Academic-Engine', 'templates', 'carousel-post-template.md');

function sanitizeSlug(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
}

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

/**
 * Core Programmatic Carousel Creation Engine
 */
function createCarousel(options = {}) {
  const {
    idea,
    imagePath,
    assetClass = options.garment || 'Real Estate RWA Tokenization',
    technicalRef = options.culturalRef || 'Solana Metaplex Core / Delaware SPV',
    platform = 'linkedin',
    force = false,
    date = getTodayString()
  } = options;

  if (!idea) {
    throw new Error('El parámetro "idea" (slug o concepto) es obligatorio.');
  }

  const ideaSlug = sanitizeSlug(idea);
  const platformSlug = sanitizeSlug(platform);
  const folderName = `${date}-carrusel-${ideaSlug}`;
  const assetDir = path.join(ASSETS_ROOT, folderName);
  const noteFileName = `${date}-${platformSlug}-carrusel-${ideaSlug}.md`;
  const notePath = path.join(VAULT_SOCIAL_DIR, noteFileName);

  ensureDir(ASSETS_ROOT);
  ensureDir(assetDir);

  // Protection Guard
  if (fs.existsSync(notePath) && !force) {
    const err = new Error(`El archivo de carrusel "${noteFileName}" ya existe.`);
    err.code = 'EEXIST';
    err.path = notePath;
    throw err;
  }

  // 1. Process Input Image (Slide 1: Hero)
  const heroTarget = path.join(assetDir, '01-portada-hero.png');
  let hasInputImage = false;

  if (imagePath && fs.existsSync(imagePath)) {
    fs.copyFileSync(imagePath, heroTarget);
    hasInputImage = true;
  } else {
    const readmeContent = `# Activos del Carrusel: ${folderName}\n\n` +
      `Coloca la imagen principal como \`01-portada-hero.png\` en esta carpeta.\n\n` +
      `Los prompts para generar los slides 2, 3 y 4 se encuentran en \`generation-prompts.json\`.`;
    fs.writeFileSync(path.join(assetDir, 'README-ASSETS.md'), readmeContent, 'utf8');
  }

  // 2. Generate Structured Prompts Manifest with Strict Minimalism
  const promptsManifest = {
    system_version: "2.0-brids-rwa",
    carousel_id: folderName,
    aspect_ratio: "4:5 (1080x1350 px)",
    asset_class: assetClass,
    technical_reference: technicalRef,
    brand_visual_identity: {
      palette: {
        deep_slate: "#0F172A",
        solana_green: "#14F195",
        institutional_gold: "#F59E0B",
        card_slate: "#1E293B",
        pure_white: "#FFFFFF"
      },
      positive_tokens: "BRIDS institutional visual style, sleek modern architectural real estate, glass and steel facade, high-end fintech UI, clean Solana green glowing accents, ultra-minimalist, ample negative space, sharp vector lines, institutional credibility, refined luxury typography",
      negative_tokens: "cluttered, cartoon, low resolution, cheap cosplay, garment, anime, clothing, noisy textures, amateur composition, oversaturated neon"
    },
    slides: {
      slide_1_hero: {
        file: "01-portada-hero.png",
        type: "Fotografía Arquitectónica / Hero",
        description: `Fotografía arquitectónica vertical 4:5 de activo inmobiliario institucional tokenizado. ${assetClass} con iluminación natural, fachada contemporánea, líneas limpias y atmósfera fintech premium (#0F172A, acento #14F195).`,
        prompt: `Architectural photography vertical 4:5 of premier modern commercial real estate, ${assetClass}, BRIDS brand style, dramatic natural lighting, clean deep slate facade (#0F172A) with subtle glowing Solana green accents (#14F195), ultra-clean glass reflection, sharp focus, institutional institutional asset quality.`
      },
      slide_2_technical_architecture: {
        file: "02-arquitectura-tecnica.png",
        type: "Diagrama Técnico On-Chain (Metaplex Core & SPV)",
        description: `Infografía técnica y diagrama de flujo on-chain en Solana. Estructuración legal dual con Delaware SPV y plugins de freeze/recovery de Metaplex Core sobre fondo oscuro (#0F172A).`,
        prompt: `High-end fintech technical architecture diagram on deep dark slate background (#0F172A), Solana blockchain network nodes with clean glowing emerald green vector connections (#14F195), Delaware SPV legal flow box, Metaplex Core freeze and recovery plugin indicators, crisp typography, clean data visualization.`
      },
      slide_3_financial_metrics: {
        file: "03-metricas-financieras.png",
        type: "Métricas Financieras & Dividendos",
        description: `Dashboard financiero institucional mostrando APY proyectado, flujo fraccional de rentas y distribución automatizada en USDC.`,
        prompt: `Minimalist fintech dashboard card showing financial metrics, real estate yield graph, clean percentage APY metrics in glowing Solana green (#14F195), fractional token distribution table, sleek glassmorphism UI over dark background (#0F172A), ultra-clean typography.`
      },
      slide_4_conversion_cta: {
        file: "04-conversion-cta.png",
        type: "Slide de Cierre Comercial (CTA)",
        description: `Diseño gráfico institucional en formato 4:5. Fondo sólido azul pizarra (#0F172A), isotipo minimalista de BRIDS en verde Solana (#14F195), tipografía 'BRIDS: THE INSTITUTIONAL BRIDGE FOR RWA ON SOLANA'. Máxima limpieza visual.`,
        prompt: `Ultra-minimalist institutional fintech slide for BRIDS, seamless flat solid deep slate background (#0F172A), vast negative space, perfectly centered clean geometric BRIDS logo in glowing Solana green (#14F195), elegant typography 'THE INSTITUTIONAL BRIDGE FOR RWA ON SOLANA', clean refined look, zero clutter.`
      }
    }
  };

  fs.writeFileSync(
    path.join(assetDir, 'generation-prompts.json'),
    JSON.stringify(promptsManifest, null, 2),
    'utf8'
  );

  // 3. Build Obsidian Markdown Note
  const titleRaw = ideaSlug.replace(/-/g, ' ');
  const titleUpper = titleRaw.toUpperCase();

  let noteContent = '';
  if (fs.existsSync(TEMPLATE_PATH)) {
    let tpl = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    tpl = tpl.replace(/{{TITLE}}/g, titleRaw);
    tpl = tpl.replace(/{{TITLE_UPPER}}/g, titleUpper);
    tpl = tpl.replace(/{{ASSET_CLASS}}/g, assetClass);
    tpl = tpl.replace(/{{GARMENT}}/g, assetClass);
    tpl = tpl.replace(/{{TECHNICAL_REF}}/g, technicalRef);
    tpl = tpl.replace(/{{CULTURAL_REF}}/g, technicalRef);
    tpl = tpl.replace(/{{PLATFORM}}/g, platformSlug);
    tpl = tpl.replace(/{{DATE}}/g, date);
    tpl = tpl.replace(/{{FOLDER_NAME}}/g, folderName);
    tpl = tpl.replace(/{{IDEA_SLUG}}/g, ideaSlug);
    tpl = tpl.replace(/{{IDEA_SLUG_RAW}}/g, ideaSlug.replace(/-/g, ''));
    noteContent = tpl;
  } else {
    noteContent = `---
title: "[INSTAGRAM CARRUSEL] ${titleRaw}"
category: "Drafts"
workflow: "W5_CONTENT_SOCIAL"
skills_used:
  - "mas-social-content"
  - "mas-ad-creative"
  - "mas-copywriting"
platform: "${platformSlug}"
content_type: "carrusel-4-slides"
aspect_ratio: "4:5"
status: draft
version: "1.0"
created_at: ${date}
updated_at: ${date}
tags:
  - marketing
  - social-content
  - carrusel
  - instagram
  - ${ideaSlug}
---

# [INSTAGRAM CARRUSEL] ${titleUpper}

> [!NOTE]
> **Resumen Ejecutivo:** Carrusel de 4 slides en formato vertical 4:5 enfocado en ${garment} (${culturalRef}).

---

## 🖼️ Galería Visual del Carrusel (4 Slides)

### Slide 1: Portada Hero Arquitectónica
![[Drafts/Social/Assets/${folderName}/01-portada-hero.png]]

### Slide 2: Arquitectura Técnica & Smart Contracts
![[Drafts/Social/Assets/${folderName}/02-diagrama-arquitectura-tecnica.png]]

### Slide 3: Desglose Financiero & Rendimiento Estimado
![[Drafts/Social/Assets/${folderName}/03-desglose-financiero-rendimiento.png]]

### Slide 4: Llamado a la Acción (CTA) & Onboarding
![[Drafts/Social/Assets/${folderName}/04-conversion-cta.png]]

---

## 🔄 Historial de Revisiones (Changelog)
- **v1.0 (${date}):** Creación del carrusel de 4 slides institucional.
`;
  }

  fs.writeFileSync(notePath, noteContent, 'utf8');

  return {
    success: true,
    carouselId: folderName,
    noteFileName,
    notePath,
    assetDir,
    promptsManifestPath: path.join(assetDir, 'generation-prompts.json'),
    hasInputImage
  };
}

/**
 * Batch Creation Engine
 */
function batchCreateCarousels(batchConfigPath) {
  if (!fs.existsSync(batchConfigPath)) {
    throw new Error(`No se encontró el archivo de configuración batch en: ${batchConfigPath}`);
  }

  const config = JSON.parse(fs.readFileSync(batchConfigPath, 'utf8'));
  const carousels = config.carousels || [];
  const results = [];

  console.log(`\n🚀 Ejecutando creación batch de ${carousels.length} carruseles...\n`);

  for (const item of carousels) {
    try {
      const res = createCarousel(item);
      results.push(res);
      console.log(`✅ [${res.carouselId}] Generado exitosamente -> ${res.noteFileName}`);
    } catch (e) {
      console.error(`❌ Error en "${item.idea || 'desconocido'}": ${e.message}`);
      results.push({ success: false, error: e.message, idea: item.idea });
    }
  }

  return results;
}

// -------------------------------------------------------------
// CLI INTERFACE & ARGS PARSING
// -------------------------------------------------------------
function parseArgs(args) {
  const options = {
    idea: '',
    imagePath: '',
    assetClass: 'Real Estate RWA Tokenization',
    technicalRef: 'Solana Metaplex Core / Delaware SPV',
    platform: 'linkedin',
    force: false,
    batchPath: '',
    jsonOutput: false
  };

  let positionalIdx = 0;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--idea' && args[i + 1]) {
      options.idea = args[++i];
    } else if (arg === '--image' && args[i + 1]) {
      options.imagePath = args[++i];
    } else if ((arg === '--asset' || arg === '--garment') && args[i + 1]) {
      options.assetClass = args[++i];
    } else if (arg === '--ref' && args[i + 1]) {
      options.technicalRef = args[++i];
    } else if (arg === '--platform' && args[i + 1]) {
      options.platform = args[++i];
    } else if (arg === '--batch' && args[i + 1]) {
      options.batchPath = args[++i];
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--json') {
      options.jsonOutput = true;
    } else if (!arg.startsWith('-')) {
      // Positional args fallback by index
      if (positionalIdx === 0) options.idea = arg;
      else if (positionalIdx === 1) options.imagePath = arg;
      else if (positionalIdx === 2) options.assetClass = arg;
      else if (positionalIdx === 3) options.technicalRef = arg;
      else if (positionalIdx === 4) options.platform = arg;
      positionalIdx++;
    }
  }

  return options;
}

function runCli() {
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║         SISTEMA PROGRAMÁTICO DE CARRUSELES VISUALES (BRIDS RWA)                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

USO BÁSICO (Argumentos Posicionales):
  bash Academic-Engine/scripts/create-social-carousel.sh "<idea>" [imagen] [activo] [referencia] [red]

USO AVANZADO (Flags Nombradas):
  bash Academic-Engine/scripts/create-social-carousel.sh \
    --idea "delaware-spv-compliance" \
    --image ./propiedad.jpg \
    --asset "Commercial Real Estate RWA" \
    --ref "Delaware Series LLC" \
    --platform linkedin

USO POR LOTES (Batch Mode):
  bash Academic-Engine/scripts/create-social-carousel.sh --batch ./mi-plan-semanal.json

OPCIONES:
  --force, -f       Sobrescribe la nota si ya existe (usar con precaución)
  --json            Retorna la salida estructurada en JSON para consumo programático
  --help, -h        Muestra esta ayuda
`);
    process.exit(0);
  }

  const options = parseArgs(rawArgs);

  try {
    if (options.batchPath) {
      const results = batchCreateCarousels(options.batchPath);
      if (options.jsonOutput) {
        console.log(JSON.stringify(results, null, 2));
      }
    } else {
      const result = createCarousel(options);
      if (options.jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`\n🎉 Carrusel Generado Programáticamente:`);
        console.log(`   📄 Nota en Obsidian: ${result.noteFileName}`);
        console.log(`   📍 Ruta Completa:    ${result.notePath}`);
        console.log(`   📁 Carpeta Activos:  ${result.assetDir}`);
        console.log(`   🎨 Prompts JSON:     ${result.promptsManifestPath}`);
        console.log(`   🖼️ Foto de Entrada:  ${result.hasInputImage ? 'Procesada ✅' : 'Pendiente (ver README-ASSETS.md) ⏳'}\n`);
      }
    }
  } catch (err) {
    if (options.jsonOutput) {
      console.error(JSON.stringify({ success: false, error: err.message, code: err.code }));
    } else {
      console.error(`\n❌ ERROR EN EL SISTEMA DE CARRUSELES: ${err.message}\n`);
    }
    process.exit(1);
  }
}

// Export for programmatic Node.js require() and execute CLI if called directly
module.exports = {
  createCarousel,
  batchCreateCarousels
};

if (require.main === module) {
  runCli();
}
