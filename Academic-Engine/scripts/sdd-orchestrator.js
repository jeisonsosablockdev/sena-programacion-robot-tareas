#!/usr/bin/env node

/**
 * Spec-Driven Development (SDD) & Two-Agent Evaluator-Optimizer Engine
 * Academic AI Studio - SENA & Computer Science
 * 
 * Orchestrates deliverable specifications, atomic step verification,
 * and the Two-Agent (Creator/Editor vs Reviewer) quality optimization loops:
 *   Loop 1 (Spec Loop): spec-editor <-> academic-reviewer (Score >= 8.5/9.0)
 *   HITL-1: Human Spec Approval (Before any drafting begins)
 *   Loop 2 (Task Loop): task-editor <-> academic-reviewer/code-reviewer (Score >= 8.5/9.0)
 *   HITL-2: Human Deliverable Approval (Before integration into Academic Vault)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');
const SPECS_DIR = path.join(VAULT_DIR, 'Inbox', 'Specs');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'Academic-Engine', 'templates');
const SPEC_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'deliverable-spec-template.md');
const CRITICISM_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'criticism-report-template.json');
const SPEC_CRITICISM_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'spec-criticism-report-template.json');

const VALID_SUBAGENTS = [
  // BRIDS Founder & YC Squad
  'business-consultant',
  'market-research-analyst',
  'pitch-deck-architect',
  'compliance-officer',
  'b2b-sponsor-lead',
  'founder-ghostwriter',
  // Academic, CS & Optimization Squad
  'cs-tutor',
  'code-reviewer',
  'research-librarian',
  'thesis-writer',
  'methodology-consultant',
  'academic-reviewer',
  'task-editor',
  // Software Engineering & Developer Squad
  'typescript-developer',
  'rust-developer',
  'python-developer',
  'node-developer'
];

const VALID_VAULT_PREFIXES = [
  // Academic Vault Core
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

// Strict banned robot phrases & LLM clichés (Spanish & English)
const BANNED_PATTERNS = [
  { pattern: /\ben resumen\b/gi, phrase: 'en resumen', penalty: 0.5 },
  { pattern: /\ben conclusi[oó]n\b/gi, phrase: 'en conclusión', penalty: 0.5 },
  { pattern: /\bpara concluir\b/gi, phrase: 'para concluir', penalty: 0.5 },
  { pattern: /\ben definitiva\b/gi, phrase: 'en definitiva', penalty: 0.5 },
  { pattern: /\bes importante (destacar|mencionar|recalcar|señalar|notar)\b/gi, phrase: 'es importante destacar/mencionar', penalty: 0.5 },
  { pattern: /\bcabe (destacar|resaltar|mencionar|señalar)\b/gi, phrase: 'cabe destacar/resaltar', penalty: 0.5 },
  { pattern: /\bes crucial (destacar|mencionar|resaltar)\b/gi, phrase: 'es crucial destacar', penalty: 0.5 },
  { pattern: /\ben el (vertiginoso|cambiante|competitivo) mundo\b/gi, phrase: 'en el vertiginoso/cambiante mundo', penalty: 0.5 },
  { pattern: /\ben un mundo cada vez m[aá]s\b/gi, phrase: 'en un mundo cada vez más', penalty: 0.5 },
  { pattern: /\bun papel (crucial|fundamental|vital|clave)\b/gi, phrase: 'un papel crucial/fundamental', penalty: 0.5 },
  { pattern: /\bjuega un (papel|rol) (crucial|fundamental|vital|clave)\b/gi, phrase: 'juega un papel/rol crucial', penalty: 0.5 },
  { pattern: /\ba la vanguardia\b/gi, phrase: 'a la vanguardia', penalty: 0.4 },
  { pattern: /\bcambio de paradigma\b/gi, phrase: 'cambio de paradigma', penalty: 0.4 },
  { pattern: /\bsumerg[ií]rse en\b/gi, phrase: 'sumergirse en', penalty: 0.4 },
  { pattern: /\badentr[eé]monos en\b/gi, phrase: 'adentrémonos en', penalty: 0.4 },
  { pattern: /\ben este art[ií]culo\b/gi, phrase: 'en este artículo', penalty: 0.3 },
  { pattern: /\ben este post\b/gi, phrase: 'en este post', penalty: 0.3 },
  { pattern: /\ba lo largo de este\b/gi, phrase: 'a lo largo de este', penalty: 0.3 },
  { pattern: /\bsin duda alguna\b/gi, phrase: 'sin duda alguna', penalty: 0.4 },
  { pattern: /\bno cabe duda\b/gi, phrase: 'no cabe duda', penalty: 0.4 },
  { pattern: /\bcomo hemos visto\b/gi, phrase: 'como hemos visto', penalty: 0.3 },
  { pattern: /\bcomo se mencion[oó] anteriormente\b/gi, phrase: 'como se mencionó anteriormente', penalty: 0.3 },
  // English equivalents
  { pattern: /\bin conclusion\b/gi, phrase: 'in conclusion', penalty: 0.5 },
  { pattern: /\bit is important to note\b/gi, phrase: 'it is important to note', penalty: 0.5 },
  { pattern: /\bit is worth noting\b/gi, phrase: 'it is worth noting', penalty: 0.5 },
  { pattern: /\bin today's (fast-paced|dynamic) world\b/gi, phrase: "in today's fast-paced world", penalty: 0.5 },
  { pattern: /\bplays a (crucial|vital|pivotal) role\b/gi, phrase: 'plays a crucial role', penalty: 0.5 },
  { pattern: /\bdelve into\b/gi, phrase: 'delve into', penalty: 0.4 },
  { pattern: /\bdive deep into\b/gi, phrase: 'dive deep into', penalty: 0.4 }
];

function sanitizeSlug(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getSpecPaths(slug) {
  const cleanSlug = sanitizeSlug(slug);
  ensureDir(SPECS_DIR);
  return {
    slug: cleanSlug,
    specId: `SPEC-${cleanSlug.toUpperCase()}`,
    specMdPath: path.join(SPECS_DIR, `${cleanSlug}.spec.md`),
    specJsonPath: path.join(SPECS_DIR, `${cleanSlug}.spec.json`),
    workDir: path.join(SPECS_DIR, `${cleanSlug}-work`),
    approvedSpecPath: path.join(SPECS_DIR, `${cleanSlug}-work`, 'approved_spec.md'),
    approvedDraftPath: path.join(SPECS_DIR, `${cleanSlug}-work`, 'approved_draft.md')
  };
}

function loadSpec(slug) {
  const paths = getSpecPaths(slug);
  if (!fs.existsSync(paths.specJsonPath)) {
    throw new Error(`No se encontró el spec "${slug}" en ${paths.specJsonPath}`);
  }
  const specData = JSON.parse(fs.readFileSync(paths.specJsonPath, 'utf8'));
  return { data: specData, paths };
}

function saveSpec(paths, specData) {
  specData.updated_at = new Date().toISOString();
  fs.writeFileSync(paths.specJsonPath, JSON.stringify(specData, null, 2), 'utf8');
}

// -------------------------------------------------------------
// AUDIT & RUBRIC ENGINE (0 to 9 Scale, 8.5 Threshold)
// -------------------------------------------------------------

/**
 * Audits a specification markdown document against the 4 core dimensions:
 * 1. Requirements & Pertinence (2.5 pts)
 * 2. Technical Rigor, Acceptance Criteria & Feasibility (2.5 pts)
 * 3. Structural Clarity & Breakdown (2.0 pts)
 * 4. Lexical Originality & Zero Clichés (2.0 pts)
 */
