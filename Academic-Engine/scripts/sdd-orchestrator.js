#!/usr/bin/env node

/**
 * Spec-Driven Development (SDD) & Two-Agent Evaluator-Optimizer Engine
 * BRIDS Knowledge Fort
 * 
 * Orchestrates deliverable specifications, atomic step verification,
 * and the Two-Agent (Creator vs Reviewer) quality optimization loop
 * with two strict Human-In-The-Loop (HITL) checkpoints:
 *   HITL-1: Human Spec Approval (Before any drafting begins)
 *   HITL-2: Human Deliverable Approval (Before integration into Academic Vault)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');
const SPECS_DIR = path.join(VAULT_DIR, 'Inbox', 'Specs');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'Academic-Engine', 'templates');
const SPEC_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'deliverable-spec-template.md');
const CRITICISM_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'criticism-report-template.json');

const VALID_SUBAGENTS = [
  // BRIDS Founder & YC Squad
  'business-consultant',
  'market-research-analyst',
  'pitch-deck-architect',
  'compliance-officer',
  'b2b-sponsor-lead',
  'founder-ghostwriter',
  // Academic & CS Squad
  'cs-tutor',
  'code-reviewer',
  'research-librarian',
  'thesis-writer',
  'methodology-consultant',
  'academic-reviewer'
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

function auditText(text, specData = {}) {
  const content = text || '';
  const findings = {
    goal_and_icp: [],
    technical_veracity: [],
    founder_voice: [],
    lexical_originality: []
  };

  // --- Dimension 1: Cumplimiento del Objetivo & ICP (Max 2.5 pts) ---
  let scoreGoal = 2.5;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 100) {
    scoreGoal -= 1.0;
    findings.goal_and_icp.push(`Extensión insuficiente (${wordCount} palabras; mínimo recomendado 100 palabras).`);
  }
  const hasCTA = /(agenda|contacto|demo|invers|descarga|participa|comienza|empieza|hablemos|call to action|cta|sindicaci[oó]n)/i.test(content);
  if (!hasCTA) {
    scoreGoal -= 0.5;
    findings.goal_and_icp.push('Falta un Llamado a la Acción (CTA) directo o próximo paso accionable.');
  }
  if (specData.intent && specData.intent.target_icp) {
    const icpKeywords = specData.intent.target_icp.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matchedIcp = icpKeywords.some(k => content.toLowerCase().includes(k));
    if (!matchedIcp && icpKeywords.length > 0) {
      scoreGoal -= 0.3;
      findings.goal_and_icp.push(`No se encontraron referencias explícitas al perfil ICP (${specData.intent.target_icp}).`);
    }
  }
  scoreGoal = Math.max(0, Math.min(2.5, scoreGoal));

  // --- Dimension 2: Veracidad Técnica & Fuentes (Max 2.5 pts) ---
  let scoreTech = 2.5;
  const technicalGrounding = /(python|javascript|typescript|java|c#|fastapi|flask|django|react|node|sql|api|rest|git|arquitectura|algoritmo|uml|solid|clean code|testing|sena|software|backend|frontend|base de datos|solana|metaplex|delaware|spv|llc|smart contract|on-chain|tokeniz|inmueble|rwa|real estate|stripe identity)/i.test(content);
  if (!technicalGrounding) {
    scoreTech -= 1.0;
    findings.technical_veracity.push('Faltan anclas técnicas verificables (conceptos de software, arquitectura, stack o frameworks).');
  }
  // Check for false speculative promises
  const speculativePromises = /(retorno garantizado 100%|cero riesgo absoluto|duplica tu dinero|sin riesgo legal)/i.test(content);
  if (speculativePromises) {
    scoreTech -= 1.5;
    findings.technical_veracity.push('Alerta regulatoria: contiene promesas especulativas o garantías de retorno irrealistas.');
  }
  // Check for false claims of mainnet deployment (grounded in current-product-status-matrix.md)
  const mainnetFabrication = /(live on solana mainnet-beta|desplegado en mainnet de solana|operando en mainnet|production on solana mainnet)/i.test(content);
  if (mainnetFabrication) {
    scoreTech -= 1.0;
    findings.technical_veracity.push('Alerta de veracidad técnica: El producto opera en devnet / staging con contratos Metaplex Core; no afirmar despliegue en mainnet-beta.');
  }
  scoreTech = Math.max(0, Math.min(2.5, scoreTech));

  // --- Dimension 3: Voz Asertiva & Rigor Técnico (Max 2.0 pts) ---
  let scoreVoice = 2.0;
  const passiveCorporateFillers = /(se podr[ií]a argumentar que|es menester se[ñn]alar|podemos colegir|a modo de introducci[oó]n|el presente documento pretende)/gi;
  const fillerMatches = (content.match(passiveCorporateFillers) || []).length;
  if (fillerMatches > 0) {
    scoreVoice -= fillerMatches * 0.4;
    findings.founder_voice.push(`Se detectó prosa corporativa pasiva/impersonal (${fillerMatches} ocurrencias).`);
  }
  const hasConviction = /(construimos|desarrollamos|implementamos|diseñamos|resolvemos|optimizamos|analizamos|evaluamos|estructuramos|eliminamos|brids|nuestro|directo|desarrollador|inversor|liquidez|demostramos|probamos|presentamos)/i.test(content);
  if (!hasConviction) {
    scoreVoice -= 0.4;
    findings.founder_voice.push('Falta asertividad, precisión técnica o convicción en la resolución del problema.');
  }
  scoreVoice = Math.max(0, Math.min(2.0, scoreVoice));

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
      findings.lexical_originality.push(`Cliché de IA detectado: "${item.phrase}" (${matches.length}x).`);
    }
  }
  scoreLexical = Math.max(0, Math.min(2.0, scoreLexical));

  // --- Total Calculation (Scale 0 to 9.0) ---
  const totalScore = Math.round((scoreGoal + scoreTech + scoreVoice + scoreLexical) * 10) / 10;
  const passed = totalScore >= 8.5;

  const remediationDirectives = [];
  if (detectedBanned.length > 0) {
    remediationDirectives.push(`Eliminar inmediatamente las siguientes muletillas de IA: ${detectedBanned.map(d => `"${d.phrase}"`).join(', ')}.`);
  }
  if (findings.goal_and_icp.length > 0) {
    remediationDirectives.push(...findings.goal_and_icp);
  }
  if (findings.technical_veracity.length > 0) {
    remediationDirectives.push(...findings.technical_veracity);
  }
  if (findings.founder_voice.length > 0) {
    remediationDirectives.push(...findings.founder_voice);
  }

  return {
    total_score: totalScore,
    scale_max: 9.0,
    passing_threshold: 8.5,
    passed,
    scoring_dimensions: {
      "1_goal_and_icp": {
        name: "Cumplimiento del Objetivo & ICP",
        score: scoreGoal,
        max_score: 2.5,
        passed: scoreGoal >= 2.0,
        findings: findings.goal_and_icp
      },
      "2_technical_veracity": {
        name: "Veracidad Técnica & Fuentes",
        score: scoreTech,
        max_score: 2.5,
        passed: scoreTech >= 2.2,
        findings: findings.technical_veracity
      },
      "3_founder_voice": {
        name: "Voz Fundadora vs Tono Robot",
        score: scoreVoice,
        max_score: 2.0,
        passed: scoreVoice >= 1.7,
        findings: findings.founder_voice
      },
      "4_lexical_originality": {
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

// -------------------------------------------------------------
// CORE SDD COMMANDS (WITH DOUBLE HITL GUARDRAILS)
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
  
  const subagents = rawAgents.length > 0 ? rawAgents : ['founder-ghostwriter'];
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

  // Read deliverable spec template or fallback
  let templateContent = '';
  if (fs.existsSync(SPEC_TEMPLATE_PATH)) {
    templateContent = fs.readFileSync(SPEC_TEMPLATE_PATH, 'utf8');
  }

  const primaryAgent = subagents[0] || 'founder-ghostwriter';
  const secondaryAgent = subagents[1] || 'business-consultant';

  const specMd = templateContent
    .replace(/\{\{SLUG\}\}/g, cleanSlug)
    .replace(/\{\{TITLE\}\}/g, title)
    .replace(/\{\{CATEGORY_FOLDER\}\}/g, normalizedTarget)
    .replace(/\{\{FILENAME\}\}/g, cleanSlug)
    .replace(/\{\{PRIMARY_AGENT\}\}/g, primaryAgent)
    .replace(/\{\{SECONDARY_AGENT\}\}/g, secondaryAgent)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{EXECUTIVE_SUMMARY\}\}/g, goal || `Especificación formal para ${title}`)
    .replace(/\{\{BUSINESS_GOAL\}\}/g, goal || `Consolidar ${title} con rigurosidad técnica y tracción medible.`)
    .replace(/\{\{TARGET_ICP\}\}/g, icp || 'Real Estate Sponsors, Institutional LPs, YC Partners')
    .replace(/\{\{PRIMARY_CTA\}\}/g, 'Agendar sesión técnica de estructuración / Revisar Data Room')
    .replace(/\{\{PRIMARY_KPI\}\}/g, 'Tasa de respuesta calificada >= 20%')
    .replace(/\{\{REFERENCE_DOC_1\}\}/g, 'Whitepaper de Tokenización Metaplex Core')
    .replace(/\{\{REFERENCE_DOC_2\}\}/g, 'Estructura Legal Delaware C-Corp vs SPV LLC')
    .replace(/\{\{WORD_COUNT_RANGE\}\}/g, '400 - 800');

  fs.writeFileSync(paths.specMdPath, specMd, 'utf8');

  // Machine-readable JSON state with 2 HITL checkpoints
  const specJsonData = {
    spec_id: paths.specId,
    slug: cleanSlug,
    title,
    target_vault_folder: normalizedTarget,
    target_file: canonicalVaultFile,
    subagents_involved: subagents,
    status: 'spec_review', // HITL-1 Active
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
      business_goal: goal || `Consolidar ${title}`,
      target_icp: icp || 'Real Estate Sponsors & LPs',
      constraints: ['Cero clichés de IA', 'Solana & Metaplex grounding', 'Estilo fundador']
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
      { id: 'STEP-01', name: 'HITL-1 Spec Review & Approval', status: 'in_progress', depends_on: [] },
      { id: 'STEP-02', name: 'Initial Draft Generation', status: 'pending', depends_on: ['STEP-01'] },
      { id: 'STEP-03', name: 'Autonomous Evaluator-Optimizer Loop', status: 'pending', depends_on: ['STEP-02'] },
      { id: 'STEP-04', name: 'HITL-2 Deliverable Review & Approval', status: 'pending', depends_on: ['STEP-03'] },
      { id: 'STEP-05', name: 'Vault Integration', status: 'pending', depends_on: ['STEP-04'] }
    ]
  };

  saveSpec(paths, specJsonData);

  console.log(`✅ Spec inicializado con éxito: ${paths.specId}`);
  console.log(`   📄 Documento Spec: ${paths.specMdPath}`);
  console.log(`   ⚙️ Estado JSON:   ${paths.specJsonPath}`);
  console.log(`   🎯 Destino Final:  Academic Vault/${canonicalVaultFile}`);
  console.log(`   🤖 Subagentes:     ${subagents.join(', ')}`);
  console.log(`\n🛑 GUARDRAIL HITL-1 ACTIVO:`);
  console.log(`   El spec está en espera de tu revisión humana. No se redactará nada hasta su aprobación.`);
  console.log(`   👉 Para aprobar:  bash Academic-Engine/scripts/sdd-manager.sh approve-spec ${cleanSlug}`);
  console.log(`   👉 Para ajustar:  bash Academic-Engine/scripts/sdd-manager.sh refine-spec ${cleanSlug} "<observaciones>"`);
  return paths;
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
  data.status = 'spec_review';

  // Apply feedback into spec markdown document
  if (fs.existsSync(paths.specMdPath)) {
    let md = fs.readFileSync(paths.specMdPath, 'utf8');
    const adjustmentBlock = `\n\n### 📝 Ajustes Solicitados por el Usuario (${now.split('T')[0]})\n- ${userFeedback}\n`;
    if (md.includes('## 5. Desglose Estructural (Outline)')) {
      md = md.replace('## 5. Desglose Estructural (Outline)', `${adjustmentBlock}\n## 5. Desglose Estructural (Outline)`);
    } else {
      md += adjustmentBlock;
    }
    fs.writeFileSync(paths.specMdPath, md, 'utf8');
  }

  saveSpec(paths, data);
  console.log(`✅ Especificación "${data.spec_id}" actualizada con el feedback del usuario.`);
  console.log(`   Estado: SPEC_REVIEW (HITL-1 Pendiente)`);
  console.log(`   👉 Para aprobar: bash Academic-Engine/scripts/sdd-manager.sh approve-spec ${slug}`);
  return data;
}

function approveSpec(slug) {
  const { data, paths } = loadSpec(slug);

  // If already completed or deliverable_review, keep state safe
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

  // Mark STEP-01 completed, STEP-02 in_progress
  data.execution_steps[0].status = 'completed';
  data.execution_steps[1].status = 'in_progress';
  saveSpec(paths, data);

  // Update markdown frontmatter
  if (fs.existsSync(paths.specMdPath)) {
    let md = fs.readFileSync(paths.specMdPath, 'utf8');
    md = md.replace(/^status:\s*[a-z_]+/m, 'status: spec_approved');
    md = md.replace(/- \[ \] \*\*STEP-01/, '- [x] **STEP-01');
    fs.writeFileSync(paths.specMdPath, md, 'utf8');
  }

  console.log(`🎉 GUARDRAIL HITL-1 SUPERADO: Especificación "${data.spec_id}" aprobada formalmente.`);
  console.log('   La fase de redacción y el bucle autónomo Evaluador-Optimizador quedan habilitados.');
  return data;
}

// -------------------------------------------------------------
// TWO-AGENT EVALUATOR-OPTIMIZER LOOP (DRAFTING PHASE)
// -------------------------------------------------------------

function evaluateDraft(slug, draftContent, cycleOverride = null) {
  const { data, paths } = loadSpec(slug);

  // HITL-1 Enforcement: Drafting/evaluating cannot happen without spec approval
  const isSpecApproved = data.hitl_checkpoints.hitl_1_spec_approval && data.hitl_checkpoints.hitl_1_spec_approval.status === 'approved';
  if (!isSpecApproved && data.status === 'spec_review') {
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
  console.log(`   Objetivo & ICP:  ${report.scoring_dimensions["1_goal_and_icp"].score} / 2.5`);
  console.log(`   Técnica/Fuentes: ${report.scoring_dimensions["2_technical_veracity"].score} / 2.5`);
  console.log(`   Voz Fundadora:   ${report.scoring_dimensions["3_founder_voice"].score} / 2.0`);
  console.log(`   Originalidad:    ${report.scoring_dimensions["4_lexical_originality"].score} / 2.0`);

  if (report.passed) {
    console.log(`   🎉 ¡APROBADO POR EL REVISOR TÉCNICO! Nota >= ${report.passing_threshold}`);
    
    // Save latest approved draft in workDir
    fs.writeFileSync(paths.approvedDraftPath, draftContent, 'utf8');

    // TRANSITION TO HITL-2 (Does NOT publish to vault automatically)
    data.status = 'deliverable_review';
    data.execution_steps[1].status = 'completed'; // STEP-02 Draft
    data.execution_steps[2].status = 'completed'; // STEP-03 Loop
    data.execution_steps[3].status = 'in_progress'; // STEP-04 HITL-2 Review

    // Update spec markdown frontmatter
    if (fs.existsSync(paths.specMdPath)) {
      let md = fs.readFileSync(paths.specMdPath, 'utf8');
      md = md.replace(/^status:\s*[a-z_]+/m, 'status: deliverable_review');
      md = md.replace(/final_score:\s*.*/m, `final_score: ${report.total_score}`);
      md = md.replace(/- \[ \] \*\*STEP-02/, '- [x] **STEP-02');
      md = md.replace(/- \[ \] \*\*STEP-03/, '- [x] **STEP-03');
      fs.writeFileSync(paths.specMdPath, md, 'utf8');
    }

    saveSpec(paths, data);
    console.log(`\n🛑 GUARDRAIL HITL-2 ACTIVADO:`);
    console.log(`   El texto superó la auditoría autónoma (${report.total_score}/9.0) y espera tu revisión humana.`);
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
      console.log(`\n🛑 LÍMITE DE SEGURIDAD ALCANZADO (5 Ciclos).`);
      console.log(`   El documento no se promoverá a producción y queda congelado para arbitraje humano.`);
      data.status = 'frozen_for_arbitration';
      saveSpec(paths, data);
      return { passed: false, frozen: true, report, data };
    } else {
      saveSpec(paths, data);
      return { passed: false, frozen: false, report, data };
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

  // Augment draft based on user feedback
  let refinedDraft = baseDraft;
  refinedDraft += `\n\n### Actualización por Revisión de Feedback (${now.split('T')[0]})\n${userFeedback}`;
  refinedDraft = autoRemediateDraft(refinedDraft, { banned_phrases_detected: [] });

  // Re-evaluate with next cycle
  const evalResult = evaluateDraft(slug, refinedDraft, data.evaluation.current_cycle + 1);
  return evalResult;
}

