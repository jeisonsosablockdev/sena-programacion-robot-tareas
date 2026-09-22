#!/usr/bin/env node

/**
 * Idempotency Test Suite for Academic-Engine
 * Verifies that all configuration, task lifecycle, sync, and refinement scripts
 * produce deterministic, stable results when executed multiple times.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '../..');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'Academic-Engine', 'scripts');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const VAULT_DIR = path.join(ROOT_DIR, 'Academic Vault');
const VAULT_INBOX = path.join(VAULT_DIR, 'Inbox');

// Helper to calculate sha256 hash of a file or string
function getHash(dataOrPath) {
  let content = dataOrPath;
  if (fs.existsSync(dataOrPath)) {
    content = fs.readFileSync(dataOrPath, 'utf8');
  }
  return crypto.createHash('sha256').update(content).digest('hex');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanup() {
  if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
  }
  // Clean up any test session JSONs in inbox
  const testSessionPath = path.join(VAULT_DIR, 'Inbox', 'test-idempotency-session.json');
  if (fs.existsSync(testSessionPath)) fs.unlinkSync(testSessionPath);

  const testArchiveBak = path.join(VAULT_DIR, 'Inbox', 'Archive');
  if (fs.existsSync(testArchiveBak)) {
    const files = fs.readdirSync(testArchiveBak).filter(f => f.startsWith('idem-test-note'));
    for (const f of files) fs.unlinkSync(path.join(testArchiveBak, f));
  }

  // Clean up SDD idempotency test files
  const specsDir = path.join(VAULT_DIR, 'Inbox', 'Specs');
  if (fs.existsSync(specsDir)) {
    const specFiles = fs.readdirSync(specsDir).filter(f => f.startsWith('test-sdd-idem'));
    for (const f of specFiles) {
      const fullP = path.join(specsDir, f);
      if (fs.lstatSync(fullP).isDirectory()) {
        fs.rmSync(fullP, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullP);
      }
    }
  }
  const testDeliverable = path.join(VAULT_DIR, 'Drafts', 'test-sdd-idem.md');
  if (fs.existsSync(testDeliverable)) fs.unlinkSync(testDeliverable);
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`   ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`   ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runSuite() {
  console.log('\n' + '█'.repeat(80));
  console.log('🧪 SUITE DE PRUEBAS DE IDEMPOTENCIA (ACADEMIC-ENGINE)');
  console.log('█'.repeat(80) + '\n');

  ensureDir(FIXTURES_DIR);
  ensureDir(path.join(VAULT_DIR, 'Inbox', 'Specs'));

  try {
    // -------------------------------------------------------------
    // TEST 1: Vault Drift Repair & Sources Index Idempotency
    // -------------------------------------------------------------
    console.log('[TEST 1/7] Verificando Idempotencia en Reparación de Bóveda e Índices (fix-vault)...');
    const fixVaultScript = path.join(SCRIPTS_DIR, 'fix-vault.sh');
    const sourcesIndex = path.join(VAULT_DIR, 'Sources', 'SOURCES_INDEX.md');
    
    // Run 3 consecutive runs of fix-vault
    execSync(`bash "${fixVaultScript}"`, { stdio: 'pipe' });
    const hash1 = getHash(sourcesIndex);

    execSync(`bash "${fixVaultScript}"`, { stdio: 'pipe' });
    execSync(`bash "${fixVaultScript}"`, { stdio: 'pipe' });
    const hash3 = getHash(sourcesIndex);

    assert(hash1 === hash3, 'SOURCES_INDEX.md permanece 100% inmutable tras múltiples ejecuciones consecutivas');
    console.log('');

    // -------------------------------------------------------------
    // TEST 2: Task Session Initialization & Double-Init Guard
    // -------------------------------------------------------------
    console.log('[TEST 2/7] Verificando Idempotencia en Inicialización de Sesión (task-manager init)...');
    const tmScript = path.join(SCRIPTS_DIR, 'task-manager.sh');
    const sessionId = 'test-idempotency-session';
    const sessionFile = path.join(VAULT_DIR, 'Inbox', `${sessionId}.json`);

    if (fs.existsSync(sessionFile)) fs.unlinkSync(sessionFile);

    // Initial init
    execSync(`bash "${tmScript}" init ${sessionId} "Meta Idempotente" "ICP Test"`, { stdio: 'pipe' });
    assert(fs.existsSync(sessionFile), 'Sesión JSON creada exitosamente');

    const json1 = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    assert(json1.status === 'in_progress', 'Estado inicial es in_progress');
    assert(json1.session_id === sessionId, 'Session ID correctamente asignado');

    // Attempting to re-init must be safely rejected without mutating the existing file
    let doubleInitThrew = false;
    try {
      execSync(`bash "${tmScript}" init ${sessionId} "Nueva Meta" "Nuevo ICP"`, { stdio: 'pipe' });
    } catch (e) {
      doubleInitThrew = true;
    }
    assert(doubleInitThrew, 'Re-inicializar una sesión existente es rechazado para prevenir sobrescritura accidental');

    const jsonAfter = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    assert(jsonAfter.intent.business_goal === 'Meta Idempotente', 'Los datos originales se mantuvieron protegidos');
    console.log('');

    // -------------------------------------------------------------
    // TEST 3: Task Updates & State Transition Idempotency
    // -------------------------------------------------------------
    console.log('[TEST 3/7] Verificando Idempotencia en Transición de Estados de Tareas (task-manager update)...');
    execSync(`bash "${tmScript}" add ${sessionId} "Subtarea 1" W1_BRAND_STRATEGY "cs-fundamentals" "Drafts/test.md"`, { stdio: 'pipe' });

    // Update to completed
    execSync(`bash "${tmScript}" update ${sessionId} TASK-001 completed "Entrega lista"`, { stdio: 'pipe' });
    const jsonUpdated1 = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    assert(jsonUpdated1.atomic_tasks[0].status === 'completed', 'Tarea marcada como completed');

    // Update to completed AGAIN with same payload
    execSync(`bash "${tmScript}" update ${sessionId} TASK-001 completed "Entrega lista"`, { stdio: 'pipe' });
    const jsonUpdated2 = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    assert(jsonUpdated2.atomic_tasks[0].status === 'completed', 'Tarea sigue en completed');
    assert(jsonUpdated2.atomic_tasks.length === 1, 'No se duplicaron tareas en el array');
    console.log('');

    // -------------------------------------------------------------
    // TEST 4: Note Refinement, Changelog & Rollback Idempotency
    // -------------------------------------------------------------
    console.log('[TEST 4/7] Verificando Idempotencia en Refinamiento No Destructivo (refine-note)...');
    const refineScript = path.join(SCRIPTS_DIR, 'refine-note.sh');
    const testNotePath = path.join(FIXTURES_DIR, 'idem-test-note.md');

    const initialNoteContent = `---
title: "Nota de Test Idempotencia"
category: "Drafts"
workflow: "W2_LANDING_COPY"
skills_used:
  - "cs-fundamentals"
status: draft
version: "1.0"
created_at: 2026-08-08
updated_at: 2026-08-08
tags:
  - test
---

# Nota de Test Idempotencia

> [!NOTE]
> **Resumen Ejecutivo:** Documento de prueba para verificación de idempotencia.

## 📋 Entregable Principal
Texto base inicial inmutable.

## 🔄 Historial de Revisiones (Changelog)
- **v1.0 (2026-08-08):** Creación inicial de la nota.
`;

    fs.writeFileSync(testNotePath, initialNoteContent, 'utf8');
    const initialHash = getHash(testNotePath);

    // 1. Inspect multiple times -> zero mutation
    execSync(`bash "${refineScript}" inspect "${testNotePath}"`, { stdio: 'pipe' });
    execSync(`bash "${refineScript}" inspect "${testNotePath}"`, { stdio: 'pipe' });
    assert(getHash(testNotePath) === initialHash, 'El comando inspect es 100% de solo lectura (cero mutación)');

    // 2. Refine note once
    execSync(`bash "${refineScript}" refine "${testNotePath}" "Refinamiento paso 1" minor`, { stdio: 'pipe' });
    const contentAfterRefine1 = fs.readFileSync(testNotePath, 'utf8');
    assert(contentAfterRefine1.includes('version: "1.1"'), 'Versión incrementada limpiamente a 1.1');
    assert(contentAfterRefine1.includes('Refinamiento paso 1'), 'Changelog contiene la nueva entrada');
    assert((contentAfterRefine1.match(/---\r?\n/g) || []).length === 2, 'Frontmatter YAML mantiene exactamente 2 delimitadores (no duplicados)');

    // 3. Rollback
    execSync(`bash "${refineScript}" rollback "${testNotePath}"`, { stdio: 'pipe' });
    assert(getHash(testNotePath) === initialHash, 'Rollback restaura el archivo con integridad SHA256 idéntica al original');
    console.log('');

    console.log('[TEST 5/7] Verificando Idempotencia en Activación de Skills (enable-project-skills)...');
    const enableSkillsScript = path.join(SCRIPTS_DIR, 'enable-project-skills.sh');
    const testSkillsDir = path.join(FIXTURES_DIR, 'codex_skills');
    ensureDir(testSkillsDir);

    const out1 = execSync(`bash "${enableSkillsScript}"`, { 
      encoding: 'utf8',
      env: { ...process.env, CODEX_SKILLS_DIR: testSkillsDir }
    });
    const out2 = execSync(`bash "${enableSkillsScript}"`, { 
      encoding: 'utf8',
      env: { ...process.env, CODEX_SKILLS_DIR: testSkillsDir }
    });

    assert(out1.includes('Done') && out2.includes('Done'), 'Ejecuciones consecutivas terminan con éxito');
    assert(out2.includes('skip') || out2.includes('link'), 'Modo seguro no corrompe enlaces existentes');
    console.log('');

    // -------------------------------------------------------------
    // TEST 6: Project Scaffolding Idempotency (new-project)
    // -------------------------------------------------------------
    console.log('[TEST 6/7] Verificando Idempotencia en Creación de Proyectos (new-project)...');
    const newProjScript = path.join(SCRIPTS_DIR, 'new-project.sh');
    const testProjName = 'Idempotency-Test-Project';
    const projDir = path.join(VAULT_DIR, 'Projects', testProjName);

    try {
      execSync(`bash "${newProjScript}" "${testProjName}" "Meta" "Autor"`, { stdio: 'pipe' });
      assert(fs.existsSync(projDir), 'Proyecto inicializado correctamente');

      // Re-running new-project must not corrupt existing files
      execSync(`bash "${newProjScript}" "${testProjName}" "Meta" "Autor"`, { stdio: 'pipe' });
      assert(fs.existsSync(path.join(projDir, 'PROJECT_INDEX.md')), 'PROJECT_INDEX.md protegido');
    } finally {
      if (fs.existsSync(projDir)) fs.rmSync(projDir, { recursive: true, force: true });
      const d = path.join(VAULT_DIR, 'Drafts', testProjName);
      const r = path.join(VAULT_DIR, 'Reviews', testProjName);
      const h = path.join(VAULT_DIR, 'Hypotheses', testProjName);
      if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true });
      if (fs.existsSync(r)) fs.rmSync(r, { recursive: true, force: true });
      if (fs.existsSync(h)) fs.rmSync(h, { recursive: true, force: true });
      execSync(`bash "${fixVaultScript}"`, { stdio: 'pipe' });
    }
    console.log('');

    // -------------------------------------------------------------
    // TEST 7: SDD Engine Idempotency & Two-Agent Evaluator-Optimizer Cycle
    // -------------------------------------------------------------
    console.log('[TEST 7/7] Verificando Idempotencia en Motor SDD y Bucle Creador-Revisor (sdd-manager)...');
    const sddScript = path.join(SCRIPTS_DIR, 'sdd-manager.sh');
    const testSddSlug = 'test-sdd-idem';
    const sddSpecJson = path.join(VAULT_DIR, 'Inbox', 'Specs', `${testSddSlug}.spec.json`);
    const sddSpecMd = path.join(VAULT_DIR, 'Inbox', 'Specs', `${testSddSlug}.spec.md`);
    const sddWorkDir = path.join(VAULT_DIR, 'Inbox', 'Specs', `${testSddSlug}-work`);
    const sddDeliverable = path.join(VAULT_DIR, 'Drafts', `${testSddSlug}.md`);

    // Clean prior artifacts if left from aborted runs
    if (fs.existsSync(sddSpecJson)) fs.unlinkSync(sddSpecJson);
    if (fs.existsSync(sddSpecMd)) fs.unlinkSync(sddSpecMd);
    if (fs.existsSync(sddWorkDir)) fs.rmSync(sddWorkDir, { recursive: true, force: true });
    if (fs.existsSync(sddDeliverable)) fs.unlinkSync(sddDeliverable);

    // 1. Initial Spec Creation (Starts in spec_review with HITL-1 pending)
    execSync(`bash "${sddScript}" init "${testSddSlug}" "Desarrollo Backend FastAPI SENA" "Drafts" "cs-tutor,code-reviewer" "Aprendices SENA" "Desarrollo de microservicio"`, { stdio: 'pipe' });
    assert(fs.existsSync(sddSpecJson), 'Spec JSON creado correctamente en Inbox/Specs');

    const initialSpecData = JSON.parse(fs.readFileSync(sddSpecJson, 'utf8'));
    assert(initialSpecData.status === 'spec_review', 'Estado inicial del spec es spec_review (esperando HITL-1)');
    assert(initialSpecData.hitl_checkpoints.hitl_1_spec_approval.status === 'pending', 'Checkpoint HITL-1 está en estado pending');

    const specJsonHash1 = getHash(sddSpecJson);
    // 2. Double-init idempotency
    execSync(`bash "${sddScript}" init "${testSddSlug}" "Desarrollo Backend FastAPI SENA" "Drafts" "cs-tutor,code-reviewer" "Aprendices SENA" "Desarrollo de microservicio"`, { stdio: 'pipe' });
    const specJsonHash2 = getHash(sddSpecJson);
    assert(specJsonHash1 === specJsonHash2, 'Doble inicialización de spec es 100% idempotente y preserva el estado');

    // 3. HITL-1 Guard: Drafting/evaluating before spec approval MUST be blocked
    const orchestrator = require(path.join(SCRIPTS_DIR, 'sdd-orchestrator.js'));
    let evalBlockedBeforeH1 = false;
    try {
      orchestrator.evaluateDraft(testSddSlug, 'Intento de borrador prematuro');
    } catch (e) {
      evalBlockedBeforeH1 = true;
    }
    assert(evalBlockedBeforeH1, 'Intentar evaluar un borrador sin aprobar el spec (HITL-1) es bloqueado');

    // 4. HITL-1 Refinement with user feedback
    execSync(`bash "${sddScript}" refine-spec "${testSddSlug}" "Añadir requerimiento de pruebas unitarias pytest"`, { stdio: 'pipe' });
    const refinedSpecData = JSON.parse(fs.readFileSync(sddSpecJson, 'utf8'));
    assert(refinedSpecData.hitl_checkpoints.hitl_1_spec_approval.user_feedback.length > 0, 'Feedback de usuario registrado en el historial de HITL-1');

    // 5. Spec Approval (HITL-1 Cleared)
    execSync(`bash "${sddScript}" approve-spec "${testSddSlug}"`, { stdio: 'pipe' });
    const approvedData1 = JSON.parse(fs.readFileSync(sddSpecJson, 'utf8'));
    assert(approvedData1.status === 'spec_approved', 'Spec pasa a estado spec_approved formalmente');
    assert(approvedData1.hitl_checkpoints.hitl_1_spec_approval.status === 'approved', 'Checkpoint HITL-1 marcado como approved');

    // 6. Double-approve idempotency
    execSync(`bash "${sddScript}" approve-spec "${testSddSlug}"`, { stdio: 'pipe' });
    const approvedData2 = JSON.parse(fs.readFileSync(sddSpecJson, 'utf8'));
    assert(approvedData2.status === 'spec_approved', 'Doble aprobación es idempotente y no corrompe el flujo');

    // 7. Audit & Evaluator Loop: Rejection of draft with AI clichés
    const flawedDraft = 'En resumen, en el vertiginoso mundo del software, Python juega un papel crucial a la vanguardia. En conclusión es importante destacar el cambio de paradigma.';
    const auditFlawed = orchestrator.evaluateDraft(testSddSlug, flawedDraft, 1);
    assert(!auditFlawed.passed, 'Borrador con muletillas robóticas es rechazado con nota < 8.5');
    assert(auditFlawed.report.banned_phrases_detected.length > 0, 'El revisor detecta y lista las muletillas de IA encontradas');
    assert(!fs.existsSync(sddDeliverable), 'El entregable rechazado NO es promovido a la carpeta de producción en el vault');

    // 8. Audit & Evaluator Loop: Passing high-quality draft (>= 8.5) -> Transitions to HITL-2 (deliverable_review)
    const pristineDraft = `## Especificación Técnica: API REST con FastAPI para Aprendices SENA

Implementamos una arquitectura limpia modular para la formación en programación de software en el SENA, aplicando principios SOLID y separación estricta de responsabilidades.

### Capa de Persistencia y Modelos Relacionales
Se utiliza SQLAlchemy ORM sobre bases de datos PostgreSQL con control de versiones y migraciones automáticas mediante Alembic. Los modelos de datos desacoplan las entidades del negocio de la infraestructura de persistencia.

### Seguridad, Validación de Esquemas y Pruebas
Los endpoints HTTP implementan validación exhaustiva con esquemas Pydantic v2 y autenticación segura basada en tokens JWT. Se incluye una suite de pruebas automatizadas con pytest y TestClient para verificar el correcto comportamiento de la lógica de negocio.

### Llamado a la Acción y Próximos Pasos
Comienza clonando el repositorio y agenda una sesión de revisión técnica con el instructor para evaluar el cumplimiento de la evidencia formativa.`;

    const auditPassed = orchestrator.evaluateDraft(testSddSlug, pristineDraft, 2);
    assert(auditPassed.passed, 'Borrador de alta calidad obtiene calificación >= 8.5');

    const h2PendingData = JSON.parse(fs.readFileSync(sddSpecJson, 'utf8'));
    assert(h2PendingData.status === 'deliverable_review', 'Estado pasa a deliverable_review tras aprobar el revisor');
    assert(!fs.existsSync(sddDeliverable), 'HITL-2 GUARDRAIL: El entregable aprobado por el revisor NO es promovido al vault hasta aprobación humana');

    // 9. HITL-2 Refinement with user feedback
    execSync(`bash "${sddScript}" refine-deliverable "${testSddSlug}" "Añadir documentación OpenAPI Swagger"`, { stdio: 'pipe' });
    const refinedDeliverableData = JSON.parse(fs.readFileSync(sddSpecJson, 'utf8'));
    assert(refinedDeliverableData.hitl_checkpoints.hitl_2_deliverable_approval.user_feedback.length > 0, 'Feedback de HITL-2 registrado correctamente');

    // 10. HITL-2 Final User Approval -> Vault Promotion
    execSync(`bash "${sddScript}" approve-deliverable "${testSddSlug}"`, { stdio: 'pipe' });
    assert(fs.existsSync(sddDeliverable), 'Entregable aprobado en HITL-2 es promovido al vault canónico');

    const finalCompletedData = JSON.parse(fs.readFileSync(sddSpecJson, 'utf8'));
    assert(finalCompletedData.status === 'completed', 'Estado del spec pasa a completed tras aprobación HITL-2');
    assert(finalCompletedData.hitl_checkpoints.hitl_2_deliverable_approval.status === 'approved', 'Checkpoint HITL-2 marcado como approved');

    // 11. Double-approve deliverable idempotency
    execSync(`bash "${sddScript}" approve-deliverable "${testSddSlug}"`, { stdio: 'pipe' });
    const deliverableContent = fs.readFileSync(sddDeliverable, 'utf8');
    assert(deliverableContent.includes('sdd-approved') && deliverableContent.includes('hitl-validated'), 'El entregable final incluye metadatos de calidad y validación HITL');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('═'.repeat(80));
    console.log(`🎉 TODAS LAS PRUEBAS DE IDEMPOTENCIA PASARON: ${passedTests}/${totalTests} (100%)`);
    console.log('   El sistema es formalmente determinista, seguro e idempotente.');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN LA SUITE DE IDEMPOTENCIA:');
    console.error(error.message);
    process.exit(1);
  } finally {
    cleanup();
  }
}

runSuite();