function auditSpec(specText, specData = {}) {
  const content = specText || '';
  const findings = {
    requirements_and_pertinence: [],
    technical_rigor: [],
    clarity_and_structure: [],
    lexical_originality: []
  };

  // --- Dimension 1: Pertinencia con los Requisitos & Objetivo (Max 2.5 pts) ---
  let scoreReq = 2.5;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 150) {
    scoreReq -= 1.0;
    findings.requirements_and_pertinence.push(`Especificación demasiado escueta (${wordCount} palabras; mínimo recomendado 150 palabras).`);
  }

  const goal = (specData.intent && specData.intent.business_goal) || '';
  if (goal) {
    const goalKeywords = goal.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchedGoal = goalKeywords.some(k => content.toLowerCase().includes(k));
    if (!matchedGoal && goalKeywords.length > 0) {
      scoreReq -= 0.6;
      findings.requirements_and_pertinence.push(`El spec no evidencia alineación directa con el objetivo requerido ("${goal}").`);
    }
  }

  const icp = (specData.intent && specData.intent.target_icp) || '';
  if (icp) {
    const icpKeywords = icp.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matchedIcp = icpKeywords.some(k => content.toLowerCase().includes(k));
    if (!matchedIcp && icpKeywords.length > 0) {
      scoreReq -= 0.4;
      findings.requirements_and_pertinence.push(`Falta referencia explícita al público objetivo / ICP ("${icp}").`);
    }
  }
  scoreReq = Math.max(0, Math.min(2.5, scoreReq));

  // --- Dimension 2: Rigor Técnico, Criterios de Aceptación & Viabilidad (Max 2.5 pts) ---
  let scoreTech = 2.5;
  const hasAcceptanceCriteria = /(criterios de aceptaci[oó]n|acceptance criteria|criterios verificables|verificaci[oó]n|anclas t[eé]cnicas|requisitos funcionales)/i.test(content);
  if (!hasAcceptanceCriteria) {
    scoreTech -= 1.0;
    findings.technical_rigor.push('Falta una sección explícita de Criterios de Aceptación Verificables.');
  }

  const technicalKeywords = /(python|javascript|typescript|java|c#|sql|git|api|rest|docker|testing|clean code|solid|arquitectura|algoritmo|patr[oó]n|base de datos|uml|sena|frontend|backend|framework|seguridad|owasp)/i.test(content);
  if (!technicalKeywords) {
    scoreTech -= 0.8;
    findings.technical_rigor.push('Faltan anclas técnicas específicas del área de software / Computer Science.');
  }
  scoreTech = Math.max(0, Math.min(2.5, scoreTech));

  // --- Dimension 3: Claridad Estructural & Desglose de Pasos (Max 2.0 pts) ---
  let scoreStruct = 2.0;
  const hasSteps = /(step-01|step-02|paso 1|fase 1|desglose|outline|pasos de ejecuci[oó]n)/i.test(content);
  if (!hasSteps) {
    scoreStruct -= 0.8;
    findings.clarity_and_structure.push('Falta el desglose secuencial de pasos atómicos de ejecución (STEP-01, STEP-02...).');
  }
  const hasTargetFile = /(archivo destino|target_file|canonical|academic vault|ruta can[oó]nica)/i.test(content);
  if (!hasTargetFile) {
    scoreStruct -= 0.4;
    findings.clarity_and_structure.push('No se declara explícitamente el archivo o ruta destino en Academic Vault.');
  }
  scoreStruct = Math.max(0, Math.min(2.0, scoreStruct));

  // --- Dimension 4: Originalidad Léxica & Cero Clichés (Max 2.0 pts) ---
  let scoreLexical = 2.0;
  const detectedBanned = [];
  for (const item of BANNED_PATTERNS) {
    const matches = content.match(item.pattern);
    if (matches && matches.length > 0) {
      detectedBanned.push({
        phrase: item.phrase,
        count: matches.length,
        penaltyApplied: item.penalty
      });
      scoreLexical -= item.penalty * matches.length;
      findings.lexical_originality.push(`Cliché de IA detectado en spec: "${item.phrase}" (${matches.length}x).`);
    }
  }
  scoreLexical = Math.max(0, Math.min(2.0, scoreLexical));

  const totalScore = Math.round((scoreReq + scoreTech + scoreStruct + scoreLexical) * 10) / 10;
  const passed = totalScore >= 8.5;

  const remediationDirectives = [];
  if (detectedBanned.length > 0) {
    remediationDirectives.push(`Eliminar clichés de IA: ${detectedBanned.map(d => `"${d.phrase}"`).join(', ')}.`);
  }
  if (findings.requirements_and_pertinence.length > 0) {
    remediationDirectives.push(...findings.requirements_and_pertinence);
  }
  if (findings.technical_rigor.length > 0) {
    remediationDirectives.push(...findings.technical_rigor);
  }
  if (findings.clarity_and_structure.length > 0) {
    remediationDirectives.push(...findings.clarity_and_structure);
  }

  return {
    total_score: totalScore,
    scale_max: 9.0,
    passing_threshold: 8.5,
    passed,
    scoring_dimensions: {
      "1_requirements_and_pertinence": {
        name: "Pertinencia con los Requisitos & Objetivo",
        score: scoreReq,
        max_score: 2.5,
        passed: scoreReq >= 2.1,
        findings: findings.requirements_and_pertinence
      },
      "2_technical_rigor_and_standards": {
        name: "Rigor Técnico & Criterios de Aceptación",
        score: scoreTech,
        max_score: 2.5,
        passed: scoreTech >= 2.1,
        findings: findings.technical_rigor
      },
      "3_clarity_and_structure": {
        name: "Claridad Estructural & Desglose de Pasos",
        score: scoreStruct,
        max_score: 2.0,
        passed: scoreStruct >= 1.7,
        findings: findings.clarity_and_structure
      },
      "4_lexical_originality_and_anti_drift": {
        name: "Originalidad Léxica & Cero Clichés",
        score: scoreLexical,
        max_score: 2.0,
        passed: scoreLexical >= 1.8,
        banned_phrases_found: detectedBanned,
        findings: findings.lexical_originality
      }
    },
    banned_phrases_detected: detectedBanned,
    remediation_directives: remediationDirectives
  };
}

/**
 * Audits deliverable text (draft or final document) against 4 core dimensions:
 * 1. Requirements & Pertinence (2.5 pts)
 * 2. Technical Rigor & Software Standards (2.5 pts)
 * 3. Clarity & Structure (2.0 pts)
 * 4. Lexical Originality & Zero Clichés (2.0 pts)
 */
function auditText(text, specData = {}) {
  const content = text || '';
  const findings = {
    requirements_and_pertinence: [],
    technical_standards: [],
    clarity_and_structure: [],
    lexical_originality: []
  };

  // --- Dimension 1: Pertinencia con los Requisitos & Objetivo Solicitado (Max 2.5 pts) ---
  let scoreGoal = 2.5;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 100) {
    scoreGoal -= 1.0;
    findings.requirements_and_pertinence.push(`Extensión insuficiente (${wordCount} palabras; mínimo recomendado 100 palabras).`);
  }

  // Check for goal match
  if (specData.intent && specData.intent.business_goal) {
    const goalTokens = specData.intent.business_goal.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchedGoal = goalTokens.some(t => content.toLowerCase().includes(t));
    if (!matchedGoal && goalTokens.length > 0) {
      scoreGoal -= 0.5;
      findings.requirements_and_pertinence.push(`Baja pertinencia con el objetivo solicitado: "${specData.intent.business_goal}".`);
    }
  }

  // Check for actionable resolution, deliverables, conclusion, next steps or code exercises
  const hasActionableClose = /(pr[oó]ximos pasos|conclusi[oó]n t[eé]cnica|ejercicio|entregable|evaluaci[oó]n|implementaci[oó]n|c[oó]digo|resultado|resumen t[eé]cnico|recomendaciones)/i.test(content);
  if (!hasActionableClose) {
    scoreGoal -= 0.4;
    findings.requirements_and_pertinence.push('Falta una sección de cierre accionable (ejercicio práctico, resultados o próximos pasos técnicos).');
  }

  if (specData.intent && specData.intent.target_icp) {
    const icpKeywords = specData.intent.target_icp.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matchedIcp = icpKeywords.some(k => content.toLowerCase().includes(k));
    if (!matchedIcp && icpKeywords.length > 0) {
      scoreGoal -= 0.3;
      findings.requirements_and_pertinence.push(`No se encontraron referencias explícitas al perfil objetivo / ICP (${specData.intent.target_icp}).`);
    }
  }
  scoreGoal = Math.max(0, Math.min(2.5, scoreGoal));

  // --- Dimension 2: Rigor Científico/Técnico & Estándares de Software (Max 2.5 pts) ---
  let scoreTech = 2.5;
  const technicalGrounding = /(python|javascript|typescript|java|c#|fastapi|flask|django|react|node|sql|api|rest|git|arquitectura|algoritmo|uml|solid|clean code|testing|sena|software|backend|frontend|base de datos|docker|patr[oó]n|seguridad|complejidad|pseudoc[oó]digo|complejidad|complejidad algor[ií]tmica)/i.test(content);
  if (!technicalGrounding) {
    scoreTech -= 1.0;
    findings.technical_standards.push('Faltan anclas técnicas verificables (conceptos de software, arquitectura, stack, algoritmos o estándares).');
  }

  // Check for false speculative promises
  const speculativePromises = /(retorno garantizado 100%|cero riesgo absoluto|duplica tu dinero|sin riesgo legal|soluci[oó]n infalible sin fallas)/i.test(content);
  if (speculativePromises) {
    scoreTech -= 1.5;
    findings.technical_standards.push('Alerta de rigor: contiene afirmaciones especulativas o garantías irrealistas.');
  }
  scoreTech = Math.max(0, Math.min(2.5, scoreTech));

  // --- Dimension 3: Claridad, Coherencia & Estructura (Max 2.0 pts) ---
  let scoreClarity = 2.0;
  const passiveFillers = /(se podr[ií]a argumentar que|es menester se[ñn]alar|podemos colegir|a modo de introducci[oó]n|el presente documento pretende)/gi;
  const fillerMatches = (content.match(passiveFillers) || []).length;
  if (fillerMatches > 0) {
    scoreClarity -= fillerMatches * 0.4;
    findings.clarity_and_structure.push(`Se detectó prosa corporativa pasiva/impersonal (${fillerMatches} ocurrencias).`);
  }

  const hasHeadings = /^#{1,4}\s+.+/m.test(content);
  if (!hasHeadings) {
    scoreClarity -= 0.5;
    findings.clarity_and_structure.push('Falta jerarquía visual de encabezados Markdown (##, ###).');
  }
  scoreClarity = Math.max(0, Math.min(2.0, scoreClarity));

  // --- Dimension 4: Originalidad Léxica & Cero Clichés de IA (Max 2.0 pts) ---
  let scoreLexical = 2.0;
  const detectedBanned = [];
  for (const item of BANNED_PATTERNS) {
    const matches = content.match(item.pattern);
    if (matches && matches.length > 0) {
      detectedBanned.push({
        phrase: item.phrase,
        count: matches.length,
        penaltyApplied: item.penalty
      });
      scoreLexical -= item.penalty * matches.length;
      findings.lexical_originality.push(`Cliché de IA detectado: "${item.phrase}" (${matches.length}x).`);
    }
  }
  scoreLexical = Math.max(0, Math.min(2.0, scoreLexical));

  // --- Total Calculation (Scale 0 to 9.0) ---
  const totalScore = Math.round((scoreGoal + scoreTech + scoreClarity + scoreLexical) * 10) / 10;
  const passed = totalScore >= 8.5;

  const remediationDirectives = [];
  if (detectedBanned.length > 0) {
    remediationDirectives.push(`Eliminar inmediatamente las siguientes muletillas de IA: ${detectedBanned.map(d => `"${d.phrase}"`).join(', ')}.`);
  }
  if (findings.requirements_and_pertinence.length > 0) {
    remediationDirectives.push(...findings.requirements_and_pertinence);
  }
  if (findings.technical_standards.length > 0) {
    remediationDirectives.push(...findings.technical_standards);
  }
  if (findings.clarity_and_structure.length > 0) {
    remediationDirectives.push(...findings.clarity_and_structure);
  }

  return {
    total_score: totalScore,
    scale_max: 9.0,
    passing_threshold: 8.5,
    passed,
    scoring_dimensions: {
      "1_requirements_and_pertinence": {
        name: "Pertinencia con los Requisitos & Objetivo Solicitado",
        score: scoreGoal,
        max_score: 2.5,
        passed: scoreGoal >= 2.0,
        findings: findings.requirements_and_pertinence
      },
      "2_technical_rigor_and_standards": {
        name: "Rigor Científico/Técnico & Estándares de Software",
        score: scoreTech,
        max_score: 2.5,
        passed: scoreTech >= 2.1,
        findings: findings.technical_standards
      },
      "3_clarity_and_structure": {
        name: "Claridad, Coherencia & Estructura",
        score: scoreClarity,
        max_score: 2.0,
        passed: scoreClarity >= 1.7,
        findings: findings.clarity_and_structure
      },
      "4_lexical_originality_and_anti_drift": {
        name: "Originalidad Léxica & Cero Clichés de IA",
        score: scoreLexical,
        max_score: 2.0,
        passed: scoreLexical >= 1.8,
        banned_phrases_found: detectedBanned,
        findings: findings.lexical_originality
      }
    },
    banned_phrases_detected: detectedBanned,
    remediation_directives: remediationDirectives
  };
}

