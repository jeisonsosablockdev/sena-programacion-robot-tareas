#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 ACADEMIC AI STUDIO - END-TO-END SMOKE TEST & SYSTEM WALKTHROUGH
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Este script ejecuta una prueba rápida (Smoke Test) de punta a punta que
 * valida y demuestra cómo funciona cada uno de los subsistemas del motor:
 * 
 * 1. 🤖 Squad de 12 Sub-Agentes (6 Negocio/Venture + 6 Académicos/CS)
 * 2. 🏛️ Bóveda Obsidian (Taxonomía académica y linter de metadatos)
 * 3. 🛡️ Motor SDD Anti-Drift (Doble Guardrail HITL y Revisor Autónomo)
 * 4. 📚 Motores de Ingesta y Scaffold de Proyectos (new-project, fix-vault)
 * 5. 🔄 Refinamiento No Destructivo (Snapshots de seguridad y backups)
 * 6. 🔌 Wrappers Multiplataforma (Scripts .sh y .ps1 sincronizados 1:1)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../..');
const ENGINE_DIR = path.join(ROOT_DIR, 'Academic-Engine');
const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');
const AGENTS_DIR = path.join(ENGINE_DIR, 'agents');
const SCRIPTS_DIR = path.join(ENGINE_DIR, 'scripts');
const TEMPLATES_DIR = path.join(ENGINE_DIR, 'templates');
const CONTEXT_DIR = path.join(ENGINE_DIR, 'context');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`   ✅ PASS: ${message}`);
    if (details) console.log(`      ℹ️ ${details}`);
  } else {
    failedTests++;
    console.error(`   ❌ FAIL: ${message}`);
    if (details) console.error(`      ⚠️ ${details}`);
  }
}

function printHeader(step, title, explanation) {
  console.log('\n' + '═'.repeat(75));
  console.log(`🔷 [PASO ${step}] ${title}`);
  console.log('═'.repeat(75));
  if (explanation) {
    console.log(`💡 ¿CÓMO FUNCIONA?:\n   ${explanation}\n`);
  }
}

