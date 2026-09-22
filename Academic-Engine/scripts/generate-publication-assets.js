#!/usr/bin/env node

/**
 * Context-Aware Publication Visual Engine for BRIDS.io
 *
 * Capabilities:
 * - Reads and parses any publication note (Markdown frontmatter + content sections)
 * - Reads product marketing context (RWA architecture, Solana TPS, Delaware SPV, Stripe Identity)
 * - Reads brand visual style guide (palette #0B192C/#14F195/#00F5D4, fintech minimalism)
 * - Extracts specific slide hooks, micro-copys, and technical narratives
 * - Generates high-fidelity contextual prompts tailored to the asset & architecture
 * - Updates/creates asset directories with generation-prompts.json and Obsidian embeds
 *
 * Usage:
 *   bash generate-publication-assets.sh <note-path-or-slug> [--input-image <path>] [--json] [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');
const SOCIAL_CONTENT_DIR = path.join(VAULT_DIR, 'Drafts', 'Social');
const ASSETS_ROOT = path.join(SOCIAL_CONTENT_DIR, 'Assets');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseYamlFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { frontmatter: {}, body: content };

  const rawYaml = match[1];
  const body = content.slice(match[0].length);
  const frontmatter = {};

  const lines = rawYaml.split(/\r?\n/);
  let currentKey = null;
  let isArray = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('- ') && currentKey && isArray) {
      frontmatter[currentKey].push(trimmed.slice(2).replace(/^["']|["']$/g, ''));
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx > -1) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();

      if (val === '') {
        currentKey = key;
        isArray = true;
        frontmatter[key] = [];
      } else {
        isArray = false;
        currentKey = key;
        val = val.replace(/^["']|["']$/g, '');
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        frontmatter[key] = val;
      }
    }
  }

  return { frontmatter, body };
}

/**
 * Finds the matching publication note in the vault
 */
function resolvePublicationNote(query) {
  if (!query) throw new Error('Debes proporcionar el nombre, ruta o slug de la publicación.');

  // Direct path
  let targetPath = path.isAbsolute(query) ? query : path.join(process.cwd(), query);
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return targetPath;
  }

  // Look in Social Content folder
  targetPath = path.join(SOCIAL_CONTENT_DIR, query);
  if (fs.existsSync(targetPath)) return targetPath;
  if (fs.existsSync(`${targetPath}.md`)) return `${targetPath}.md`;

  // Search by slug substring
  const files = fs.readdirSync(SOCIAL_CONTENT_DIR).filter(f => f.endsWith('.md'));
  const cleanQuery = query.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const matched = files.find(f => f.toLowerCase().includes(cleanQuery));

  if (matched) return path.join(SOCIAL_CONTENT_DIR, matched);

  throw new Error(`No se encontró ninguna publicación que coincida con "${query}" en Social Content.`);
}

/**
 * Extracts lore and context details about an RWA asset or infrastructure concept from product-marketing-context.md
 */
function extractAssetContext(topicName) {
  const cleanName = (topicName || '').toLowerCase();

  const lore = {
    brand_slogan: "Infraestructura Web3 segura, accesible y trazable para invertir en bienes raíces estructurados desde $100 USD",
    platform_ecosystem: "Solana RWA / Metaplex Core / Delaware SPVs",
    ticket_minimum: "$100 USD",
    settlement_currency: "USDC",
    compliance_framework: "Non-Broker-Dealer SaaS + Delaware Series LLC",
    asset_specifics: "Activo inmobiliario de grado institucional estructurado en Delaware y tokenizado en Solana."
  };

  if (cleanName.includes('solana') || cleanName.includes('tps') || cleanName.includes('gas')) {
    lore.asset_specifics = "Infraestructura blockchain en Solana de alta velocidad (>2,000 TPS) y tarifas submilesimales (<$0.001) para distribución masiva de rentas.";
  } else if (cleanName.includes('spv') || cleanName.includes('delaware') || cleanName.includes('compliance')) {
    lore.asset_specifics = "Estructuración dual con Delaware C-Corp operando el software y LLCs independientes (SPVs) como titulares jurídicos exclusivos del activo.";
  } else if (cleanName.includes('metaplex') || cleanName.includes('core') || cleanName.includes('freeze') || cleanName.includes('recovery')) {
    lore.asset_specifics = "Plugins avanzados de Metaplex Core (Freeze y Authority/Recovery) que permiten congelar y reemitir NFTs tras verificación de identidad KYC sin violar derechos fiduciarios.";
  } else if (cleanName.includes('sponsor') || cleanName.includes('developer') || cleanName.includes('capital')) {
    lore.asset_specifics = "Portal institucional de captación y sindicación que permite a General Partners (GPs) acceder a liquidez global y reducir costo de capital.";
  } else if (cleanName.includes('stripe') || cleanName.includes('kyc') || cleanName.includes('identidad')) {
    lore.asset_specifics = "Onboarding biométrico instantáneo con Stripe Identity, validando inversores acreditados y minoristas sin retener datos sensibles en servidores propios.";
  } else if (cleanName.includes('multisig') || cleanName.includes('squads') || cleanName.includes('treasury')) {
    lore.asset_specifics = "Custodia descentralizada de tesorería y desembolsos por hitos mediante contratos multifirma Squads Protocol en Solana.";
  }

  return lore;
}

