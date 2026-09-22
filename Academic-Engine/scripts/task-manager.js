#!/usr/bin/env node

/**
 * Task Lifecycle Manager CLI for BRIDS Marketing Knowledge
 * Manages full lifecycle: init, list, add, update, show, and close.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const VAULT_INBOX = path.join(ROOT_DIR, 'Academic Vault', 'Inbox');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'Academic-Engine', 'templates', 'task-tracking-template.json');

function ensureInboxDir() {
  if (!fs.existsSync(VAULT_INBOX)) {
    fs.mkdirSync(VAULT_INBOX, { recursive: true });
  }
}

function sanitizeSlug(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
}

function getSessionPath(sessionId) {
  const slug = sanitizeSlug(sessionId);
  return path.join(VAULT_INBOX, `${slug}.json`);
}

function loadSession(sessionId) {
  const filePath = getSessionPath(sessionId);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: No se encontró la sesión "${sessionId}" en ${filePath}`);
    process.exit(1);
  }
  try {
    return { data: JSON.parse(fs.readFileSync(filePath, 'utf8')), path: filePath };
  } catch (err) {
    console.error(`❌ Error al leer el archivo JSON: ${err.message}`);
    process.exit(1);
  }
}

function saveSession(filePath, data) {
  data.updated_at = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// -------------------------------------------------------------
// COMMANDS
// -------------------------------------------------------------

function cmdInit(sessionId, goal, icp, constraints) {
  if (!sessionId) {
    console.error('Uso: task-manager init <session-id> [objetivo] [icp] [restricciones]');
    process.exit(1);
  }
  ensureInboxDir();
  const slug = sanitizeSlug(sessionId);
  const targetPath = getSessionPath(slug);

  if (fs.existsSync(targetPath)) {
    console.error(`⚠️ La sesión "${slug}" ya existe en ${targetPath}`);
    process.exit(1);
  }

  let baseTemplate = {};
  if (fs.existsSync(TEMPLATE_PATH)) {
    baseTemplate = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
  }

  const now = new Date().toISOString();
  const sessionData = {
    ...baseTemplate,
    session_id: slug,
    created_at: now,
    updated_at: now,
    status: 'in_progress',
    intent: {
      raw_prompt: slug,
      business_goal: goal || 'Objetivo comercial por definir',
      target_icp: icp || 'Audiencia objetivo por definir',
      constraints: constraints ? constraints.split(',').map(s => s.trim()) : ['Tono directo', 'Sin clichés'],
      brand_context_verified: true,
    },
    workflows_chained: [],
    atomic_tasks: [],
    metrics_and_measurement: {
      primary_kpi: 'Tasa de conversión / resultado',
      baseline_value: 'N/A',
      target_value: 'A definir',
      tracking_plan_path: '08 Analytics & Measurement/'
    }
  };

  saveSession(targetPath, sessionData);
  console.log(`\n✅ Sesión de tarea inicializada exitosamente:`);
  console.log(`   ID:     ${slug}`);
  console.log(`   Ruta:   ${targetPath}`);
  console.log(`   Meta:   ${sessionData.intent.business_goal}`);
  console.log(`   ICP:    ${sessionData.intent.target_icp}\n`);
}

function cmdList() {
  ensureInboxDir();
  const files = fs.readdirSync(VAULT_INBOX).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('\n📭 No hay sesiones de tareas activas en Inbox.\n');
    return;
  }

  console.log('\n📋 SESIONES DE TAREAS ACTIVAS:');
  console.log('═'.repeat(75));
  console.log(`| ${'ID Sesión'.padEnd(28)} | ${'Estado'.padEnd(12)} | ${'Progreso'.padEnd(10)} | ${'Workflows'.padEnd(12)} |`);
  console.log('─'.repeat(75));

  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(VAULT_INBOX, file), 'utf8'));
      const totalTasks = (content.atomic_tasks || []).length;
      const completedTasks = (content.atomic_tasks || []).filter(t => t.status === 'completed').length;
      const progress = totalTasks > 0 ? `${completedTasks}/${totalTasks} (${Math.round((completedTasks/totalTasks)*100)}%)` : '0 tareas';
      const statusIcon = content.status === 'completed' ? '✅' : content.status === 'in_progress' ? '🔄' : '⏳';
      const statusFormatted = `${statusIcon} ${content.status || 'unknown'}`;
      const wfCount = `${(content.workflows_chained || []).length} WFs`;

      console.log(`| ${(content.session_id || file).padEnd(28)} | ${statusFormatted.padEnd(12)} | ${progress.padEnd(10)} | ${wfCount.padEnd(12)} |`);
    } catch (e) {
      // ignore invalid json
    }
  }
  console.log('═'.repeat(75) + '\n');
}

function cmdAdd(sessionId, title, workflow, skillsStr, outputPath, dependsOnStr) {
  if (!sessionId || !title || !workflow || !outputPath) {
    console.error('Uso: task-manager add <session-id> "<titulo>" <workflow> "<skills>" "<output-path>" [depends-on]');
    console.error('Ejemplo: task-manager add campana-q3 "Redactar Landing Page" W2_LANDING_COPY "mas-copywriting,mas-page-cro" "03 Website & Copy/landing-v1.md" "TASK-001"');
    process.exit(1);
  }

  const { data, path: filePath } = loadSession(sessionId);
  const tasks = data.atomic_tasks || [];
  const nextNum = tasks.length + 1;
  const taskId = `TASK-${String(nextNum).padStart(3, '0')}`;

  const skills = (skillsStr || '').split(',').map(s => s.trim()).filter(Boolean);
  const dependsOn = (dependsOnStr || '').split(',').map(s => s.trim()).filter(Boolean);

  // Validate dependencies
  for (const dep of dependsOn) {
    if (!tasks.some(t => t.id === dep)) {
      console.warn(`⚠️ Advertencia: La dependencia "${dep}" aún no existe en esta sesión.`);
    }
  }

  const newTask = {
    id: taskId,
    title: title.trim(),
    workflow: workflow.toUpperCase().trim(),
    skills: skills,
    status: 'pending',
    depends_on: dependsOn,
    inputs: {
      context_file: 'Academic-Engine/context/product-marketing-context.md',
      reference_task_ids: dependsOn
    },
    output: {
      vault_path: outputPath.trim(),
      format: 'markdown',
      summary: `Entregable para ${title}`
    },
    validation_criteria: [
      `Cumple estándar de ${workflow}`,
      'Revisión y formato verificados'
    ]
  };

  tasks.push(newTask);
  data.atomic_tasks = tasks;

  if (!data.workflows_chained.includes(newTask.workflow)) {
    data.workflows_chained.push(newTask.workflow);
  }

  saveSession(filePath, data);
  console.log(`\n✅ Subtarea agregada a la sesión "${sessionId}":`);
  console.log(`   ID:          ${taskId}`);
  console.log(`   Título:      ${newTask.title}`);
  console.log(`   Workflow:    ${newTask.workflow}`);
  console.log(`   Destino:     ${newTask.output.vault_path}`);
  console.log(`   Depende de:  ${dependsOn.length > 0 ? dependsOn.join(', ') : 'Ninguna (Inicio)'}\n`);
}

function cmdUpdate(sessionId, taskId, newStatus, summary) {
  if (!sessionId || !taskId || !newStatus) {
    console.error('Uso: task-manager update <session-id> <task-id> <pending|in_progress|completed|blocked> [resumen]');
    process.exit(1);
  }

  const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
  const statusLower = newStatus.toLowerCase().trim();
  if (!validStatuses.includes(statusLower)) {
    console.error(`❌ Estado inválido: "${newStatus}". Opciones válidas: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  const { data, path: filePath } = loadSession(sessionId);
  const task = (data.atomic_tasks || []).find(t => t.id === taskId.toUpperCase().trim());

  if (!task) {
    console.error(`❌ No se encontró la subtarea "${taskId}" en la sesión "${sessionId}"`);
    process.exit(1);
  }

  // Check dependencies when completing
  if (statusLower === 'completed' && task.depends_on && task.depends_on.length > 0) {
    const uncompletedDeps = data.atomic_tasks.filter(t => task.depends_on.includes(t.id) && t.status !== 'completed');
    if (uncompletedDeps.length > 0) {
      console.warn(`⚠️ Advertencia: Las dependencias [${uncompletedDeps.map(d => d.id).join(', ')}] no están marcadas como completadas.`);
    }
  }

  task.status = statusLower;
  if (summary) {
    task.output.summary = summary.trim();
  }

  // Auto update session status
  const allCompleted = data.atomic_tasks.every(t => t.status === 'completed');
  if (allCompleted && data.atomic_tasks.length > 0) {
    data.status = 'completed';
  } else if (data.status === 'pending') {
    data.status = 'in_progress';
  }

  saveSession(filePath, data);
  const statusIcon = statusLower === 'completed' ? '✅' : statusLower === 'in_progress' ? '🔄' : statusLower === 'blocked' ? '🚫' : '⏳';
  console.log(`\n${statusIcon} Subtarea "${task.id}" actualizada a estado: ${statusLower.toUpperCase()}`);
  if (summary) console.log(`   Resumen: ${summary}`);
  console.log(`   Sesión general: ${data.status}\n`);
}

function cmdShow(sessionId) {
  if (!sessionId) {
    console.error('Uso: task-manager show <session-id>');
    process.exit(1);
  }

  const { data } = loadSession(sessionId);
  const tasks = data.atomic_tasks || [];
  const completed = tasks.filter(t => t.status === 'completed').length;
  const percent = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  console.log('\n' + '═'.repeat(80));
  console.log(`🎯 SESIÓN: ${data.session_id.toUpperCase()}  [Estado: ${data.status.toUpperCase()}]`);
  console.log('═'.repeat(80));
  console.log(`📌 Objetivo Comercial: ${data.intent?.business_goal || 'N/A'}`);
  console.log(`👥 Perfil ICP:         ${data.intent?.target_icp || 'N/A'}`);
  console.log(`🔗 Workflows Unidos:   ${(data.workflows_chained || []).join(' → ') || 'Ninguno'}`);
  console.log(`📊 Progreso General:   ${completed}/${tasks.length} subtareas (${percent}%)`);
  console.log('─'.repeat(80));

  if (tasks.length === 0) {
    console.log('   (No se han registrado subtareas todavía. Usa "task-manager add" para agregar)');
  } else {
    console.log(`| ${'ID'.padEnd(9)} | ${'Estado'.padEnd(12)} | ${'Workflow'.padEnd(18)} | ${'Título / Destino'.padEnd(31)} |`);
    console.log('─'.repeat(80));
    for (const t of tasks) {
      const icon = t.status === 'completed' ? '✅' : t.status === 'in_progress' ? '🔄' : t.status === 'blocked' ? '🚫' : '⏳';
      const statusText = `${icon} ${t.status}`;
      const titleLine = `${t.title} (${t.output?.vault_path || 'sin ruta'})`;
      console.log(`| ${t.id.padEnd(9)} | ${statusText.padEnd(12)} | ${t.workflow.padEnd(18)} | ${titleLine.substring(0, 31).padEnd(31)} |`);
      if (t.depends_on && t.depends_on.length > 0) {
        console.log(`|           ↳ Depende de: ${t.depends_on.join(', ')}`);
      }
    }
  }
  console.log('═'.repeat(80) + '\n');
}

function cmdClose(sessionId, notes) {
  if (!sessionId) {
    console.error('Uso: task-manager close <session-id> [notas-finales]');
    process.exit(1);
  }

  const { data, path: filePath } = loadSession(sessionId);
  const uncompleted = (data.atomic_tasks || []).filter(t => t.status !== 'completed');

  if (uncompleted.length > 0) {
    console.warn(`⚠️ Atención: Hay ${uncompleted.length} subtareas sin completar: [${uncompleted.map(u => u.id).join(', ')}]`);
  }

  data.status = 'completed';
  if (notes) {
    data.metrics_and_measurement.final_notes = notes;
  }

  saveSession(filePath, data);
  console.log(`\n🎉 Sesión "${sessionId}" marcada como COMPLETADA.`);
  console.log(`   Ruta del JSON: ${filePath}\n`);
}

// -------------------------------------------------------------
// CLI ROUTER
// -------------------------------------------------------------

const [,, command, ...args] = process.argv;

switch (command) {
  case 'init':
    cmdInit(args[0], args[1], args[2], args[3]);
    break;
  case 'list':
  case 'ls':
    cmdList();
    break;
  case 'add':
    cmdAdd(args[0], args[1], args[2], args[3], args[4], args[5]);
    break;
  case 'update':
    cmdUpdate(args[0], args[1], args[2], args[3]);
    break;
  case 'show':
  case 'status':
    cmdShow(args[0]);
    break;
  case 'close':
  case 'finish':
    cmdClose(args[0], args[1]);
    break;
  default:
    console.log(`
Marketing Task Lifecycle Manager (BRIDS)

Comandos disponibles:
  init   <id> [meta] [icp] [restricciones]                      Inicializa una nueva sesión de tarea
  list                                                           Lista todas las sesiones activas en Inbox
  add    <id> <titulo> <workflow> <skills> <path> [depends_on]  Agrega una subtarea atómica
  update <id> <task_id> <status> [resumen]                       Actualiza estado (pending, in_progress, completed, blocked)
  show   <id>                                                    Muestra el dashboard de progreso de la sesión
  close  <id> [notas]                                            Cierra y finaliza la sesión de tarea
`);
    break;
}