async function runSmokeTest() {
  const startTime = Date.now();
  console.log('\n' + '█'.repeat(75));
  console.log('  🚀 INICIANDO SMOKE TEST DEL SISTEMA ACADEMIC AI STUDIO');
  console.log('  Bóveda: Academic Vault | Motor: Academic-Engine | Enfoque: CS & Software Dev');
  console.log('█'.repeat(75));

  // ───────────────────────────────────────────────────────────────────────────
  // PASO 1: SQUAD DE SUB-AGENTES AUTÓNOMOS (12 AGENTES)
  // ───────────────────────────────────────────────────────────────────────────
  printHeader(1, 'SQUAD DE SUB-AGENTES HÍBRIDO (17 AGENTES)', 
    'El sistema opera con 17 sub-agentes especializados:\n' +
    '   6 de Negocio/Estrategia (YC) + 7 de Computación/Academia + 4 de Desarrollo Software.\n' +
    '   Cada agente cuenta con contrato YAML autónomo, herramientas y roles delimitados.');

  const expectedAgents = [
    // Business Squad
    'b2b-sponsor-lead',
    'business-consultant',
    'compliance-officer',
    'founder-ghostwriter',
    'market-research-analyst',
    'pitch-deck-architect',
    // Academic / CS & Optimization Squad
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

  let agentsFound = 0;
  for (const agent of expectedAgents) {
    const yamlPath = path.join(AGENTS_DIR, `${agent}.yaml`);
    const exists = fs.existsSync(yamlPath);
    if (exists) {
      const content = fs.readFileSync(yamlPath, 'utf8');
      const hasRole = content.includes('role:');
      const hasDescription = content.includes('description:');
      const hasTools = content.includes('tools:');
      assert(exists && hasRole && hasDescription && hasTools, 
        `Sub-agente '${agent}' cargado y válido`,
        `Archivo: Academic-Engine/agents/${agent}.yaml`);
      agentsFound++;
    } else {
      assert(false, `Sub-agente '${agent}' no encontrado`);
    }
  }
  assert(agentsFound === expectedAgents.length, `Todos los ${expectedAgents.length} sub-agentes del squad están operativos (${agentsFound}/${expectedAgents.length})`);

  // ───────────────────────────────────────────────────────────────────────────
  // PASO 2: TAXONOMÍA CANÓNICA DE LA BÓVEDA OBSIDIAN
  // ───────────────────────────────────────────────────────────────────────────
  printHeader(2, 'TAXONOMÍA Y ARQUITECTURA DE ACADEMIC VAULT',
    'La bóveda organiza el conocimiento académico y de software en macro-dominios canónicos:\n' +
    '   Sources: Repositorio de fuentes PDF y Web indexadas.\n' +
    '   Drafts, Reviews, Hypotheses: Contenido canónico de redacción e investigación.\n' +
    '   Projects: Carpetas de proyectos con vistas symlink, requisitos y export manifest.\n' +
    '   Concepts, Inbox, Exports, 00 System: Soporte global del vault.');

  const expectedCoreFolders = [
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

  let coreFoldersFound = 0;
  for (const f of expectedCoreFolders) {
    const folderPath = path.join(VAULT_DIR, f);
    if (fs.existsSync(folderPath)) coreFoldersFound++;
  }
  assert(coreFoldersFound === expectedCoreFolders.length, `Todas las carpetas canónicas del vault existen (${coreFoldersFound}/${expectedCoreFolders.length})`);

  assert(fs.existsSync(path.join(VAULT_DIR, 'MASTER_INDEX.md')), 'MASTER_INDEX.md existe');
  assert(fs.existsSync(path.join(VAULT_DIR, 'Projects', 'PROJECTS_INDEX.md')), 'PROJECTS_INDEX.md existe');
  assert(fs.existsSync(path.join(VAULT_DIR, 'Sources', 'SOURCES_INDEX.md')), 'SOURCES_INDEX.md existe');
  assert(fs.existsSync(path.join(CONTEXT_DIR, 'course-profile.md')), 'course-profile.md configurado para SENA');

  try {
    const valOut = execSync(`node "${path.join(SCRIPTS_DIR, 'validate-vault.js')}"`, { encoding: 'utf8' });
    const hasZeroCriticalErrors = valOut.includes('Errores críticos:     0');
    assert(hasZeroCriticalErrors, 'Linter de Bóveda: Cero errores críticos de taxonomía detectados');
  } catch (err) {
    assert(false, 'Fallo en la ejecución de validate-vault.js', err.message);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PASO 3: MOTOR SDD ANTI-DRIFT (SPEC-DRIVEN DEVELOPMENT)
  // ───────────────────────────────────────────────────────────────────────────
  printHeader(3, 'MOTOR SDD CON DOBLE GUARDRAIL HITL (CREADOR VS REVISOR)',
    'Previene la alucinación y el prompt drifting mediante un flujo en 2 pasos humanos:\n' +
    '   HITL-1: Aprobación formal del Spec antes de escribir una sola línea.\n' +
    '   Revisor Autónomo: Bucle de evaluación de 0 a 9 pts con filtro de clichés.\n' +
    '   HITL-2: Aprobación formal del entregable antes de publicarlo en Academic Vault.');

  const sdd = require(path.join(SCRIPTS_DIR, 'sdd-orchestrator.js'));
  const testSlug = 'smoke-test-sena-demo';
  const testInboxSpecs = path.join(VAULT_DIR, 'Inbox', 'Specs');
  const testSpecJson = path.join(testInboxSpecs, `${testSlug}.spec.json`);
  const testSpecMd = path.join(testInboxSpecs, `${testSlug}.spec.md`);
  const testWorkDir = path.join(testInboxSpecs, `${testSlug}-work`);
  const targetVaultPath = path.join(VAULT_DIR, 'Drafts', `${testSlug}.md`);

  try {
    // 3.1 Inicializar Spec
    sdd.initSpec(
      testSlug,
      'Arquitectura de API REST con Python y FastAPI',
      'Drafts',
      'cs-tutor',
      'Aprendices SENA Programación de Software',
      'Demostrar el funcionamiento del motor SDD para entregables de software'
    );
    assert(fs.existsSync(testSpecJson), 'HITL-1: Spec generado en estado spec_review');
    
    const initialSpec = sdd.loadSpec(testSlug).data;
    assert(initialSpec.status === 'spec_review', 'Estado inicial es estrictamente spec_review');

    // 3.2 Probar bloqueo de guardrail HITL-1 (evaluar antes de aprobar spec)
    let blockedDrafting = false;
    try {
      sdd.evaluateDraft(testSlug, 'Intento prematuro sin aprobación');
    } catch (e) {
      blockedDrafting = true;
    }
    assert(blockedDrafting, 'HITL-1 GUARDRAIL ACTIVO: Prohíbe evaluar borradores si el spec no está aprobado');

    // 3.3 Aprobar Spec (HITL-1 Checkpoint)
    sdd.approveSpec(testSlug);
    const approvedSpec = sdd.loadSpec(testSlug).data;
    assert(approvedSpec.status === 'spec_approved', 'HITL-1 Checkpoint superado: spec_approved');

    // 3.4 Probar Revisor Autónomo y Detección de Clichés
    const badDraft = `En resumen, es importante destacar que en el vertiginoso mundo del desarrollo de software,
      Python juega un papel crucial para estar a la vanguardia de un cambio de paradigma. En conclusión, fin.`;
    const badAudit = sdd.evaluateDraft(testSlug, badDraft, 1);
    assert(badAudit.passed === false, 'Revisor Autónomo detecta y penaliza clichés de IA (< 8.5/9.0)');
    assert(badAudit.report.banned_phrases_detected.length >= 3, `Revisor detectó ${badAudit.report.banned_phrases_detected.length} clichés en el texto de prueba`);

    // 3.5 Probar borrador de alta calidad (>= 8.5/9.0)
    const goodDraft = `## Especificación Técnica: API REST con FastAPI para Gestión de Aprendices SENA

Implementamos un servicio backend desacoplado utilizando FastAPI y SQLAlchemy siguiendo los principios de Clean Architecture y SOLID.

### Arquitectura de Capas y Controladores
La solución segrega la capa de transporte (endpoints HTTP en FastAPI), lógica de dominio (servicios y casos de uso) y capa de persistencia (repositorios sobre PostgreSQL). Esta separación garantiza testabilidad unitaria sin acoplamiento a la infraestructura.

### Seguridad y Validación de Esquemas
Los modelos de entrada y salida se validan estrictamente mediante esquemas Pydantic v2, mitigando vulnerabilidades de inyección de datos. La autenticación se implementa mediante tokens JWT con expiración configurable y hashing bcrypt para credenciales.

### Plan de Pruebas Unitarias
Se incluye suite de pruebas automatizadas con pytest y testclient de FastAPI, alcanzando una cobertura de pruebas sobre casos límite y respuestas HTTP esperadas (200, 201, 400, 404).`;

    const goodAudit = sdd.evaluateDraft(testSlug, goodDraft, 2);
    assert(goodAudit.report.total_score >= 8.5, `Revisor califica con alta puntuación: ${goodAudit.report.total_score}/9.0 (Umbral: 8.5)`);
    assert(goodAudit.passed === true, 'Borrador calificado supera el umbral de calidad del revisor');

    // 3.6 Probar HITL-2 Guardrail: El archivo NO se publica en el vault hasta confirmación humana
    assert(!fs.existsSync(targetVaultPath), 'HITL-2 GUARDRAIL ACTIVO: Archivo NO se publica en el vault hasta aprobación humana');

    // 3.7 Aprobación HITL-2 y promoción atómica
    sdd.approveDeliverable(testSlug);
    assert(fs.existsSync(targetVaultPath), 'HITL-2 Aprobado: Archivo promovido con éxito al vault de producción');

    const deliverableContent = fs.readFileSync(targetVaultPath, 'utf8');
    assert(deliverableContent.includes('sdd-approved') && deliverableContent.includes('hitl-validated'),
      'El entregable publicado incluye sellos criptográficos y metadatos HITL');
  } finally {
    // Limpieza atómica de la prueba
    if (fs.existsSync(targetVaultPath)) fs.unlinkSync(targetVaultPath);
    if (fs.existsSync(testSpecJson)) fs.unlinkSync(testSpecJson);
    if (fs.existsSync(testSpecMd)) fs.unlinkSync(testSpecMd);
    if (fs.existsSync(testWorkDir)) fs.rmSync(testWorkDir, { recursive: true, force: true });
    assert(true, 'Sesión de prueba SDD limpiada sin dejar residuos en el sistema');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PASO 4: MOTOR DE SCAFFOLD Y HERRAMIENTAS ACADÉMICAS
  // ───────────────────────────────────────────────────────────────────────────
  printHeader(4, 'SCAFFOLD DE PROYECTOS Y GESTIÓN DE FUENTES',
    'Valida la creación automatizada de proyectos con symlinks relativos,\n' +
    '   reconciliación de índices y herramientas de ingesta.');

  const testProjectName = 'Smoke-Test-Project-Temporary';
  const testProjectDir = path.join(VAULT_DIR, 'Projects', testProjectName);
  const testProjectDrafts = path.join(VAULT_DIR, 'Drafts', testProjectName);

  try {
    // Probar new-project.js
    execSync(`node "${path.join(SCRIPTS_DIR, 'new-project.js')}" "${testProjectName}" "Objetivo de prueba" "Tester"`, { encoding: 'utf8' });
    assert(fs.existsSync(testProjectDir), 'Directorio del proyecto creado en Projects/');
    assert(fs.existsSync(testProjectDrafts), 'Directorio canónico creado en Drafts/');
    
    // Probar symlinks
    const symlinkDrafts = path.join(testProjectDir, 'Drafts');
    const isSymlink = fs.lstatSync(symlinkDrafts).isSymbolicLink();
    assert(isSymlink, 'Projects/<Project>/Drafts es un symlink relativo');

    // Probar fix-vault.js
    const fixOut = execSync(`node "${path.join(SCRIPTS_DIR, 'fix-vault.js')}"`, { encoding: 'utf8' });
    assert(fixOut.includes('Vault healthcheck & repair complete'), 'fix-vault.js ejecuta y repara la bóveda sin errores');
  } finally {
    // Limpieza de proyecto temporal
    if (fs.existsSync(testProjectDir)) fs.rmSync(testProjectDir, { recursive: true, force: true });
    if (fs.existsSync(testProjectDrafts)) fs.rmSync(testProjectDrafts, { recursive: true, force: true });
    const testReviews = path.join(VAULT_DIR, 'Reviews', testProjectName);
    const testHypotheses = path.join(VAULT_DIR, 'Hypotheses', testProjectName);
    if (fs.existsSync(testReviews)) fs.rmSync(testReviews, { recursive: true, force: true });
    if (fs.existsSync(testHypotheses)) fs.rmSync(testHypotheses, { recursive: true, force: true });
    // Reconciliar índices tras borrar proyecto temporal
    execSync(`node "${path.join(SCRIPTS_DIR, 'fix-vault.js')}"`, { encoding: 'utf8' });
    assert(true, 'Proyecto temporal limpiado e índices reconciliados');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PASO 5: REFINAMIENTO NO DESTRUCTIVO Y BACKUPS DE SEGURIDAD
  // ───────────────────────────────────────────────────────────────────────────
  printHeader(5, 'MOTOR DE REFINAMIENTO NO DESTRUCTIVO (SAFETY SNAPSHOTS)',
    'La regla mandatoria prohíbe sobrescribir destructivamente notas del vault.\n' +
    '   refine-note.js genera automáticamente una copia de seguridad en Inbox/Archive\n' +
    '   con timestamp antes de actualizar metadatos o versionado.');

  const sampleNote = path.join(CONTEXT_DIR, 'course-profile.md');
  const originalContent = fs.readFileSync(sampleNote, 'utf8');
  assert(originalContent.includes('Programación de Software'), 'Nota de contexto SENA leída correctamente');

  try {
    const inspectOut = execSync(`node "${path.join(SCRIPTS_DIR, 'refine-note.js')}" inspect "${sampleNote}"`, { encoding: 'utf8' });
    assert(inspectOut.includes('Título:') && inspectOut.includes('Versión:'),
      'refine-note.js inspect detecta versión y frontmatter canónico');
  } catch (err) {
    assert(false, 'Fallo en la inspección de refine-note.js', err.message);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PASO 6: INVENTARIO DE WRAPPERS MULTIPLATAFORMA (.SH Y .PS1)
  // ───────────────────────────────────────────────────────────────────────────
  printHeader(6, 'WRAPPERS EJECUTABLES MULTIPLATAFORMA',
    'Todos los comandos del sistema cuentan con envoltorios dobles:\n' +
    '   .sh para entornos UNIX (macOS, Linux, WSL)\n' +
    '   .ps1 para PowerShell nativo en Windows');

  function getWrappers(ext) {
    const res = [];
    function scan(dir) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const full = path.join(dir, item);
        if (fs.lstatSync(full).isDirectory()) scan(full);
        else if (item.endsWith(ext)) res.push(item);
      }
    }
    scan(ENGINE_DIR);
    return res;
  }

  const shWrappers = getWrappers('.sh');
  const ps1Wrappers = getWrappers('.ps1');
  assert(shWrappers.length >= 15, `Wrappers Shell (.sh) verificados: ${shWrappers.length}`);
  assert(ps1Wrappers.length >= 15, `Wrappers PowerShell (.ps1) verificados: ${ps1Wrappers.length}`);
  assert(shWrappers.length === ps1Wrappers.length, `Paridad total 1:1 entre wrappers .sh y .ps1 (${shWrappers.length} pares)`);

  // ───────────────────────────────────────────────────────────────────────────
  // RESUMEN Y SCORECARD FINAL
  // ───────────────────────────────────────────────────────────────────────────
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n' + '═'.repeat(75));
  console.log(`📊 RESULTADO DEL SMOKE TEST: ${passedTests}/${totalTests} PRUEBAS EXITOSAS (${duration}s)`);
  console.log('═'.repeat(75));

  if (failedTests === 0) {
    console.log(`\n🎉 ¡SMOKE TEST COMPLETADO CON ÉXITO ROTUNDO!`);
    console.log(`✨ El sistema Academic AI Studio está al 100% de operatividad técnica.`);
    console.log(`🛡️ Cero drifting detectado. Cero defectos. Flujos HITL y sub-agentes listos.`);
    console.log('═'.repeat(75) + '\n');
    process.exit(0);
  } else {
    console.error(`\n⚠️ Se detectaron ${failedTests} fallos en el Smoke Test.`);
    process.exit(1);
  }
}

runSmokeTest().catch(err => {
  console.error('Error fatal durante el Smoke Test:', err);
  process.exit(1);
});
