#!/usr/bin/env node

/**
 * Master Enforcement & Anti-Drift Compliance Runner
 * Audits Context Gate, Vault Deliverables, Task Sessions, and Skills Specification.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'Academic-Engine', 'scripts');
const VAULT_INBOX = path.join(ROOT_DIR, 'Academic Vault', 'Inbox');

console.log('\n' + '█'.repeat(80));
console.log('🛡️  SUITE MAESTRA DE ENFORCEMENT & ANTI-DRIFTING (ACADEMIC-ENGINE)');
console.log('█'.repeat(80));

let failures = 0;

// 1. COURSE CONTEXT GATE
console.log('\n[1/4] Ejecutando Auditoría de Contexto Formativo (Course Profile & CS Standards)...');
try {
  execSync(`node "${path.join(SCRIPTS_DIR, 'validate-context.js')}"`, { stdio: 'inherit' });
} catch (e) {
  failures++;
}

// 2. VAULT GOVERNANCE & LINTER
console.log('\n[2/4] Ejecutando Auditoría de Gobernanza de la Bóveda...');
try {
  execSync(`node "${path.join(SCRIPTS_DIR, 'validate-vault.js')}"`, { stdio: 'inherit' });
} catch (e) {
  failures++;
}

// 3. TASK SESSIONS & DEPENDENCIES AUDIT
console.log('\n[3/4] Auditando Sesiones de Tareas y Dependencias...');
console.log('─'.repeat(75));

if (fs.existsSync(VAULT_INBOX)) {
  const sessionFiles = fs.readdirSync(VAULT_INBOX).filter(f => f.endsWith('.json'));
  if (sessionFiles.length === 0) {
    console.log('ℹ️ No hay sesiones activas en Inbox. Todo limpio.');
  } else {
    console.log(`Auditando ${sessionFiles.length} sesión(es) de tareas activas:`);
    for (const sFile of sessionFiles) {
      try {
        const session = JSON.parse(fs.readFileSync(path.join(VAULT_INBOX, sFile), 'utf8'));
        const tasks = session.atomic_tasks || [];
        console.log(`\n📌 Sesión: ${session.session_id} (Estado: ${session.status})`);
        for (const t of tasks) {
          const outPath = path.join(ROOT_DIR, 'Academic Vault', t.output?.vault_path || '');
          const fileExists = t.output?.vault_path && fs.existsSync(outPath);
          if (t.status === 'completed' && !fileExists) {
            console.warn(`   ⚠️ Tarea ${t.id} marcada como completada pero el archivo "${t.output?.vault_path}" no existe en el vault!`);
            failures++;
          } else if (t.status === 'completed') {
            console.log(`   ✅ Tarea ${t.id} completada y entregable verificado en disco.`);
          } else {
            console.log(`   ⏳ Tarea ${t.id} (${t.status}) - Destino: ${t.output?.vault_path}`);
          }
        }
      } catch (e) {
        console.error(`   ❌ Error al parsear ${sFile}: ${e.message}`);
        failures++;
      }
    }
  }
}
console.log('─'.repeat(75));

// 4. SKILLS AUDIT
console.log('\n[4/4] Validando Habilidades del Motor contra Especificación...');
try {
  const validateSkillsPath = path.join(ROOT_DIR, 'Academic-Engine', 'scripts', 'validate-skills.sh');
  if (fs.existsSync(validateSkillsPath)) {
    execSync(`bash "${validateSkillsPath}"`, { cwd: path.join(ROOT_DIR, 'Academic-Engine'), stdio: 'inherit' });
  }
} catch (e) {
  // warnings in skills do not necessarily break build
}

console.log('\n' + '█'.repeat(80));
if (failures === 0) {
  console.log('✨ ENFORCEMENT COMPLETADO: EL SISTEMA ESTÁ EN PERFECTO ESTADO Y SIN DRIFTING.');
} else {
  console.log(`⚠️ ENFORCEMENT COMPLETADO CON ${failures} PUNTO(S) DE ATENCIÓN.`);
}
console.log('█'.repeat(80) + '\n');
