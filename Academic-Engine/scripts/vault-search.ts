#!/usr/bin/env node
/**
 * vault-search.ts - Lean in-memory hybrid search for Academic Vault
 * Node 26 native TypeScript execution (--experimental-strip-types)
 * Zero external dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface VaultChunk {
  readonly filePath: string;
  readonly relativePath: string;
  readonly heading: string;
  readonly content: string;
}

export interface SearchOptions {
  readonly query: string;
  readonly category?: string;
  readonly limit: number;
  readonly json: boolean;
}

export interface SearchResult {
  readonly filePath: string;
  readonly relativePath: string;
  readonly heading: string;
  readonly score: number;
  readonly snippet: string;
}

export function parseArgs(argv: string[]): SearchOptions {
  let query = '';
  let category: string | undefined;
  let limit = 5;
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--category' || arg === '-c') {
      category = argv[++i];
    } else if (arg === '--limit' || arg === '-l') {
      const parsed = parseInt(argv[++i] ?? '5', 10);
      if (!Number.isNaN(parsed) && parsed > 0) limit = parsed;
    } else if (arg === '--json') {
      json = true;
    } else if (!arg.startsWith('-') && !query) {
      query = arg;
    }
  }

  return { query: query.trim(), category, limit, json };
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function chunkMarkdown(filePath: string, relativePath: string, raw: string): VaultChunk[] {
  // Strip YAML frontmatter
  const body = raw.replace(/^---[\s\S]*?---\r?\n/, '');
  const lines = body.split(/\r?\n/);
  const chunks: VaultChunk[] = [];

  let currentHeading = path.basename(filePath, path.extname(filePath));
  let currentLines: string[] = [];

  const flush = () => {
    const text = currentLines.join('\n').trim();
    if (text.length > 0) {
      chunks.push({
        filePath,
        relativePath,
        heading: currentHeading,
        content: text,
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch && headingMatch[2]) {
      flush();
      currentHeading = headingMatch[2].replace(/[#*_`]/g, '').trim();
    } else {
      currentLines.push(line);
    }
  }
  flush();

  return chunks;
}

export function scanVault(searchDirs: string | string[], categoryFilter?: string): VaultChunk[] {
  const dirs = Array.isArray(searchDirs) ? searchDirs : [searchDirs];
  const chunks: VaultChunk[] = [];

  for (const baseDir of dirs) {
    if (!fs.existsSync(baseDir)) continue;

    function walk(currentDir: string) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            walk(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const relativePath = path.relative(baseDir, fullPath);
          if (categoryFilter && !relativePath.toLowerCase().startsWith(categoryFilter.toLowerCase())) {
            continue;
          }
          try {
            const raw = fs.readFileSync(fullPath, 'utf8');
            chunks.push(...chunkMarkdown(fullPath, relativePath, raw));
          } catch {
            // Skip unreadable files gracefully
          }
        }
      }
    }

    walk(baseDir);
  }

  return chunks;
}

export function scoreChunk(chunk: VaultChunk, queryNorm: string, terms: string[]): number {
  if (terms.length === 0) return 0;

  const headingNorm = normalize(chunk.heading);
  const contentNorm = normalize(chunk.content);
  let score = 0;

  // Exact phrase match bonus
  if (headingNorm.includes(queryNorm)) score += 15;
  if (contentNorm.includes(queryNorm)) score += 8;

  // Word-boundary matching for each query term
  for (const term of terms) {
    const termEscaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRegex = new RegExp(`\\b${termEscaped}\\b`, 'gi');

    const headingMatches = (headingNorm.match(wordRegex) || []).length;
    const contentMatches = (contentNorm.match(wordRegex) || []).length;

    if (headingMatches > 0) {
      score += 6 * headingMatches;
    }
    if (contentMatches > 0) {
      score += 2 + Math.min(contentMatches, 8) * 0.75;
    }
  }

  return score;
}

export function searchVault(searchDirs: string | string[], options: SearchOptions): SearchResult[] {
  if (!options.query) return [];

  const queryNorm = normalize(options.query);
  const terms = queryNorm.split(/\s+/).filter((t) => t.length > 1);
  const chunks = scanVault(searchDirs, options.category);
  const scored: SearchResult[] = [];

  for (const chunk of chunks) {
    const score = scoreChunk(chunk, queryNorm, terms);
    if (score > 0) {
      // Create concise snippet
      const cleanContent = chunk.content.replace(/\s+/g, ' ').slice(0, 180);
      scored.push({
        filePath: chunk.filePath,
        relativePath: chunk.relativePath,
        heading: chunk.heading,
        score: Math.round(score * 10) / 10,
        snippet: cleanContent + (chunk.content.length > 180 ? '...' : ''),
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, options.limit);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const rootDir = path.resolve(__dirname, '../..');
  const searchDirs = [
    path.join(rootDir, 'Academic Vault'),
    path.join(rootDir, 'Academic-Engine', 'context'),
    path.join(rootDir, 'Academic-Engine', 'docs'),
  ];

  if (!options.query) {
    console.error('Uso: vault-search.sh "<termino o concepto>" [--category Drafts] [--limit 5] [--json]');
    process.exit(1);
  }

  const results = searchVault(searchDirs, options);

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(`\n🔍 No se encontraron coincidencias para: "${options.query}"`);
    return;
  }

  console.log(`\n🔍 Resultados para: "${options.query}" (${results.length} coincidencias)\n`);
  for (let i = 0; i < results.length; i++) {
    const r = results[i]!;
    console.log(`\x1b[36m[${i + 1}] ${r.heading}\x1b[0m \x1b[33m(Score: ${r.score})\x1b[0m`);
    console.log(`   📄 \x1b[90m${r.relativePath}\x1b[0m`);
    console.log(`   ${r.snippet}\n`);
  }
}

// Run CLI when invoked directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}

