#!/usr/bin/env node

/**
 * Academic-Engine Unified CLI
 * Single, type-safe entrypoint for task lifecycle, SDD double-loop, and vault synchronization.
 * 
 * Usage:
 *   node --experimental-strip-types Academic-Engine/bin/engine.ts <command> [args]
 * 
 * @spec SPEC-005
 */

import fs from 'node:fs';
import path from 'node:path';
import { TaskOrchestrator } from '../core/orchestrator.ts';
import { VaultGateway } from '../core/vault-gateway.ts';

const args = process.argv.slice(2);
const command = args[0] || 'help';

const orchestrator = new TaskOrchestrator();
const vault = orchestrator.getVault();

function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║               🏛️  ACADEMIC-ENGINE CLI RUNNER  v2.0                ║
║           Harness Modular para Desarrollo de Software y SENA      ║
╚═══════════════════════════════════════════════════════════════════╝

Comandos de Tareas y Ciclo de Vida:
  task init <slug> [titulo] [carpeta] [subagentes] [icp] [meta]
      Inicializa un nuevo entregable y genera su especificación formal.
      
  task approve-spec <slug>
      [HITL-1] Aprueba formalmente el Spec para desbloquear la redacción.
      
  task evaluate <slug> <archivo-borrador|texto> [observaciones]
      Evalúa el borrador con la rúbrica 4D (filtro anti-clichés + calidad >= 8.5).
      
  task approve-deliverable <slug>
      [HITL-2] Aprueba el entregable final y lo publica en Academic Vault.
      
  task status <slug>
      Muestra el estado actual, ciclo y puntajes de una tarea.
      
  task list
      Lista todas las especificaciones activas y su estado en el Vault.

Comandos de Mantenimiento:
  skills validate
      Ejecuta la validación de conformidad con Agent Skills Specification.
      
  help
      Muestra esta ayuda.