// -------------------------------------------------------------
// CORE SDD COMMANDS & HITL GUARDRAILS
// -------------------------------------------------------------

function initSpec(slug, title, targetFolder, subagentsStr, icp, goal) {
  if (!slug || !title || !targetFolder) {
    console.error('❌ Uso: sdd-orchestrator init <slug> "<titulo>" "<target-folder>" "<subagents>" "[icp]" "[goal]"');
    process.exit(1);
  }

  const cleanSlug = sanitizeSlug(slug);
  const paths = getSpecPaths(cleanSlug);

  // Validate target vault folder
  const normalizedTarget = targetFolder.replace(/^\/+|\/+$/g, '');
  const isValidVaultFolder = VALID_VAULT_PREFIXES.some(prefix => 
    normalizedTarget === prefix || normalizedTarget.startsWith(`${prefix}/`)
  );

  if (!isValidVaultFolder) {
    console.error(`❌ Carpeta de destino inválida: "${targetFolder}".`);
    console.error(`   Debe ser un dominio válido de Academic Vault (ej. "Drafts", "Reviews", "Concepts").`);
    process.exit(1);
  }

  // Parse and validate subagents
  const rawAgents = (subagentsStr || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  
  const subagents = rawAgents.length > 0 ? rawAgents : ['task-editor', 'academic-reviewer'];
  const unknownAgents = subagents.filter(a => !VALID_SUBAGENTS.includes(a));
  if (unknownAgents.length > 0) {
    console.warn(`⚠️ Advertencia: Los siguientes agentes no pertenecen al squad estándar: ${unknownAgents.join(', ')}`);
  }

  // Idempotency check: if spec already exists, return deterministic output
  if (fs.existsSync(paths.specJsonPath) && fs.existsSync(paths.specMdPath)) {
    console.log(`ℹ️ El spec "${cleanSlug}" ya existe en ${paths.specJsonPath}.`);
    const currentData = JSON.parse(fs.readFileSync(paths.specJsonPath, 'utf8'));
    console.log(`   Estado actual: ${currentData.status}`);
    return paths;
  }

  ensureDir(SPECS_DIR);
  ensureDir(paths.workDir);

  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];
  const targetFileName = `${cleanSlug}.md`;
  const canonicalVaultFile = path.join(targetFolder, targetFileName);

  let templateContent = '';
  if (fs.existsSync(SPEC_TEMPLATE_PATH)) {
    templateContent = fs.readFileSync(SPEC_TEMPLATE_PATH, 'utf8');
  }

  const primaryAgent = subagents[0] || 'task-editor';
  const secondaryAgent = subagents[1] || 'academic-reviewer';

  const defaultGoal = goal || `Especificación formal para ${title} en el contexto del programa de Software SENA.`;
  const defaultIcp = icp || 'Aprendices e Instructores SENA, Desarrolladores de Software';

  // Automated Idempotent Context Retrieval via vault-search.ts
  let vaultReferences = [
    'Perfil de Curso SENA - Programación de Software (course-profile.md)',
    'Guía de Estándares Clean Code y SOLID (cs-standards.md)'
  ];
  let contextChunks = [];
  try {
    const searchScript = path.join(__dirname, 'vault-search.ts');
    const searchQuery = `${title} ${defaultGoal}`.replace(/["`$]/g, ' ');
    const searchOut = execSync(`node --experimental-strip-types "${searchScript}" "${searchQuery}" --limit 3 --json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const parsed = JSON.parse(searchOut);
    if (Array.isArray(parsed) && parsed.length > 0) {
      contextChunks = parsed;
      vaultReferences = parsed.map(p => `${p.heading} (${p.relativePath})`);
    }
  } catch {
    // Graceful fallback to default references if search fails or in offline tests
  }

  const specMd = templateContent
    .replace(/\{\{SLUG\}\}/g, cleanSlug)
    .replace(/\{\{TITLE\}\}/g, title)
    .replace(/\{\{CATEGORY_FOLDER\}\}/g, normalizedTarget)
    .replace(/\{\{FILENAME\}\}/g, cleanSlug)
    .replace(/\{\{PRIMARY_AGENT\}\}/g, primaryAgent)
    .replace(/\{\{SECONDARY_AGENT\}\}/g, secondaryAgent)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{EXECUTIVE_SUMMARY\}\}/g, defaultGoal)
    .replace(/\{\{BUSINESS_GOAL\}\}/g, defaultGoal)
    .replace(/\{\{TARGET_ICP\}\}/g, defaultIcp)
    .replace(/\{\{PRIMARY_CTA\}\}/g, 'Revisar e implementar los módulos de código y especificaciones técnicas.')
    .replace(/\{\{PRIMARY_KPI\}\}/g, 'Superación de pruebas unitarias >= 90% y nota de auditoría >= 8.5/9.0')
    .replace(/\{\{REFERENCE_DOC_1\}\}/g, vaultReferences[0] || 'course-profile.md')
    .replace(/\{\{REFERENCE_DOC_2\}\}/g, vaultReferences[1] || 'cs-standards.md')
    .replace(/\{\{WORD_COUNT_RANGE\}\}/g, '500 - 1200 palabras');

  fs.writeFileSync(paths.specMdPath, specMd, 'utf8');

  // Machine-readable JSON state with 2 HITL checkpoints and dual-loop tracking
  const specJsonData = {
    spec_id: paths.specId,
    slug: cleanSlug,
    title,
    target_vault_folder: normalizedTarget,
    target_file: canonicalVaultFile,
    subagents_involved: subagents,
    context_retrieval: contextChunks,
    status: 'spec_review', // HITL-1 Review / Spec-Loop
    created_at: now,
    updated_at: now,
    hitl_checkpoints: {
      hitl_1_spec_approval: {
        status: 'pending', // pending | refining | approved
        approved_at: null,
        user_feedback: []
      },
      hitl_2_deliverable_approval: {
        status: 'pending', // pending | refining | approved
        approved_at: null,
        user_feedback: []
      }
    },
    intent: {
      business_goal: defaultGoal,
      target_icp: defaultIcp,
      constraints: ['Cero clichés de IA', 'Clean Code y SOLID', 'Estándares SENA de Software']
    },
    spec_evaluation: {
      target_score: 8.5,
      scale_max: 9.0,
      max_cycles: 5,
      current_cycle: 0,
      final_score: null,
      passed: false,
      criticism_history: []
    },
    evaluation: {
      target_score: 8.5,
      scale_max: 9.0,
      max_cycles: 5,
      current_cycle: 0,
      final_score: null,
      criticism_history: []
    },
    execution_steps: [
      { id: 'STEP-01', name: 'Spec-Loop: Evaluador vs Editor (>= 8.5)', status: 'in_progress', depends_on: [] },
      { id: 'STEP-02', name: 'HITL-1: Spec Review & Human Approval', status: 'pending', depends_on: ['STEP-01'] },
      { id: 'STEP-03', name: 'Task-Loop: Evaluador vs Editor (>= 8.5)', status: 'pending', depends_on: ['STEP-02'] },
      { id: 'STEP-04', name: 'HITL-2: Deliverable Review & Human Approval', status: 'pending', depends_on: ['STEP-03'] },
      { id: 'STEP-05', name: 'Canonical Vault Integration', status: 'pending', depends_on: ['STEP-04'] }
    ]
  };

  saveSpec(paths, specJsonData);

  console.log(`✅ Spec inicializado con éxito: ${paths.specId}`);
  console.log(`   📄 Documento Spec: ${paths.specMdPath}`);
  console.log(`   ⚙️ Estado JSON:   ${paths.specJsonPath}`);
  console.log(`   🎯 Destino Final:  Academic Vault/${canonicalVaultFile}`);
  console.log(`   🤖 Subagentes:     ${subagents.join(', ')}`);
  console.log(`\n🔄 INICIANDO BUCLE DEL SPEC (Spec Loop: Revisor vs Editor):`);
  console.log(`   Ejecuta: bash Academic-Engine/scripts/sdd-manager.sh loop-spec ${cleanSlug}`);
  return paths;
}

// -------------------------------------------------------------
// LOOP 1: SPEC EVALUATOR-OPTIMIZER LOOP (REVISOR VS EDITOR)
// -------------------------------------------------------------

function autoRemediateSpec(specText, report = {}, specData = {}) {
  let refined = specText || '';

  // 1. Purge all detected banned phrases
  for (const banned of BANNED_PATTERNS) {
    refined = refined.replace(banned.pattern, '');
  }

  // 2. Clean spaces and awkward punctuation
  refined = refined
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/\.\s*\./g, '.');

  // 3. Ensure Acceptance Criteria section
  if (!/(criterios de aceptaci[oó]n|criterios verificables)/i.test(refined)) {
    refined += `\n\n## 4. Criterios de Aceptación Verificables
- [ ] Implementación fundamentada en estándares Clean Code y principios SOLID.
- [ ] Cobertura de pruebas unitarias verificables con assertions directas.
- [ ] Documentación técnica rigurosa sin muletillas de IA ni lenguaje especulativo.
- [ ] Calificación de auditoría del revisor >= 8.5 / 9.0 en todas las dimensiones.`;
  }

  // 4. Ensure Execution Steps
  if (!/(step-01|step-02)/i.test(refined)) {
    refined += `\n\n## 5. Pasos Atómicos de Ejecución
- **STEP-01:** Optimización del Spec en bucle Revisor-Editor (>= 8.5).
- **STEP-02:** Aprobación humana del requerimiento (Guardrail HITL-1).
- **STEP-03:** Redacción y optimización del entregable en bucle (>= 8.5).
- **STEP-04:** Aprobación humana del entregable final (Guardrail HITL-2).
- **STEP-05:** Integración canónica en Academic Vault.`;
  }

  // 5. Ensure Technical Anchors
  if (!/(python|javascript|typescript|clean code|arquitectura|api|solid)/i.test(refined)) {
    refined += `\n\n## Anclas Técnicas y Estándares Computacionales
- **Lenguaje & Entorno:** JavaScript / Node.js / Python con tipado estricto.
- **Calidad de Código:** Clean Code (Robert C. Martin), separación de responsabilidades y modularidad.
- **Verificación:** Pruebas automatizadas reproducibles e idempotentes.`;
  }

  return refined;
}

function runSpecLoop(slug, maxCycles = 5) {
  const { data, paths } = loadSpec(slug);
  ensureDir(paths.workDir);

  console.log(`\n══════════════════════════════════════════════════════════════════════`);
  console.log(`🔄 BUCLE 1: OPTIMIZACIÓN DEL SPEC (${data.spec_id})`);
  console.log(`   Agentes en Loop: ${data.subagents_involved[0] || 'task-editor'} (Editor) <-> academic-reviewer (Revisor)`);
  console.log(`   Umbral Mandatorio: >= 8.5 / 9.0`);
  console.log(`══════════════════════════════════════════════════════════════════════`);

  let currentSpecMd = fs.existsSync(paths.specMdPath)
    ? fs.readFileSync(paths.specMdPath, 'utf8')
    : '';

  let passed = false;
  let finalReport = null;

  for (let cycle = 1; cycle <= maxCycles; cycle++) {
    data.spec_evaluation.current_cycle = cycle;

    // Save cycle spec snapshot
    const cycleSpecFile = path.join(paths.workDir, `spec_cycle_${cycle}.md`);
    fs.writeFileSync(cycleSpecFile, currentSpecMd, 'utf8');

    // Revisor audits the spec
    const report = auditSpec(currentSpecMd, data);
    report.spec_id = data.spec_id;
    report.cycle = cycle;
    report.timestamp = new Date().toISOString();

    const reportFile = path.join(paths.workDir, `spec_criticism_cycle_${cycle}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');

    data.spec_evaluation.criticism_history.push({
      cycle,
      total_score: report.total_score,
      passed: report.passed,
      timestamp: report.timestamp,
      report_file: path.relative(ROOT_DIR, reportFile)
    });
    data.spec_evaluation.final_score = report.total_score;
    finalReport = report;

    console.log(`\n📋 Ciclo ${cycle}/${maxCycles} (Auditoría del Spec): Nota ${report.total_score}/9.0 (Umbral: 8.5)`);
    console.log(`   • Pertinencia & Requisitos:  ${report.scoring_dimensions["1_requirements_and_pertinence"].score}/2.5`);
    console.log(`   • Rigor Técnico & Criterios: ${report.scoring_dimensions["2_technical_rigor_and_standards"].score}/2.5`);
    console.log(`   • Estructura & Desglose:     ${report.scoring_dimensions["3_clarity_and_structure"].score}/2.0`);
    console.log(`   • Originalidad & Clichés:    ${report.scoring_dimensions["4_lexical_originality_and_anti_drift"].score}/2.0`);

    if (report.passed) {
      passed = true;
      console.log(`\n🎉 ¡SPEC APROBADO POR EL REVISOR! Nota: ${report.total_score}/9.0`);
      fs.writeFileSync(paths.approvedSpecPath, currentSpecMd, 'utf8');
      fs.writeFileSync(paths.specMdPath, currentSpecMd, 'utf8');

      // Update state for HITL-1
      data.status = 'spec_review';
      data.spec_evaluation.passed = true;
      data.execution_steps[0].status = 'completed';
      data.execution_steps[1].status = 'in_progress';
      saveSpec(paths, data);

      console.log(`\n🛑 GUARDRAIL HITL-1 ACTIVADO:`);
      console.log(`   El spec superó la evaluación de pertinencia del revisor (${report.total_score}/9.0).`);
      console.log(`   👉 Para inspeccionar: bash Academic-Engine/scripts/sdd-manager.sh preview ${slug}`);
      console.log(`   👉 Para aprobar:      bash Academic-Engine/scripts/sdd-manager.sh approve-spec ${slug}`);
      console.log(`   👉 Para ajustar:      bash Academic-Engine/scripts/sdd-manager.sh refine-spec ${slug} "<observaciones>"`);
      return { passed: true, cycle, report, data };
    } else {
      console.log(`   ⚠️ Spec no aprobado por el revisor (${report.total_score} < 8.5).`);
      for (const dir of report.remediation_directives) {
        console.log(`      • ${dir}`);
      }

      if (cycle < maxCycles) {
        console.log(`   🛠️ El Agente Editor (task-editor) aplica remediaciones sobre el spec para el ciclo ${cycle + 1}...`);
        currentSpecMd = autoRemediateSpec(currentSpecMd, report, data);
      }
    }
  }

  // If reached maxCycles without passing
  console.log(`\n🛑 LÍMITE DE CICLOS ALCANZADO EN EL SPEC (${maxCycles} ciclos).`);
  data.status = 'spec_frozen_for_arbitration';
  saveSpec(paths, data);
  return { passed: false, cycle: maxCycles, report: finalReport, data };
}

// -------------------------------------------------------------
// HITL-1: REFINE & APPROVE SPECIFICATION
// -------------------------------------------------------------

function refineSpec(slug, userFeedback) {
  if (!userFeedback) {
    console.error('❌ Uso: sdd-orchestrator refine-spec <slug> "<observaciones_del_usuario>"');
    process.exit(1);
  }

  const { data, paths } = loadSpec(slug);
  if (data.status === 'completed') {
    console.log(`ℹ️ El spec "${slug}" ya fue completado previamente.`);
    return data;
  }

  const now = new Date().toISOString();
  data.hitl_checkpoints.hitl_1_spec_approval.user_feedback.push({
    timestamp: now,
    feedback: userFeedback
  });
  data.hitl_checkpoints.hitl_1_spec_approval.status = 'refining';
  data.status = 'spec_optimizing';

  if (fs.existsSync(paths.specMdPath)) {
    let md = fs.readFileSync(paths.specMdPath, 'utf8');
    const adjustmentBlock = `\n\n### 📝 Ajustes Solicitados por el Usuario (${now.split('T')[0]})\n- ${userFeedback}\n`;
    if (md.includes('## 5. Desglose Estructural (Outline)') || md.includes('## 5. Pasos Atómicos de Ejecución')) {
      md = md.replace(/## 5\..+/, `${adjustmentBlock}\n$&`);
    } else {
      md += adjustmentBlock;
    }
    fs.writeFileSync(paths.specMdPath, md, 'utf8');
  }

  saveSpec(paths, data);
  console.log(`✅ Especificación "${data.spec_id}" enriquecida con feedback del usuario.`);
  console.log(`🔄 Reejecutando bucle de optimización del spec...`);
  return runSpecLoop(slug);
}

function approveSpec(slug) {
  const { data, paths } = loadSpec(slug);

  if (data.status === 'completed' || data.status === 'deliverable_review') {
    console.log(`ℹ️ La especificación "${slug}" ya fue aprobada previamente.`);
    return data;
  }

  if (data.hitl_checkpoints.hitl_1_spec_approval.status === 'approved' && data.status === 'spec_approved') {
    console.log(`ℹ️ La especificación "${slug}" ya se encuentra aprobada formalmente.`);
    return data;
  }

  const now = new Date().toISOString();
  data.hitl_checkpoints.hitl_1_spec_approval.status = 'approved';
  data.hitl_checkpoints.hitl_1_spec_approval.approved_at = now;
  data.status = 'spec_approved';

  // Mark STEP-01 and STEP-02 completed, STEP-03 in_progress
  data.execution_steps[0].status = 'completed';
  data.execution_steps[1].status = 'completed';
  data.execution_steps[2].status = 'in_progress';
  saveSpec(paths, data);

  if (fs.existsSync(paths.specMdPath)) {
    let md = fs.readFileSync(paths.specMdPath, 'utf8');
    md = md.replace(/^status:\s*[a-z_]+/m, 'status: spec_approved');
    md = md.replace(/- \[ \] \*\*STEP-01/, '- [x] **STEP-01');
    md = md.replace(/- \[ \] \*\*STEP-02/, '- [x] **STEP-02');
    fs.writeFileSync(paths.specMdPath, md, 'utf8');
  }

  console.log(`🎉 GUARDRAIL HITL-1 SUPERADO: Especificación "${data.spec_id}" aprobada formalmente.`);
  console.log('   La fase de redacción y el bucle de entregable (Task-Loop) quedan formalmente habilitados.');
  console.log(`   👉 Para ejecutar la tarea en loop: bash Academic-Engine/scripts/sdd-manager.sh loop-task ${slug}`);
  return data;
}

// -------------------------------------------------------------
// LOOP 2: TASK EVALUATOR-OPTIMIZER LOOP (DRAFTING PHASE)
// -------------------------------------------------------------

function autoRemediateDraft(text, report = {}, specData = {}) {
  let refined = text || '';

  // 1. Purge all detected banned phrases
  for (const banned of BANNED_PATTERNS) {
    refined = refined.replace(banned.pattern, '');
  }

  // 2. Clean spaces and awkward punctuation
  refined = refined
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/\.\s*\./g, '.');

  // 3. Ensure actionable close / technical conclusion
  if (!/(pr[oó]ximos pasos|conclusi[oó]n t[eé]cnica|ejercicio pr[aá]ctico|implementaci[oó]n)/i.test(refined)) {
    refined += `\n\n### Conclusiones Técnicas y Próximos Pasos
1. Ejecutar las pruebas unitarias automatizadas para validar la cobertura del módulo.
2. Integrar los estándares de Clean Code en el pipeline de integración continua.
3. Consolidar la documentación metodológica en la base de conocimiento canónica.`;
  }

  // 4. Ensure technical grounding if missing
  if (!/(python|javascript|typescript|clean code|solid|arquitectura|api|rest|testing)/i.test(refined)) {
    refined += `\n\n### Fundamentación Técnica y Estándares de Arquitectura
El desarrollo se rige bajo los principios de Clean Code y SOLID, garantizando alta cohesión, bajo acoplamiento y testeabilidad exhaustiva conforme a los lineamientos curriculares del SENA.`;
  }

  // 5. Ensure Target Audience (ICP) reference
  const icp = (specData.intent && specData.intent.target_icp) || 'Aprendices SENA';
  if (icp && !refined.toLowerCase().includes(icp.toLowerCase())) {
    refined += `\n\n### Perfil de Audiencia y Contexto Formativo
Diseñado e implementado para ${icp}, orientando las actividades pedagógicas hacia el dominio de la arquitectura de software profesional y buenas prácticas de ingeniería.`;
  }

  // 6. Ensure word count meets minimum (>= 120 words)
  const wordCount = refined.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 120) {
    const goal = (specData.intent && specData.intent.business_goal) || 'el desarrollo de software';
    refined += `\n\n### Especificaciones Detalladas y Criterios de Calidad
Para cumplir integralmente con el objetivo de ${goal}, la solución aplica una descomposición modular con separación de responsabilidades, validación rigurosa de entradas y un conjunto de pruebas unitarias que verifican el correcto comportamiento del sistema frente a condiciones de borde y excepciones operativas.`;
  }

  return refined;
}

function evaluateDraft(slug, draftContent, cycleOverride = null) {
  const { data, paths } = loadSpec(slug);

  // HITL-1 Enforcement: Drafting/evaluating cannot happen without spec approval
  const isSpecApproved = data.hitl_checkpoints.hitl_1_spec_approval && data.hitl_checkpoints.hitl_1_spec_approval.status === 'approved';
  if (!isSpecApproved) {
    throw new Error(`❌ HITL-1 BLOQUEADO: No se puede redactar ni evaluar el entregable sin aprobación previa del Spec por el usuario.\n   Ejecute: bash Academic-Engine/scripts/sdd-manager.sh approve-spec "${slug}"`);
  }

  data.status = 'draft_optimizing';
  const cycle = cycleOverride !== null ? cycleOverride : data.evaluation.current_cycle + 1;
  data.evaluation.current_cycle = cycle;

  ensureDir(paths.workDir);
  const draftFile = path.join(paths.workDir, `draft_cycle_${cycle}.md`);
  fs.writeFileSync(draftFile, draftContent, 'utf8');

  // Run audit through rubric engine
  const report = auditText(draftContent, data);
  report.spec_id = data.spec_id;
  report.cycle = cycle;
  report.target_file = data.target_file;
  report.timestamp = new Date().toISOString();

  const reportFile = path.join(paths.workDir, `criticism_cycle_${cycle}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');

  data.evaluation.criticism_history.push({
    cycle,
    total_score: report.total_score,
    passed: report.passed,
    timestamp: report.timestamp,
    banned_phrases_count: report.banned_phrases_detected.length,
    report_file: path.relative(ROOT_DIR, reportFile)
  });

  data.evaluation.final_score = report.total_score;

  console.log(`\n🔍 AUDITORÍA DE CICLO ${cycle}/${data.evaluation.max_cycles}: ${data.spec_id}`);
  console.log(`   Puntaje Total:   ${report.total_score} / ${report.scale_max} (Umbral: ${report.passing_threshold})`);
  console.log(`   Pertinencia:     ${report.scoring_dimensions["1_requirements_and_pertinence"].score} / 2.5`);
  console.log(`   Rigor Técnico:   ${report.scoring_dimensions["2_technical_rigor_and_standards"].score} / 2.5`);
  console.log(`   Claridad/Flujo:  ${report.scoring_dimensions["3_clarity_and_structure"].score} / 2.0`);
  console.log(`   Originalidad:    ${report.scoring_dimensions["4_lexical_originality_and_anti_drift"].score} / 2.0`);

  if (report.passed) {
    console.log(`   🎉 ¡APROBADO POR EL REVISOR TÉCNICO! Nota >= ${report.passing_threshold}`);
    fs.writeFileSync(paths.approvedDraftPath, draftContent, 'utf8');

    // TRANSITION TO HITL-2
    data.status = 'deliverable_review';
    data.execution_steps[2].status = 'completed'; // STEP-03 Task-Loop
    data.execution_steps[3].status = 'in_progress'; // STEP-04 HITL-2 Review

    if (fs.existsSync(paths.specMdPath)) {
      let md = fs.readFileSync(paths.specMdPath, 'utf8');
      md = md.replace(/^status:\s*[a-z_]+/m, 'status: deliverable_review');
      md = md.replace(/final_score:\s*.*/m, `final_score: ${report.total_score}`);
      md = md.replace(/- \[ \] \*\*STEP-03/, '- [x] **STEP-03');
      fs.writeFileSync(paths.specMdPath, md, 'utf8');
    }

    saveSpec(paths, data);
    console.log(`\n🛑 GUARDRAIL HITL-2 ACTIVADO:`);
    console.log(`   El entregable superó la auditoría autónoma (${report.total_score}/9.0) y espera tu aprobación humana.`);
    console.log(`   El archivo NO ha sido promovido al vault de producción aún.`);
    console.log(`   👉 Para revisar:  bash Academic-Engine/scripts/sdd-manager.sh review-deliverable ${slug}`);
    console.log(`   👉 Para aprobar:  bash Academic-Engine/scripts/sdd-manager.sh approve-deliverable ${slug}`);
    console.log(`   👉 Para ajustar:  bash Academic-Engine/scripts/sdd-manager.sh refine-deliverable ${slug} "<observaciones>"`);
    return { passed: true, ready_for_hitl_2: true, report, data };
  } else {
    console.log(`   ⚠️ NO APROBADO POR EL REVISOR: Calificación insuficiente (${report.total_score} < ${report.passing_threshold})`);
    if (report.banned_phrases_detected.length > 0) {
      console.log(`   🚫 Clichés detectados: ${report.banned_phrases_detected.map(b => `"${b.phrase}" (${b.count}x)`).join(', ')}`);
    }
    for (const dir of report.remediation_directives) {
      console.log(`      • ${dir}`);
    }

    if (cycle >= data.evaluation.max_cycles) {
      console.log(`\n🛑 LÍMITE DE SEGURIDAD ALCANZADO (${data.evaluation.max_cycles} Ciclos).`);
      data.status = 'frozen_for_arbitration';
      saveSpec(paths, data);
      return { passed: false, frozen: true, report, data };
    } else {
      saveSpec(paths, data);
      return { passed: false, frozen: false, report, data };
    }
  }
}

function runTaskLoop(slug, initialDraftContent = null, maxCycles = 5) {
  const { data, paths } = loadSpec(slug);

  const isSpecApproved = data.hitl_checkpoints.hitl_1_spec_approval && data.hitl_checkpoints.hitl_1_spec_approval.status === 'approved';
  if (!isSpecApproved) {
    throw new Error(`❌ HITL-1 BLOQUEADO: No se puede ejecutar el Task-Loop sin aprobación previa del Spec por el usuario.\n   Ejecute: bash Academic-Engine/scripts/sdd-manager.sh approve-spec "${slug}"`);
  }

  ensureDir(paths.workDir);
  console.log(`\n══════════════════════════════════════════════════════════════════════`);
  console.log(`🔄 BUCLE 2: OPTIMIZACIÓN DE TAREA / ENTREGABLE (${data.spec_id})`);
  console.log(`   Agentes en Loop: task-editor (Editor) <-> academic-reviewer (Revisor)`);
  console.log(`   Umbral Mandatorio: >= 8.5 / 9.0`);
  console.log(`══════════════════════════════════════════════════════════════════════`);

  let currentDraft = initialDraftContent;
  if (!currentDraft) {
    const existingDraft = path.join(paths.workDir, `draft_cycle_${data.evaluation.current_cycle}.md`);
    if (fs.existsSync(existingDraft)) {
      currentDraft = fs.readFileSync(existingDraft, 'utf8');
    } else {
      // Scaffolding draft from spec intent
      currentDraft = `# ${data.title}\n\n## 1. Introducción y Contexto del Requerimiento\n${data.intent.business_goal}\n\n## 2. Desarrollo Técnico y Solución de Software\nImplementación modular fundamentada en Clean Code, buenas prácticas de desarrollo y arquitectura sólida.\n\n## 3. Conclusiones Técnicas y Próximos Pasos\nValidación de requerimientos mediante pruebas y entrega estructurada para el entorno SENA.`;
    }
  }

  for (let cycle = 1; cycle <= maxCycles; cycle++) {
    const result = evaluateDraft(slug, currentDraft, cycle);
    if (result.passed) {
      return result;
    }

    if (cycle < maxCycles) {
      console.log(`   🛠️ El Agente Editor (task-editor) aplica remediaciones al borrador para el ciclo ${cycle + 1}...`);
      currentDraft = autoRemediateDraft(currentDraft, result.report, data);
    } else {
      return result;
    }
  }
}

// -------------------------------------------------------------
// HITL-2: REFINE & APPROVE FINAL DELIVERABLE
// -------------------------------------------------------------

function reviewDeliverable(slug) {
  const { data, paths } = loadSpec(slug);
  let draftToReview = '';

  if (fs.existsSync(paths.approvedDraftPath)) {
    draftToReview = fs.readFileSync(paths.approvedDraftPath, 'utf8');
  } else {
    const draftCycleFile = path.join(paths.workDir, `draft_cycle_${data.evaluation.current_cycle}.md`);
    if (fs.existsSync(draftCycleFile)) {
      draftToReview = fs.readFileSync(draftCycleFile, 'utf8');
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`📄 REVISIÓN DE ENTREGABLE FINAL (HITL-2): ${data.spec_id} - ${data.title}`);
  console.log('═'.repeat(80));
  console.log(`Estado:              ${data.status.toUpperCase()}`);
  console.log(`Destino Propuesto:   Academic Vault/${data.target_file}`);
  console.log(`Calificación Revisor:${data.evaluation.final_score !== null ? `${data.evaluation.final_score}/9.0` : 'N/A'}`);
  console.log(`Ciclos Completados:  ${data.evaluation.current_cycle}`);
  console.log('-'.repeat(80));
  console.log(draftToReview.trim());
  console.log('═'.repeat(80));
  console.log(`\n👉 Para aprobar e integrar: bash Academic-Engine/scripts/sdd-manager.sh approve-deliverable ${slug}`);
  console.log(`👉 Para solicitar cambios:  bash Academic-Engine/scripts/sdd-manager.sh refine-deliverable ${slug} "<observaciones>"\n`);
}

function refineDeliverable(slug, userFeedback) {
  if (!userFeedback) {
    console.error('❌ Uso: sdd-orchestrator refine-deliverable <slug> "<observaciones_del_usuario>"');
    process.exit(1);
  }

  const { data, paths } = loadSpec(slug);

  let baseDraft = '';
  if (fs.existsSync(paths.approvedDraftPath)) {
    baseDraft = fs.readFileSync(paths.approvedDraftPath, 'utf8');
  } else {
    const draftCycleFile = path.join(paths.workDir, `draft_cycle_${data.evaluation.current_cycle}.md`);
    if (fs.existsSync(draftCycleFile)) {
      baseDraft = fs.readFileSync(draftCycleFile, 'utf8');
    } else {
      throw new Error(`No hay borrador previo para refinar en ${slug}`);
    }
  }

  const now = new Date().toISOString();
  data.hitl_checkpoints.hitl_2_deliverable_approval.user_feedback.push({
    timestamp: now,
    feedback: userFeedback
  });
  data.status = 'deliverable_refining';
  saveSpec(paths, data);

  console.log(`🔄 Aplicando ajustes solicitados por el usuario mediante el bucle Creador vs Revisor...`);
  let refinedDraft = baseDraft;
  refinedDraft += `\n\n### Actualización por Revisión de Feedback (${now.split('T')[0]})\n${userFeedback}`;
  refinedDraft = autoRemediateDraft(refinedDraft, { banned_phrases_detected: [] }, data);

  const evalResult = evaluateDraft(slug, refinedDraft, data.evaluation.current_cycle + 1);
  return evalResult;
}

function approveDeliverable(slug) {
  const { data, paths } = loadSpec(slug);

  if (data.status === 'completed') {
    console.log(`ℹ️ El entregable "${slug}" ya fue aprobado e integrado previamente.`);
    return data;
  }

  if (!fs.existsSync(paths.approvedDraftPath) && (data.evaluation.final_score === null || data.evaluation.final_score < 8.5)) {
    throw new Error(`❌ No se puede integrar el entregable: no cuenta con una versión que supere el umbral de calidad >= 8.5 (nota actual: ${data.evaluation.final_score || 0}).`);
  }

  const draftContent = fs.readFileSync(paths.approvedDraftPath, 'utf8');
  const now = new Date().toISOString();

  data.hitl_checkpoints.hitl_2_deliverable_approval.status = 'approved';
  data.hitl_checkpoints.hitl_2_deliverable_approval.approved_at = now;
  data.status = 'completed';

  data.execution_steps[3].status = 'completed'; // STEP-04 HITL-2
  data.execution_steps[4].status = 'completed'; // STEP-05 Vault Integration

  const fullTargetVaultPath = path.join(VAULT_DIR, data.target_file);
  ensureDir(path.dirname(fullTargetVaultPath));

  const finalReport = {
    total_score: data.evaluation.final_score,
    passing_threshold: data.evaluation.target_score
  };
  const finalNoteContent = formatFinalVaultNote(data, draftContent, finalReport);
  fs.writeFileSync(fullTargetVaultPath, finalNoteContent, 'utf8');

  if (fs.existsSync(paths.specMdPath)) {
    let md = fs.readFileSync(paths.specMdPath, 'utf8');
    md = md.replace(/^status:\s*[a-z_]+/m, 'status: completed');
    md = md.replace(/- \[ \] \*\*STEP-04/, '- [x] **STEP-04');
    md = md.replace(/- \[ \] \*\*STEP-05/, '- [x] **STEP-05');
    fs.writeFileSync(paths.specMdPath, md, 'utf8');
  }

  saveSpec(paths, data);
  console.log(`\n🎉 GUARDRAIL HITL-2 SUPERADO: Entregable aprobado formalmente por el usuario.`);
  console.log(`🚀 Promovido e integrado con éxito a: Academic Vault/${data.target_file}`);
  return data;
}

function formatFinalVaultNote(specData, rawDraft, report) {
  const now = new Date().toISOString().split('T')[0];

  return `---
title: "${specData.title}"
spec_id: "${specData.spec_id}"
category: "${specData.target_vault_folder}"
author_agents:
${specData.subagents_involved.map(a => `  - "${a}"`).join('\n')}
reviewer_agent: "academic-reviewer"
quality_score: ${report.total_score}
quality_threshold: ${report.passing_threshold}
hitl_1_approved_at: "${specData.hitl_checkpoints.hitl_1_spec_approval.approved_at}"
hitl_2_approved_at: "${specData.hitl_checkpoints.hitl_2_deliverable_approval.approved_at}"
status: approved
version: "1.0"
created_at: ${now}
updated_at: ${now}
tags:
  - academic
  - sdd-approved
  - hitl-validated
  - deliverable
---

# ${specData.title}

> [!NOTE]
> **Aprobación Integral SDD + HITL:** Validado por el motor Evaluador-Optimizador (**${report.total_score}/9.0**) y con doble aprobación humana (**HITL-1 Spec** y **HITL-2 Deliverable**).
> **Sub-Agentes Autores:** ${specData.subagents_involved.map(a => `\`${a}\``).join(', ')} | **Revisor:** \`academic-reviewer\`

${rawDraft.replace(/^---[\s\S]*?---\s*/, '')}

## 🔄 Historial de Revisiones SDD (Changelog)
- **v1.0 (${now}):** Aprobado por el usuario e integrado en el vault tras ${specData.evaluation.current_cycle} ciclos de optimización con nota de ${report.total_score}/9.0.

## 🔗 Trazabilidad
- Artefacto de Especificación: [[Inbox/Specs/${specData.slug}.spec.md]]
- Contexto Académico SENA: [[Academic-Engine/context/course-profile.md]]
`;
}

