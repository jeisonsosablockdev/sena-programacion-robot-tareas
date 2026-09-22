#!/usr/bin/env node

/**
 * Social Content Generator & Extractor for BRIDS
 * Instantiates new social media posts and threads based on BRIDS Institutional Architecture.
 * Strictly follows the naming convention: YYYY-MM-DD-platform-idea.md
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_SOCIAL_DIR = path.join(ROOT_DIR, 'Academic Vault', 'Drafts', 'Social');

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

// -------------------------------------------------------------
// CLI GENERATOR
// -------------------------------------------------------------

function generatePost(platformInput, ideaInput, typeInput, technicalRefInput, assetClassInput) {
  if (!platformInput || !ideaInput) {
    console.log(`
Uso: create-social-post <redsocial> "<idea-o-concepto>" [tipo-contenido] [referencia-tecnica] [clase-activo]

Parámetros:
  redsocial:            linkedin | twitter | farcaster | telegram | youtube
  idea-o-concepto:      Nombre o concepto en texto (ej. "delaware-spv-compliance", "metaplex-core-rwa")
  tipo-contenido:       rwa-tokenization | institutional-gp | solana-yield | founder-insight (opcional)
  referencia-tecnica:   Solana Metaplex Core | Delaware Series LLC | Stripe Identity KYC (opcional)
  clase-activo:         Commercial Real Estate | Multifamily Class-A | Logistics Hubs (opcional)

Ejemplo:
  bash Academic-Engine/scripts/create-social-post.sh linkedin "delaware-spv-compliance" institutional-gp "Delaware Series LLC" "Multifamily Class-A"
`);
    process.exit(1);
  }

  const platform = sanitizeSlug(platformInput);
  const idea = sanitizeSlug(ideaInput);
  const dateStr = getTodayString();
  const fileName = `${dateStr}-${platform}-${idea}.md`;
  const targetPath = path.join(VAULT_SOCIAL_DIR, fileName);

  ensureDir(VAULT_SOCIAL_DIR);

  if (fs.existsSync(targetPath)) {
    console.error(`\n⚠️ ERROR DE PROTECCIÓN: El archivo "${fileName}" ya existe en:`);
    console.error(`   ${targetPath}`);
    console.error(`   Para refinarlo de forma segura sin sobrescribir, utiliza:`);
    console.error(`   bash Academic-Engine/scripts/refine-note.sh refine "${path.relative(ROOT_DIR, targetPath)}" "Tu resumen"\n`);
    process.exit(1);
  }

  const contentType = (typeInput || 'rwa-tokenization').toLowerCase();
  const technicalRef = technicalRefInput || 'Solana Metaplex Core / Delaware SPV';
  const assetClass = assetClassInput || 'Commercial Real Estate RWA';

  let typeEmoji = '🏢';
  let typeTitle = 'Tokenización de Real Estate RWA';
  let pillarFocus = `Demostración de liquidez on-chain, estructuración jurídica dual SPV y reducción de intermediarios.`;

  if (contentType.includes('gp') || contentType.includes('sponsor') || contentType.includes('institutional')) {
    typeEmoji = '🤝';
    typeTitle = 'Propuesta de Valor para B2B Sponsors / GPs';
    pillarFocus = `Acceso a capital global minorista acreditado, sindicación sin fricción y dashboard de compliance unificado.`;
  } else if (contentType.includes('yield') || contentType.includes('solana') || contentType.includes('defi')) {
    typeEmoji = '⚡';
    typeTitle = 'Rendimiento On-Chain & Ventaja Solana';
    pillarFocus = `Liquidación sub-segundo, transacciones por menos de $0.001 y plugins nativos de freeze/recovery en Metaplex Core.`;
  } else if (contentType.includes('founder') || contentType.includes('insight') || contentType.includes('thesis')) {
    typeEmoji = '🧠';
    typeTitle = 'Tesis Fundadora & Thought Leadership';
    pillarFocus = `Por qué el 99% de las soluciones RWA en Ethereum fallan por costos de gas y rigidez regulatoria ERC-3643.`;
  }

  const postContent = `---
title: "[${platform.toUpperCase()}] ${idea.replace(/-/g, ' ')}"
category: "Drafts"
workflow: "W5_CONTENT_SOCIAL"
skills_used:
  - "mas-social-content"
  - "mas-copywriting"
  - "founder-ghostwriter"
platform: "${platform}"
content_type: "${contentType}"
technical_reference: "${technicalRef}"
asset_class: "${assetClass}"
status: draft
version: "1.0"
created_at: ${dateStr}
updated_at: ${dateStr}
tags:
  - marketing
  - social-content
  - rwa
  - solana
  - ${platform}
  - ${idea}
---

# [${platform.toUpperCase()}] ${idea.replace(/-/g, ' ').toUpperCase()}

> [!NOTE]
> **Resumen Ejecutivo:** Publicación institucional para ${platform.toUpperCase()} orientada a ${typeTitle}. Enfoque en ${assetClass} con referencia técnica a *${technicalRef}*, destacando estructura de custodia, cumplimiento Delaware SPV y liquidación instantánea.

---

## 🎯 Contexto y Objetivo
- **Plataforma:** ${platform.toUpperCase()} (@brids_io)
- **Formato:** Publicación Institucional / Hilo de Liderazgo
- **Pilar Temático:** ${pillarFocus}
- **Activo Inmobiliario:** ${assetClass}
- **Ancla Técnica:** *${technicalRef}*

---

## 📋 Copy Oficial para ${platform.toUpperCase()}

\`\`\`markdown
La tokenización inmobiliaria tradicional intentó forzar estándares lentos en redes con tarifas exorbitantes.

En BRIDS cambiamos las reglas del juego:
1. Infraestructura sobre Solana: Liquidación sub-segundo y costos inferiores a \$0.001 por transacción.
2. Cumplimiento Dual Delaware SPV: Cada propiedad vive en una entidad jurídica independiente segregada de pasivos.
3. Plugins Metaplex Core: Recuperación y congelamiento de activos ante incidentes o mandatos judiciales, sin perder descentralización.

El capital institucional no busca especulación; busca rendimientos reales garantizados por activos tangibles.

Conoce la arquitectura en brids.io

#BRIDS #RealWorldAssets #Solana #RealEstate #InstitutionalCrypto #Fintech #${idea.replace(/-/g, '')}
\`\`\`

---

## 🔄 Historial de Revisiones (Changelog)
- **v1.0 (${dateStr}):** Creación de publicación institucional mediante el generador de BRIDS.

---

## 🔗 Referencias Cruzadas
- Arquitectura de Software: [[Concepts/concept-solana-rwa-infrastructure.md]]
- Estructuración y Cumplimiento: [[Concepts/concept-dual-entity-compliance.md]]
`;

  fs.writeFileSync(targetPath, postContent, 'utf8');

  console.log(`\n🎉 Publicación generada exitosamente para BRIDS:`);
  console.log(`   📄 Archivo:  ${fileName}`);
  console.log(`   📍 Ruta:     ${targetPath}`);
  console.log(`   📱 Red:      ${platform.toUpperCase()}`);
  console.log(`   💡 Concepto: ${idea}`);
  console.log(`   🛡️ Tipo:     ${typeTitle} (${technicalRef})\n`);
}

// -------------------------------------------------------------
// ROUTER
// -------------------------------------------------------------
const [,, platformArg, ideaArg, typeArg, technicalRefArg, assetClassArg] = process.argv;
generatePost(platformArg, ideaArg, typeArg, technicalRefArg, assetClassArg);