`);
}

function handleTaskInit(taskArgs: string[]) {
  const slug = taskArgs[0];
  if (!slug) {
    console.error('❌ Error: Falta el slug de la tarea. Ejemplo: engine task init evidencia-poo-1');
    process.exit(1);
  }

  const title = taskArgs[1] || slug;
  const targetFolder = taskArgs[2] || 'Drafts';
  const subagentsRaw = taskArgs[3] || 'cs-tutor,code-reviewer';
  const subagents = subagentsRaw.split(',').map(s => s.trim()).filter(Boolean);
  const icp = taskArgs[4] || 'Aprendices SENA Programación de Software';
  const goal = taskArgs[5] || title;

  const context = orchestrator.initSpec(slug, title, targetFolder, subagents, icp, goal);
  console.log(`\n✅ Spec inicializado con éxito:`);
  console.log(`   - Slug:         ${context.slug}`);
  console.log(`   - Título:       ${context.title}`);
  console.log(`   - Estado:       ${context.state} (En espera de aprobación HITL-1)`);
  console.log(`   - Ubicación:    Academic Vault/Inbox/Specs/${context.slug}.spec.md\n`);
}

function handleApproveSpec(taskArgs: string[]) {
  const slug = taskArgs[0];
  if (!slug) {
    console.error('❌ Error: Especifica el slug a aprobar. Ejemplo: engine task approve-spec mi-tarea');
    process.exit(1);
  }

  const res = orchestrator.approveSpec(slug);
  if (!res.success) {
    console.error(`❌ Fallo en la aprobación HITL-1: ${res.error}`);
    process.exit(1);
  }

  console.log(`\n🎉 [HITL-1 APROBADO] Spec aprobado formalmente.`);
  console.log(`   - Estado: ${res.context.state}`);
  console.log(`   - Siguiente paso: Iniciar redacción con el bucle de optimización (task evaluate).\n`);
}

function handleEvaluateDraft(taskArgs: string[]) {
  const slug = taskArgs[0];
  const draftPathOrContent = taskArgs[1];
  const observationsRaw = taskArgs[2] || '';

  if (!slug || !draftPathOrContent) {
    console.error('❌ Error: Uso: engine task evaluate <slug> <archivo-borrador|texto>');
    process.exit(1);
  }

  let draftText = draftPathOrContent;
  if (fs.existsSync(draftPathOrContent)) {
    draftText = fs.readFileSync(draftPathOrContent, 'utf8');
  }

  // Dimensiones por defecto de rigor técnico (pueden ser suministradas o calibradas)
  const defaultDimensions = {
    pertinence: 2.3,
    scientificRigor: 2.3,
    clarityStructure: 1.8,
    originalityLexicon: 1.8
  };

  const observations = observationsRaw ? [observationsRaw] : [];
  const result = orchestrator.evaluateDraft(slug, draftText, defaultDimensions, observations);

  console.log(`\n📊 Reporte de Auditoría 4D - SDD:`);
  console.log(`   - Puntaje Total:     ${result.report.score} / 9.0 (Umbral: ${result.report.threshold})`);
  console.log(`   - Penalización IA:   -${result.report.clichesPenalty} pts`);
  console.log(`   - Estado de Calidad: ${result.report.passed ? '✅ APROBADO (Listo para HITL-2)' : '⚠️ RECHAZADO (Requiere optimización)'}`);
  console.log(`   - Estado de Tarea:   ${result.transition.context.state}`);
  console.log(`   - Ciclo Actual:      ${result.transition.context.currentCycle} / ${result.transition.context.maxCycles}\n`);
}

function handleApproveDeliverable(taskArgs: string[]) {
  const slug = taskArgs[0];
  if (!slug) {
    console.error('❌ Error: Especifica el slug a aprobar. Ejemplo: engine task approve-deliverable mi-tarea');
    process.exit(1);
  }

  const res = orchestrator.approveDeliverable(slug);
  if (!res.success) {
    console.error(`❌ Fallo en la aprobación HITL-2: ${res.error}`);
    process.exit(1);
  }

  console.log(`\n🏆 [HITL-2 APROBADO] Entregable validado y publicado formalmente.`);
  console.log(`   - Destino en Vault: ${res.deliverablePath}`);
  console.log(`   - Estado de Tarea:  completed\n`);
}

function handleTaskList() {
  const specs = vault.listSpecs();
  console.log(`\n📋 Especificaciones Activas en Academic Vault (${specs.length}):`);
  console.log('─'.repeat(70));
  if (specs.length === 0) {
    console.log('   (No hay especificaciones registradas en Inbox/Specs)');
  } else {
    for (const spec of specs) {
      console.log(`   • [${spec.status.padEnd(18)}] ${spec.slug.padEnd(25)} : ${spec.title}`);
    }
  }
  console.log('─'.repeat(70) + '\n');
}

function handleTaskStatus(taskArgs: string[]) {
  const slug = taskArgs[0];
  if (!slug) {
    console.error('❌ Error: Especifica el slug. Ejemplo: engine task status mi-tarea');
    process.exit(1);
  }

  if (!vault.specExists(slug)) {
    console.error(`❌ No existe el spec '${slug}' en Academic Vault`);
    process.exit(1);
  }

  const loaded = vault.loadSpec(slug);
  console.log(`\n🔍 Estado de Tarea: ${loaded.data.slug}`);
  console.log(`   - Título:     ${loaded.data.title}`);
  console.log(`   - Estado:     ${loaded.data.status}`);
  console.log(`   - Ciclo:      ${loaded.data.iteration || 0}`);
  console.log(`   - Carpeta:    ${loaded.data.target_folder}`);
  console.log(`   - Subagentes: ${(loaded.data.subagents || []).join(', ')}`);
  console.log(`   - Evaluaciones registradas: ${(loaded.data.evaluations || []).length}\n`);
}

// Router principal
switch (command) {
  case 'task': {
    const subCommand = args[1];
    const taskArgs = args.slice(2);
    switch (subCommand) {
      case 'init':
        handleTaskInit(taskArgs);
        break;
      case 'approve-spec':
        handleApproveSpec(taskArgs);
        break;
      case 'evaluate':
        handleEvaluateDraft(taskArgs);
        break;
      case 'approve-deliverable':
        handleApproveDeliverable(taskArgs);
        break;
      case 'list':
        handleTaskList();
        break;
      case 'status':
        handleTaskStatus(taskArgs);
        break;
      default:
        console.error(`Comando desconocido: task ${subCommand}`);
        printHelp();
        process.exit(1);
    }
    break;
  }
  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;
  default:
    console.error(`Comando no reconocido: ${command}`);
    printHelp();
    process.exit(1);
}