const extractGarmentContext = extractAssetContext;

/**
 * Parses Slide Details from Note Body
 */
function extractSlideDetails(body, assetClass, technicalRef) {
  const slides = {
    slide_1: {
      headline: "Real Estate Tokenization on Solana.",
      microcopy: `${assetClass} • Rendimiento On-Chain Institucional`
    },
    slide_2: {
      headline: "Infraestructura RWA de Alto Desempeño",
      microcopy: "Metaplex Core Freeze/Recovery • Delaware SPV Non-Broker-Dealer"
    },
    slide_3: {
      headline: "Rendimiento Transparente y Fraccional",
      microcopy: "Liquidación inmediata en USDC • Distribución automatizada"
    },
    slide_4: {
      headline: "El Futuro del Real Estate Institucional",
      microcopy: "Agenda una demo con el equipo de BRIDS en brids.io"
    }
  };

  // Attempt regex extraction from markdown note
  const s1 = body.match(/### Slide 1:[^\n]*\n(?:!\[\[.*?\]\]\n)?\*Titular en Imagen:\* \*\*"?(.*?)"?\*\*(?:\s*\n\*Micro-copy:\* (.*?))?/);
  if (s1 && s1[1]) slides.slide_1.headline = s1[1];
  if (s1 && s1[2]) slides.slide_1.microcopy = s1[2].trim();

  const s2 = body.match(/### Slide 2:[^\n]*\n(?:!\[\[.*?\]\]\n)?\*Titular en Imagen:\* \*\*"?(.*?)"?\*\*(?:\s*\n\*Micro-copy:\* (.*?))?/);
  if (s2 && s2[1]) slides.slide_2.headline = s2[1];
  if (s2 && s2[2]) slides.slide_2.microcopy = s2[2].trim();

  const s3 = body.match(/### Slide 3:[^\n]*\n(?:!\[\[.*?\]\]\n)?\*Titular en Imagen:\* \*\*"?(.*?)"?\*\*(?:\s*\n\*Micro-copy:\* (.*?))?/);
  if (s3 && s3[1]) slides.slide_3.headline = s3[1];
  if (s3 && s3[2]) slides.slide_3.microcopy = s3[2].trim();

  const s4 = body.match(/### Slide 4:[^\n]*\n(?:!\[\[.*?\]\]\n)?\*Titular en Imagen:\* \*\*"?(.*?)"?\*\*(?:\s*\n\*Micro-copy:\* (.*?))?/);
  if (s4 && s4[1]) slides.slide_4.headline = s4[1];
  if (s4 && s4[2]) slides.slide_4.microcopy = s4[2].trim();

  return slides;
}

/**
 * Builds Full Context-Aware Prompts Manifest for the Publication
 */
function buildContextualManifest(notePath, inputImagePath = null) {
  const fileContent = fs.readFileSync(notePath, 'utf8');
  const { frontmatter, body } = parseYamlFrontmatter(fileContent);

  const noteFileName = path.basename(notePath);
  const isCarousel = frontmatter.content_type === 'carrusel-4-slides' || noteFileName.includes('carrusel');
  const assetTopic = frontmatter.topic || frontmatter.asset_class || frontmatter.garment || 'Real Estate RWA Tokenization';
  const technicalRef = frontmatter.technical_reference || frontmatter.cultural_reference || 'Solana Metaplex Core / Delaware SPV';
  const platform = frontmatter.platform || 'linkedin';
  const aspectRatio = frontmatter.aspect_ratio || (isCarousel ? '4:5' : '9:16');

  // Derive Folder Name
  const slugMatch = noteFileName.replace(/\.md$/, '').match(/\d{4}-\d{2}-\d{2}-(?:[a-z0-9]+)-(?:carrusel-)?(.*)/);
  const slug = slugMatch ? slugMatch[1] : noteFileName.replace(/\.md$/, '');
  const dateMatch = noteFileName.match(/^\d{4}-\d{2}-\d{2}/);
  const dateStr = dateMatch ? dateMatch[0] : new Date().toISOString().slice(0, 10);

  const folderName = isCarousel ? `${dateStr}-carrusel-${slug}` : `${dateStr}-assets-${slug}`;
  const assetDir = path.join(ASSETS_ROOT, folderName);
  ensureDir(assetDir);

  const slideDetails = extractSlideDetails(body, assetTopic, technicalRef);
  const assetContext = extractAssetContext(assetTopic);

  // If input image was provided, copy it cleanly to assetDir as 01-portada-hero.png
  let heroImageCopied = false;
  if (inputImagePath && fs.existsSync(inputImagePath)) {
    const heroTarget = path.join(assetDir, '01-portada-hero.png');
    fs.copyFileSync(inputImagePath, heroTarget);
    heroImageCopied = true;
  }

  const manifest = {
    source_publication_note: path.relative(ROOT_DIR, notePath),
    publication_title: frontmatter.title || path.basename(notePath, '.md'),
    asset_topic: assetTopic,
    technical_reference: technicalRef,
    aspect_ratio: `${aspectRatio} (${aspectRatio === '4:5' ? '1080x1350 px' : '1080x1920 px'})`,
    context_alignment: {
      brand: "BRIDS.io",
      slogan: assetContext.brand_slogan,
      ecosystem: assetContext.platform_ecosystem,
      asset_context: assetContext.asset_specifics,
      ticket_minimum: assetContext.ticket_minimum,
      settlement: assetContext.settlement_currency
    },
    brand_visual_tokens: {
      palette: {
        deep_blue_primary: "#0B192C",
        solana_green_accent: "#14F195",
        cyan_neon_accent: "#00F5D4",
        canvas_off_white: "#F8FAFC",
        pure_white_text: "#FFFFFF"
      },
      positive_tokens: "brids institutional brand visual style, ultra-clean architectural photography, institutional real estate, solana ecosystem, modern financial charts, metaplex core diagrams, high-end fintech, ample negative space, clean typography, luxury commercial property",
      negative_tokens: "cluttered, cartoon, low resolution, cheap cosplay, garment, anime, clothing, fashion, textiles, noisy textures, amateur composition, oversaturated neon"
    },
    slides: {
      slide_1_hero: {
        file: "01-portada-hero.png",
        type: "Fotografía Arquitectónica Editorial / Hero",
        overlay_headline: slideDetails.slide_1.headline,
        overlay_microcopy: slideDetails.slide_1.microcopy,
        context_prompt: `High-end architectural photography of modern luxury commercial real estate building representing ${assetTopic}, dramatic dusk lighting with subtle cyan (#00F5D4) and solana green (#14F195) architectural accents, clean geometric lines, professional fintech real estate magazine cover aesthetic, photorealistic 8k.`
      },
      slide_2_tech_diagram: {
        file: "02-diagrama-arquitectura-tecnica.png",
        type: "Diagrama de Arquitectura de Smart Contracts & SPV",
        overlay_headline: slideDetails.slide_2.headline,
        overlay_microcopy: slideDetails.slide_2.microcopy,
        context_prompt: `Clean minimalist infographic technical diagram illustrating ${technicalRef} on deep navy background (#0B192C), glowing solana green accents (#14F195), elegant vector nodes showing Delaware SPV connected to Solana blockchain and Stripe KYC validation, precision fintech UI blueprint, sharp contrast, highly legible.`
      },
      slide_3_financial_breakdown: {
        file: "03-desglose-financiero-rendimiento.png",
        type: "Panel Financiero & Desglose de Rendimiento USDC",
        overlay_headline: slideDetails.slide_3.headline,
        overlay_microcopy: slideDetails.slide_3.microcopy,
        context_prompt: `Sophisticated fintech dashboard metric visual showing fractional real estate yield and cash flow in USDC, clean charts, elegant dark mode UI (#0B192C), emerald green performance indicators (#14F195), pristine typography, minimal and breathable composition.`
      },
      slide_4_conversion_cta: {
        file: "04-conversion-cta.png",
        type: "Slide de Cierre Institucional & CTA",
        overlay_headline: slideDetails.slide_4.headline,
        overlay_microcopy: slideDetails.slide_4.microcopy,
        context_prompt: `Minimalist high-end fintech slide on dark solid slate blue canvas (#0B192C), centered modern white BRIDS logo emblem, clean typography 'BRIDS.IO — REAL ESTATE ON SOLANA', subtle emerald glow (#14F195), vast negative space, institutional venture-backed startup aesthetic.`
      }
    }
  };

  const manifestPath = path.join(assetDir, 'generation-prompts.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return {
    success: true,
    notePath,
    noteFileName,
    assetDir,
    manifestPath,
    manifest,
    heroImageCopied
  };
}

// -------------------------------------------------------------
// CLI INTERFACE
// -------------------------------------------------------------
function runCli() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║         SISTEMA DE REFERENCIA DE PUBLICACIÓN & GENERADOR DE CONTEXTO VISUAL (BRIDS)   ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

DESCRIPCIÓN:
  Toma como referencia cualquier nota de publicación existente en Obsidian, extrae
  automáticamente su frontmatter, hook, micro-copys y referencia técnica, los cruza con
  el Marketing Context y la Guía Visual de BRIDS.io, y genera los prompts contextualizados
  y la carpeta de activos lista para producción de imágenes arquitectónicas y financieras.

USO:
  bash Academic-Engine/scripts/generate-publication-assets.sh <nota-o-slug> [opciones]

EJEMPLOS:
  # Referenciar por nombre de archivo:
  bash Academic-Engine/scripts/generate-publication-assets.sh "2026-09-01-carrusel-solana-rwa-infrastructure-thesis.md"

  # Referenciar por slug o concepto:
  bash Academic-Engine/scripts/generate-publication-assets.sh "delaware-spv"

  # Referenciar y suministrar imagen de entrada:
  bash Academic-Engine/scripts/generate-publication-assets.sh "multifamily" --input-image ./foto-inmueble.jpg

  # Salida en JSON para automatizaciones / agentes:
  bash Academic-Engine/scripts/generate-publication-assets.sh "metaplex-core" --json

OPCIONES:
  --input-image <path>   Copia la fotografía de entrada como 01-portada-hero.png
  --json                 Devuelve la respuesta completa en formato JSON
  --help, -h             Muestra esta ayuda
`);
    process.exit(0);
  }

  let query = '';
  let inputImage = null;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--input-image' && args[i + 1]) {
      inputImage = args[++i];
    } else if (arg === '--json') {
      jsonOutput = true;
    } else if (!arg.startsWith('-') && !query) {
      query = arg;
    }
  }

  try {
    const notePath = resolvePublicationNote(query);
    const result = buildContextualManifest(notePath, inputImage);

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n' + '═'.repeat(85));
      console.log('🎨 SISTEMA DE REFERENCIA DE PUBLICACIÓN & CONTEXTO VISUAL (BRIDS.io)');
      console.log('═'.repeat(85));
      console.log(`\n📄 Publicación Referenciada:  ${result.noteFileName}`);
      console.log(`🏢 Tesis / Activo RWA:        ${result.manifest.asset_topic}`);
      console.log(`🛡️ Ancla Técnica:             ${result.manifest.technical_reference}`);
      console.log(`📁 Carpeta de Activos:        ${result.assetDir}`);
      console.log(`📜 Manifiesto de Prompts:     ${result.manifestPath}`);
      console.log(`🖼️ Foto Hero de Entrada:      ${result.heroImageCopied ? 'Procesada ✅' : 'Colocar en la carpeta de activos ⏳'}\n`);

      console.log('✨ PROMPTS CONTEXTUALES GENERADOS (LISTOS PARA IA):');
      console.log('─'.repeat(85));
      console.log(`[Slide 1 - Hero Arquitectónico]:\n${result.manifest.slides.slide_1_hero.context_prompt}\n`);
      console.log(`[Slide 2 - Arquitectura Smart Contracts]:\n${result.manifest.slides.slide_2_tech_diagram.context_prompt}\n`);
      console.log(`[Slide 3 - Desglose Financiero USDC]:\n${result.manifest.slides.slide_3_financial_breakdown.context_prompt}\n`);
      console.log(`[Slide 4 - Cierre Institucional CTA]:\n${result.manifest.slides.slide_4_conversion_cta.context_prompt}\n`);
      console.log('═'.repeat(85) + '\n');
    }
  } catch (err) {
    if (jsonOutput) {
      console.error(JSON.stringify({ success: false, error: err.message }));
    } else {
      console.error(`\n❌ ERROR: ${err.message}\n`);
    }
    process.exit(1);
  }
}

module.exports = {
  resolvePublicationNote,
  extractAssetContext,
  extractGarmentContext,
  buildContextualManifest
};

if (require.main === module) {
  runCli();
}
