#!/usr/bin/env node

/**
 * Web Ingest & URL Source Conversion Engine
 * Academic-Engine
 * 
 * Fetches web content, cleans HTML to structured Markdown,
 * preserves metadata, URL provenance, and updates SOURCES_INDEX.md.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');
const WEB_CONVERTED_DIR = path.join(VAULT_DIR, 'Sources', 'Web Converted');
const SOURCES_INDEX_PATH = path.join(VAULT_DIR, 'Sources', 'SOURCES_INDEX.md');

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fetchWebPage(url) {
  try {
    // Use curl with reasonable timeout and User-Agent
    const cmd = `curl -sL --max-time 15 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)" "${url}"`;
    const html = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return html;
  } catch (e) {
    console.error(`Error fetching URL with curl: ${e.message}`);
    return null;
  }
}

function cleanHtmlToMarkdown(html, fallbackTitle = 'Web Article') {
  if (!html) return { title: fallbackTitle, content: '' };

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  let title = titleMatch ? titleMatch[1].trim() : fallbackTitle;
  title = title.replace(/\s+/g, ' ').replace(/[|\\/]/g, '-');

  // Extract main article or body content
  let bodyContent = html;
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                     html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                     html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (articleMatch) {
    bodyContent = articleMatch[1];
  }

  // Remove scripts, styles, svg, forms, nav, footer
  bodyContent = bodyContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');

  // Convert basic headings
  bodyContent = bodyContent.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n');
  bodyContent = bodyContent.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n');
  bodyContent = bodyContent.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n');
  bodyContent = bodyContent.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n');

  // Convert paragraphs & breaks
  bodyContent = bodyContent.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n');
  bodyContent = bodyContent.replace(/<br\s*[\/]?>/gi, '\n');

  // Convert list items
  bodyContent = bodyContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1');

  // Convert bold & italic
  bodyContent = bodyContent.replace(/<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
  bodyContent = bodyContent.replace(/<(?:em|i)>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');

  // Strip remaining HTML tags
  bodyContent = bodyContent.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  bodyContent = bodyContent
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { title, content: bodyContent };
}

function updateSourcesIndex(title, slug, year = '2026', authors = '—', refUrl = '', status = 'converted') {
  if (!fs.existsSync(SOURCES_INDEX_PATH)) {
    fs.writeFileSync(SOURCES_INDEX_PATH, `# Sources Index\n\n| Source | Authors | Year | Kind | Reference | Projects | Status |\n| --- | --- | --- | --- | --- | --- | --- |\n`, 'utf8');
  }

  let indexContent = fs.readFileSync(SOURCES_INDEX_PATH, 'utf8');
  const sourceLink = `[[Sources/Web Converted/${slug}/${slug}.md|${title}]]`;

  if (indexContent.includes(slug)) {
    console.log(`  [INDEX] "${slug}" already exists in SOURCES_INDEX.md`);
    return;
  }

  const refMarkdown = refUrl ? `[Link](${refUrl})` : 'web';
  const newRow = `| ${sourceLink} | ${authors} | ${year} | web | ${refMarkdown} | — | ${status} |\n`;
  indexContent = indexContent.trimEnd() + '\n' + newRow;
  fs.writeFileSync(SOURCES_INDEX_PATH, indexContent, 'utf8');
  console.log(`  [INDEX] Added "${title}" to SOURCES_INDEX.md`);
}

function processSingleUrl(url, customTitle = null) {
  console.log(`\n🌐 Fetching URL: ${url}`);
  const rawHtml = fetchWebPage(url);

  if (!rawHtml) {
    console.error(`Failed to retrieve content from: ${url}`);
    return null;
  }

  const parsed = cleanHtmlToMarkdown(rawHtml, customTitle || 'Web Source');
  const effectiveTitle = customTitle || parsed.title;
  const slug = slugify(effectiveTitle).slice(0, 60);

  const targetFolder = path.join(WEB_CONVERTED_DIR, slug);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // Save raw response or text
  fs.writeFileSync(path.join(targetFolder, 'original.txt'), rawHtml.slice(0, 50000), 'utf8');

  const currentDate = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear().toString();

  const noteContent = `---
title: "${effectiveTitle.replace(/"/g, '\\"')}"
type: source
kind: web
source_url: "${url}"
slug: "${slug}"
status: converted
date_ingested: "${currentDate}"
tags:
  - source
  - web
  - academic
---

# ${effectiveTitle}

> [!NOTE] Metadatos de la Fuente Web
> - **URL de origen:** [${url}](${url})
> - **Fecha de ingesta:** ${currentDate}
> - **Estado:** Convertido a Markdown

## Resumen Ejecutivo

[Pendiente de síntesis analítica]

## Contenido Extraído

${parsed.content.slice(0, 30000)}

## Enlaces & Referencias

- [[Sources/SOURCES_INDEX|Índice Maestro de Fuentes]]
- [Enlace Web Original](${url})
`;

  const notePath = path.join(targetFolder, `${slug}.md`);
  fs.writeFileSync(notePath, noteContent, 'utf8');
  console.log(`  [NOTE] Created note at: Sources/Web Converted/${slug}/${slug}.md`);

  updateSourcesIndex(effectiveTitle, slug, currentYear, '—', url, 'converted');

  return { slug, notePath };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Uso:
  bash Academic-Engine/scripts/ingest-web.sh <URL> [titulo-opcional]

Ejemplo:
  bash Academic-Engine/scripts/ingest-web.sh "https://developer.mozilla.org/es/docs/Web/JavaScript" "Guia JavaScript MDN"
`);
    return;
  }

  const url = args[0];
  const customTitle = args[1] || null;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error(`Error: "${url}" is not a valid URL (must start with http:// or https://)`);
    process.exit(1);
  }

  processSingleUrl(url, customTitle);
}

if (require.main === module) {
  main();
}

module.exports = { processSingleUrl };