// -------------------------------------------------------------
// STATUS & INSPECTION
// -------------------------------------------------------------

function previewSpec(slug) {
  const { data, paths } = loadSpec(slug);
  console.log('\n' + '═'.repeat(75));
  console.log(`📋 ESPECIFICACIÓN: ${data.spec_id} - ${data.title}`);
  console.log('═'.repeat(75));
  console.log(`Estado Global:        ${data.status.toUpperCase()}`);
  console.log(`Destino en Vault:     Academic Vault/${data.target_file}`);
  console.log(`Subagentes Squad:     ${data.subagents_involved.join(', ')}`);
  console.log(`Público (ICP):        ${data.intent.target_icp}`);
  console.log(`Objetivo:             ${data.intent.business_goal}`);
  console.log(`Umbral Aprobación:    >= ${data.evaluation.target_score} / ${data.evaluation.scale_max}`);
  console.log(`Ciclo Actual Tarea:   ${data.evaluation.current_cycle} / ${data.evaluation.max_cycles}`);
  if (data.evaluation.final_score !== null) {
    console.log(`Nota Entregable:      ${data.evaluation.final_score} / ${data.evaluation.scale_max}`);
  }
  if (data.spec_evaluation && data.spec_evaluation.final_score !== null) {
    console.log(`Nota Spec-Loop:       ${data.spec_evaluation.final_score} / ${data.spec_evaluation.scale_max}`);
  }
  console.log('-'.repeat(75));
  console.log('Guardrails Human-In-The-Loop (HITL):');
  const h1Status = data.hitl_checkpoints.hitl_1_spec_approval.status.toUpperCase();
  const h1Icon = h1Status === 'APPROVED' ? '✅' : '🛑';
  console.log(`  ${h1Icon} HITL-1 (Aprobación del Spec):       ${h1Status}`);

  const h2Status = data.hitl_checkpoints.hitl_2_deliverable_approval.status.toUpperCase();
  const h2Icon = h2Status === 'APPROVED' ? '✅' : '🛑';
  console.log(`  ${h2Icon} HITL-2 (Aprobación del Entregable): ${h2Status}`);
  console.log('-'.repeat(75));
  console.log('Pasos de Ejecución Atómica:');
  for (const step of data.execution_steps) {
    const icon = step.status === 'completed' ? '✅' : step.status === 'in_progress' ? '🔄' : '⏳';
    console.log(`  ${icon} [${step.id}] ${step.name.padEnd(45)} (${step.status})`);
  }
  console.log('═'.repeat(75) + '\n');
}

