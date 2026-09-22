#!/usr/bin/env node

/**
 * Task Init CLI (Atomic & Idempotent Task Lifecycle & SDD Engine)
 * BRIDS Knowledge Fort
 * 
 * Guarantees atomic, idempotent task initialization with Spec-Driven
 * Development (SDD) and Double Human-In-The-Loop (HITL) guardrails.
 */

const fs = require('fs');
const path = require('path');
const sdd = require('./sdd-orchestrator.js');

const KNOWN_COMMANDS = [
  'init',
  'preview',
  'approve',
  'approve-spec',
  'refine-spec',
  'loop-spec',
  'run-spec-loop',
  'evaluate',
  'loop-task',
  'run-task-loop',
  'review-deliverable',
  'refine-deliverable',
  'approve-deliverable',
  'accept',
  'status',
  'list',
  'audit-text',
  'audit-spec',
  'auto-loop',
  'test-run'
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

function toTitleCase(slug) {
  return (slug || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function isVaultFolder(str) {
  if (!str) return false;
  const normalized = str.replace(/^\/+|\/+$/g, '');
  return VALID_VAULT_PREFIXES.some(prefix => 
    normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║              task-init.sh - Motor Atómico e Idempotente SDD                  ║
║                  ACADEMIC AI STUDIO - SENA & CS (DUAL-LOOP)                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

Uso Rápido:
  bash Academic-Engine/scripts/task-init.sh <slug> [titulo] [target-folder] [subagents] [icp] [goal]
  bash Academic-Engine/scripts/task-init.sh <slug> "[objetivo]" "[icp]"

Comandos de Bucles Autónomos y Gestión de Ciclo de Vida:
  loop-spec <slug>                   Bucle autónomo Revisor <-> Editor para el spec (>= 8.5)
  preview <slug>                     Inspeccionar objeto canónico del spec (HITL-1)
  refine-spec <slug> "<feedback>"    Ajustar especificación con observaciones
  approve-spec <slug>                Aprobar spec formalmente (Libera redacción)
  
  loop-task <slug> [draft.md]        Bucle autónomo Revisor <-> Editor para la tarea (>= 8.5)
  evaluate <slug> <draft.md>         Auditar ciclo individual en bucle de 2 agentes (>= 8.5)
  review-deliverable <slug>          Revisar entregable pulido (HITL-2)
  refine-deliverable <slug> "<fb>"   Solicitar cambios en el entregable
  approve-deliverable <slug>         Aceptar entregable e integrar en el Vault
  
  status <slug>                      Consultar estado y checkpoints HITL
  list                               Ver catálogo de tareas y specs activos
    `);
    process.exit(0);
  }

  const firstArg = args[0];

  // If first argument is a known command, pass it directly to SDD orchestrator CLI
  if (KNOWN_COMMANDS.includes(firstArg)) {
    // Re-invoke sdd-orchestrator directly
    const sddScript = path.join(__dirname, 'sdd-orchestrator.js');
    require('child_process').fork(sddScript, args, { stdio: 'inherit' });
    return;
  }

  // Otherwise, firstArg is the task slug to initialize idempotently!
  const slug = firstArg;
  const arg1 = args[1] || '';
  const arg2 = args[2] || '';
  const arg3 = args[3] || '';
  const arg4 = args[4] || '';
  const arg5 = args[5] || '';

  let title = '';
  let targetFolder = 'Inbox';
  let subagents = 'cs-tutor,academic-reviewer';
  let icp = 'Aprendices e Instructores SENA, Desarrolladores de Software';
  let goal = '';

  if (isVaultFolder(arg2)) {
    // Format: task-init.sh <slug> <title> <targetFolder> [subagents] [icp] [goal]
    title = arg1 || toTitleCase(slug);
    targetFolder = arg2;
    if (arg3) subagents = arg3;
    if (arg4) icp = arg4;
    goal = arg5 || `Consolidar ${title} con rigor técnico y tracción medible.`;
  } else if (arg1) {
    // Format: task-init.sh <slug> "[objetivo/meta]" "[icp]"
    title = toTitleCase(slug);
    goal = arg1;
    if (arg2) icp = arg2;
    if (isVaultFolder(arg3)) targetFolder = arg3;
    else targetFolder = 'Drafts';
  } else {
    // Minimal format: task-init.sh <slug>
    title = toTitleCase(slug);
    goal = `Especificación formal para ${title}`;
  }

  console.log(`\n🚀 INICIALIZACIÓN ATÓMICA DE TAREA: "${slug}"`);
  console.log(`   Garantía de idempotencia: Si la tarea ya existe, se preserva el estado sin sobrescribir.\n`);

  sdd.initSpec(slug, title, targetFolder, subagents, icp, goal);
}

if (require.main === module) {
  main();
}