function approveDeliverable(slug) {
  const { data, paths } = loadSpec(slug);

  if (data.status === 'completed') {
    console.log(`ℹ️ El entregable "${slug}" ya fue aprobado e integrado previamente.`);
    return data;
  }

  // Guard: must have passed quality threshold
  if (!fs.existsSync(paths.approvedDraftPath) && (data.evaluation.final_score === null || data.evaluation.final_score < 8.5)) {
    throw new Error(`❌ No se puede integrar el entregable: no cuenta con una versión que supere el umbral de calidad >= 8.5 (nota actual: ${data.evaluation.final_score || 0}).`);
  }

  const draftContent = fs.readFileSync(paths.approvedDraftPath, 'utf8');
  const now = new Date().toISOString();

  // Mark HITL-2 approved
  data.hitl_checkpoints.hitl_2_deliverable_approval.status = 'approved';
  data.hitl_checkpoints.hitl_2_deliverable_approval.approved_at = now;
  data.status = 'completed';

  // Mark STEP-04 and STEP-05 completed
  data.execution_steps[3].status = 'completed'; // STEP-04 HITL-2
  data.execution_steps[4].status = 'completed'; // STEP-05 Vault Integration

  // Promote to Canonical Vault atomically
  const fullTargetVaultPath = path.join(VAULT_DIR, data.target_file);
  ensureDir(path.dirname(fullTargetVaultPath));

  const finalReport = {
    total_score: data.evaluation.final_score,
    passing_threshold: data.evaluation.target_score
  };
  const finalNoteContent = formatFinalVaultNote(data, draftContent, finalReport);
  fs.writeFileSync(fullTargetVaultPath, finalNoteContent, 'utf8');

  // Update spec markdown frontmatter
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
reviewer_agent: "sdd-reviewer"
quality_score: ${report.total_score}
quality_threshold: ${report.passing_threshold}
hitl_1_approved_at: "${specData.hitl_checkpoints.hitl_1_spec_approval.approved_at}"
hitl_2_approved_at: "${specData.hitl_checkpoints.hitl_2_deliverable_approval.approved_at}"
status: approved
version: "1.0"
created_at: ${now}
updated_at: ${now}
tags:
  - brids
  - sdd-approved
  - hitl-validated
  - deliverable
---

# ${specData.title}

> [!NOTE]
> **Aprobación Integral SDD + HITL:** Validado por el motor Evaluador-Optimizador (**${report.total_score}/9.0**) y con doble aprobación humana (**HITL-1 Spec** y **HITL-2 Deliverable**).
> **Sub-Agentes Autores:** ${specData.subagents_involved.map(a => `\`${a}\``).join(', ')} | **Revisor:** \`sdd-reviewer\`

${rawDraft.replace(/^---[\s\S]*?---\s*/, '')}

## 🔄 Historial de Revisiones SDD (Changelog)
- **v1.0 (${now}):** Aprobado por el usuario e integrado en el vault tras ${specData.evaluation.current_cycle} ciclos de optimización con nota de ${report.total_score}/9.0.

## 🔗 Trazabilidad
- Artefacto de Especificación: [[Inbox/Specs/${specData.slug}.spec.md]]
- Contexto de Marca: [[01 Brand Context/product-marketing-context.md]]
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
  console.log(`Objetivo Comercial:   ${data.intent.business_goal}`);
  console.log(`Umbral Aprobación:    >= ${data.evaluation.target_score} / ${data.evaluation.scale_max}`);
  console.log(`Ciclo Actual:         ${data.evaluation.current_cycle} / ${data.evaluation.max_cycles}`);
  if (data.evaluation.final_score !== null) {
    console.log(`Calificación Actual:  ${data.evaluation.final_score} / ${data.evaluation.scale_max}`);
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
    console.log(`  ${icon} [${step.id}] ${step.name.padEnd(38)} (${step.status})`);
  }
  console.log('═'.repeat(75) + '\n');
}

function listSpecs() {
  ensureDir(SPECS_DIR);
  const files = fs.readdirSync(SPECS_DIR).filter(f => f.endsWith('.spec.json'));
  console.log('\n' + '═'.repeat(85));
  console.log('📁 CATÁLOGO DE ESPECIFICACIONES SDD (BRIDS-BRAIN/00 INBOX/SPECS)');
  console.log('═'.repeat(85));

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
  console.log('═'.repeat(85) + '\n');
}

function autoRemediateDraft(text, report = {}) {
  let refined = text;

  // 1. Purge all detected banned phrases
  for (const banned of BANNED_PATTERNS) {
    refined = refined.replace(banned.pattern, '');
  }

  // 2. Clean up double spaces or awkward leftover punctuation
  refined = refined
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/\.\s*\./g, '.');

  // 3. Ensure CTA and tech grounding if flagged
  if (!/(agenda|demo|contacto|sindicaci[oó]n|hablemos)/i.test(refined)) {
    refined += '\n\n### Próximos Pasos\nAgenda una sesión técnica con el equipo de estructuración en `sponsors@brids.io` para evaluar la viabilidad de tu inmueble.';
  }

  if (!/(solana|metaplex)/i.test(refined)) {
    refined += '\n\n**Infraestructura:** Respaldado sobre Solana con estándar Metaplex Core y plugins de Freeze/Recovery regulatorio.';
  }

  return refined;
}

// -------------------------------------------------------------
// TEST RUNNER WITH SYNTHETIC SPEC & 2 HITL GATES
// -------------------------------------------------------------

function testRun() {
  console.log('🧪 Iniciando prueba sintética del ciclo SDD con Doble Guardrail HITL...');
  const testSlug = 'test-sdd-synthetic';
  const testPaths = getSpecPaths(testSlug);

  // Clean up previous test artifacts if any
  if (fs.existsSync(testPaths.specJsonPath)) fs.unlinkSync(testPaths.specJsonPath);
  if (fs.existsSync(testPaths.specMdPath)) fs.unlinkSync(testPaths.specMdPath);
  if (fs.existsSync(testPaths.workDir)) fs.rmSync(testPaths.workDir, { recursive: true, force: true });

  const targetVaultFile = path.join(VAULT_DIR, 'Drafts', `${testSlug}.md`);
  if (fs.existsSync(targetVaultFile)) fs.unlinkSync(targetVaultFile);

  // 1. Init (Status: spec_review)
  initSpec(
    testSlug,
    'Sintético: Tokenización de Activos Inmobiliarios en Solana',
    'Drafts',
    'cs-tutor,academic-reviewer',
    'Estudiantes de Ingeniería de Software',
    'Demostrar implementación de arquitectura limpia y contratos inteligentes'
  );

  // 2. HITL-1 Refine spec with user feedback
  refineSpec(testSlug, 'Hacer énfasis en auditoría Delaware LLC y Stripe Identity KYC');

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
  console.log('✅ Bloqueo HITL-1 comprobado: No se permite evaluar sin aprobar el spec primero.');

  // 4. Approve Spec (HITL-1 cleared)
  approveSpec(testSlug);

  // 5. Flawed draft full of robot clichés (Loop cycle 1)
  const flawedDraft = `
En resumen, en el vertiginoso mundo de la tokenización inmobiliaria, BRIDS juega un papel crucial a la vanguardia tecnológica.
Es importante destacar que ofrecemos un cambio de paradigma para desarrolladores.
Como hemos visto, la infraestructura permite digitalizar inmuebles. Sin duda alguna, esto democratiza el capital.
En conclusión, sumergirse en este nuevo modelo es una oportunidad revolucionaria.
  `;
  const round1 = evaluateDraft(testSlug, flawedDraft, 1);
  if (round1.passed) {
    throw new Error('FALLO: El borrador con clichés no debió pasar la auditoría!');
  }
  console.log('✅ El revisor identificó y penalizó los clichés robóticos.');

  // 6. Pristine draft (Loop cycle 2 -> passes >= 8.5)
  const pristineDraft = `## Sindicación Inmobiliaria en Solana con BRIDS

Eliminamos la intermediación arcaica en sindicaciones inmobiliarias mediante contratos inteligentes auditables on-chain sobre Solana y el estándar Metaplex Core con plugins de Freeze y Recovery.

### Desacoplamiento Legal Delaware SPV
Cada activo inmobiliario se estructura a través de una LLC independiente en Delaware (SPV) que retiene la propiedad legal y emite las participaciones tokenizadas. BRIDS actúa como proveedor tecnológico de infraestructura SaaS sin custodia de fondos.

### Acreditación y Cumplimiento Regulatorio
Los participantes se verifican mediante Stripe Identity para cumplir estrictamente con normativas KYC/AML. Nuestra solución está diseñada a la medida para Real Estate Sponsors que buscan reducir hasta un 80% sus costos de estructuración y acelerar el cierre de rondas de inversión.

### Llamado a la Acción
Agenda una sesión técnica con el equipo de estructuración en sponsors@brids.io para analizar tu cartera de activos.`;

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
  const refinedH2 = refineDeliverable(testSlug, 'Añadir canal prioritario de WhatsApp para sponsors de Miami');
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
  console.log('🎉 Prueba sintética con doble HITL completada al 100% con éxito.');
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
Spec-Driven Development (SDD) Engine con Doble Guardrail HITL - BRIDS.io

Fase 1 (Especificación & HITL-1):
  init <slug> "<titulo>" "<target-folder>" "<subagents>" "[icp]" "[goal]"
  preview <slug>
  refine-spec <slug> "<observaciones>"
  approve-spec <slug>  (o 'approve')

Fase 2 (Redacción & Bucle Evaluador-Optimizador):
  evaluate <slug> <draft-file>
  audit-text <file.md>

Fase 3 (Entregable Final & HITL-2):
  review-deliverable <slug>
  refine-deliverable <slug> "<observaciones>"
  approve-deliverable <slug> (o 'accept')

Inspección y Pruebas:
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
  evaluateDraft,
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