function listSpecs() {
  ensureDir(SPECS_DIR);
  const files = fs.readdirSync(SPECS_DIR).filter(f => f.endsWith('.spec.json'));
  console.log('\n' + '═'.repeat(90));
  console.log('📁 CATÁLOGO DE ESPECIFICACIONES SDD (Academic Vault/Inbox/Specs)');
  console.log('═'.repeat(90));

  if (files.length === 0) {
    console.log('  (No hay especificaciones registradas. Ejecute "sdd-manager init <slug>" para crear una).');
  }

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(SPECS_DIR, file), 'utf8'));
      const statusIcon = data.status === 'completed' ? '✅' : data.status === 'spec_approved' ? '🟢' : data.status === 'deliverable_review' ? '🟡' : '⏳';
      const scoreStr = data.evaluation.final_score !== null ? `${data.evaluation.final_score}/9.0` : 'Pendiente';
      const h1 = data.hitl_checkpoints.hitl_1_spec_approval.status === 'approved' ? 'H1:OK' : 'H1:WAIT';
      const h2 = data.hitl_checkpoints.hitl_2_deliverable_approval.status === 'approved' ? 'H2:OK' : 'H2:WAIT';
      console.log(`${statusIcon} ${data.spec_id.padEnd(25)} | [${h1} ${h2}] | Estado: ${data.status.padEnd(18)} | Nota: ${scoreStr.padEnd(10)} | ${data.title}`);
      console.log(`   └─ Destino: Academic Vault/${data.target_file} | Agentes: ${data.subagents_involved.join(', ')}`);
    } catch (e) {
      // ignore corrupted file
    }
  }
  console.log('═'.repeat(90) + '\n');
}

// -------------------------------------------------------------
// TEST RUNNER WITH SYNTHETIC SPEC & DUAL LOOPS
// -------------------------------------------------------------

function testRun() {
  console.log('🧪 Iniciando prueba sintética completa: Doble Bucle Revisor-Editor con Doble Guardrail HITL...');
  const testSlug = 'test-sdd-synthetic';
  const testPaths = getSpecPaths(testSlug);

  if (fs.existsSync(testPaths.specJsonPath)) fs.unlinkSync(testPaths.specJsonPath);
  if (fs.existsSync(testPaths.specMdPath)) fs.unlinkSync(testPaths.specMdPath);
  if (fs.existsSync(testPaths.workDir)) fs.rmSync(testPaths.workDir, { recursive: true, force: true });

  const targetVaultFile = path.join(VAULT_DIR, 'Drafts', `${testSlug}.md`);
  if (fs.existsSync(targetVaultFile)) fs.unlinkSync(targetVaultFile);

  // 1. Init
  initSpec(
    testSlug,
    'Sintético: Módulo de Autenticación JWT y Principios SOLID',
    'Drafts',
    'task-editor,academic-reviewer',
    'Aprendices del SENA en Programación de Software',
    'Implementar API REST segura con tokens JWT, arquitectura en capas y Clean Code'
  );

  // 2. Run Spec Loop (Revisor <-> Editor)
  const specLoopRes = runSpecLoop(testSlug);
  if (!specLoopRes.passed) {
    throw new Error('FALLO: El bucle de optimización del spec debió alcanzar nota >= 8.5!');
  }
  console.log('✅ Spec Loop completado con éxito (Puntaje >= 8.5/9.0).');

  // 3. Verify evaluation blocked before HITL-1 approval
  let blockedBeforeH1 = false;
  try {
    evaluateDraft(testSlug, 'Texto de prueba antes de aprobar spec');
  } catch (e) {
    blockedBeforeH1 = true;
  }
  if (!blockedBeforeH1) {
    throw new Error('FALLO: Redactar o evaluar sin aprobar el spec (HITL-1) debió ser bloqueado!');
  }
  console.log('✅ Bloqueo HITL-1 comprobado: No se permite evaluar entregable sin aprobar el spec primero.');

  // 4. Approve Spec (HITL-1 cleared)
  approveSpec(testSlug);

  // 5. Flawed draft full of robot clichés (Loop cycle 1)
  const flawedDraft = `
En resumen, en el vertiginoso mundo del desarrollo de software, la arquitectura juega un papel crucial a la vanguardia tecnológica.
Es importante destacar que ofrecemos un cambio de paradigma para aprendices del SENA.
Como hemos visto, el presente documento pretende explicar JWT. Sin duda alguna, esto es clave.
En conclusión, sumergirse en este nuevo modelo es una oportunidad revolucionaria.
  `;
  const round1 = evaluateDraft(testSlug, flawedDraft, 1);
  if (round1.passed) {
    throw new Error('FALLO: El borrador con clichés no debió pasar la auditoría!');
  }
  console.log('✅ El revisor identificó y penalizó los clichés de IA y la falta de anclas técnicas.');

  // 6. Pristine draft (Loop cycle 2 -> passes >= 8.5)
  const pristineDraft = `## Módulo de Autenticación JWT con Clean Code y Principios SOLID

Implementamos un servicio de autenticación RESTful para la gestión de aprendices en el entorno SENA, aplicando inversión de dependencias y responsabilidad única.

### Arquitectura de Tokens JWT
El módulo firma tokens HMAC-SHA256 con tiempo de expiración configurable de 15 minutos, desacoplando la capa de controladores de la persistencia de datos en PostgreSQL mediante el patrón Repositorio.

\`\`\`typescript
interface TokenService {
  generateToken(userId: string, role: string): Promise<string>;
  verifyToken(token: string): Promise<TokenPayload>;
}
\`\`\`

### Criterios de Seguridad y Verificación
- Cifrado de contraseñas mediante Argon2id con salt aleatorio.
- Middleware de autorización basado en roles (RBAC) con cobertura de tests unitarios al 100%.

### Conclusiones Técnicas y Próximos Pasos
1. Ejecutar la suite de pruebas unitarias en Jest: \`npm test -- --coverage\`.
2. Verificar el cumplimiento de la directiva OWASP para almacenamiento seguro de tokens.
3. Desplegar el servicio en el contenedor de evaluación académica.`;

  const round2 = evaluateDraft(testSlug, pristineDraft, 2);
  if (!round2.passed) {
    throw new Error(`FALLO: El borrador de calidad debió superar 8.5 (obtuvo: ${round2.report.total_score})`);
  }

  // 7. Verify HITL-2 guard: file must NOT be in the vault yet!
  if (fs.existsSync(targetVaultFile)) {
    throw new Error('FALLO: El entregable fue promovido al vault antes de la aprobación humana en HITL-2!');
  }
  console.log('✅ Bloqueo HITL-2 comprobado: El archivo NO fue publicado en el vault tras aprobar el revisor.');

  // 8. HITL-2 Refinement with user feedback
  const refinedH2 = refineDeliverable(testSlug, 'Añadir directiva de rotación de refresh tokens en cookies httpOnly');
  if (!refinedH2.passed) {
    throw new Error('FALLO: El texto refinado con feedback debió mantener nota >= 8.5!');
  }

  // 9. HITL-2 Final User Acceptance & Integration
  approveDeliverable(testSlug);

  // 10. Verify final deliverable exists in vault
  if (!fs.existsSync(targetVaultFile)) {
    throw new Error(`FALLO: El archivo final no se encontró en ${targetVaultFile} tras approve-deliverable!`);
  }
  console.log('✅ Archivo final verificado exitosamente en Academic Vault/Drafts/');

  // Cleanup test artifacts
  fs.unlinkSync(targetVaultFile);
  fs.unlinkSync(testPaths.specJsonPath);
  fs.unlinkSync(testPaths.specMdPath);
  fs.rmSync(testPaths.workDir, { recursive: true, force: true });
  console.log('🎉 Prueba sintética completa (Spec-Loop + HITL-1 + Task-Loop + HITL-2) superada al 100% con éxito.');
}

// -------------------------------------------------------------
// CLI DISPATCHER
// -------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  switch (cmd) {
    case 'init':
      initSpec(args[1], args[2], args[3], args[4], args[5], args[6]);
      break;
    case 'preview':
    case 'status':
      previewSpec(args[1]);
      break;
    case 'loop-spec':
    case 'run-spec-loop':
      runSpecLoop(args[1]);
      break;
    case 'approve-spec':
    case 'approve':
      approveSpec(args[1]);
      break;
    case 'refine-spec':
      refineSpec(args[1], args[2]);
      break;
    case 'evaluate': {
      const slug = args[1];
      const filePath = args[2];
      if (!slug || !filePath || !fs.existsSync(filePath)) {
        console.error('Uso: sdd-orchestrator evaluate <slug> <draft-file>');
        process.exit(1);
      }
      const draftText = fs.readFileSync(filePath, 'utf8');
      const res = evaluateDraft(slug, draftText);
      process.exit(res.passed ? 0 : 2);
      break;
    }
    case 'loop-task':
    case 'run-task-loop': {
      const slug = args[1];
      const filePath = args[2];
      const initialText = filePath && fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
      runTaskLoop(slug, initialText);
      break;
    }
    case 'review-deliverable':
      reviewDeliverable(args[1]);
      break;
    case 'refine-deliverable':
      refineDeliverable(args[1], args[2]);
      break;
    case 'approve-deliverable':
    case 'accept':
      approveDeliverable(args[1]);
      break;
    case 'list':
      listSpecs();
      break;
    case 'audit-spec': {
      const filePath = args[1];
      if (!filePath || !fs.existsSync(filePath)) {
        console.error('Uso: sdd-orchestrator audit-spec <spec-file.md>');
        process.exit(1);
      }
      const text = fs.readFileSync(filePath, 'utf8');
      const report = auditSpec(text);
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.passed ? 0 : 1);
      break;
    }
    case 'audit-text': {
      const filePath = args[1];
      if (!filePath || !fs.existsSync(filePath)) {
        console.error('Uso: sdd-orchestrator audit-text <file.md>');
        process.exit(1);
      }
      const text = fs.readFileSync(filePath, 'utf8');
      const report = auditText(text);
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.passed ? 0 : 1);
      break;
    }
    case 'test-run':
      testRun();
      break;
    default:
      console.log(`
Academic-Engine Spec-Driven Development (SDD) con Doble Loop & Doble HITL

Fase 1: Especificación (Spec-Loop & HITL-1)
  init <slug> "<titulo>" "<target-folder>" "<subagents>" "[icp]" "[goal]"
  loop-spec <slug>                    Ejecutar bucle autónomo Revisor <-> Editor para el spec (>= 8.5)
  preview <slug>                      Previsualizar spec y estado de guardrails
  refine-spec <slug> "<feedback>"     Ajustar requerimiento con feedback humano
  approve-spec <slug> (o 'approve')   Aprobar formalmente el spec (Libera redacción)

Fase 2: Ejecución de Tarea (Task-Loop & Evaluador-Optimizador)
  loop-task <slug> [draft.md]         Ejecutar bucle autónomo Revisor <-> Editor para la tarea (>= 8.5)
  evaluate <slug> <draft.md>          Auditar un ciclo individual del entregable
  audit-text <file.md>                Auditar cualquier texto contra rúbrica de 4 dimensiones (0-9)
  audit-spec <spec.md>                Auditar cualquier spec contra rúbrica de 4 dimensiones (0-9)

Fase 3: Entregable Final & HITL-2
  review-deliverable <slug>           Revisar entregable aprobado por el revisor
  refine-deliverable <slug> "<fb>"    Solicitar cambios en el entregable final
  approve-deliverable <slug> ('accept') Aprobar e integrar en Academic Vault

Inspección y Diagnóstico:
  status <slug>
  list
  test-run
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  initSpec,
  previewSpec,
  approveSpec,
  refineSpec,
  auditSpec,
  autoRemediateSpec,
  runSpecLoop,
  evaluateDraft,
  runTaskLoop,
  reviewDeliverable,
  refineDeliverable,
  approveDeliverable,
  auditText,
  autoRemediateDraft,
  listSpecs,
  getSpecPaths,
  loadSpec,
  BANNED_PATTERNS
};
