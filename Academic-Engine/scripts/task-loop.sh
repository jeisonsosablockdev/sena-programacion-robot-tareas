#!/usr/bin/env bash
set -euo pipefail

# task-loop.sh - Ejecutor Universal de Bucle Autónomo Revisor <-> Editor (>= 8.5/9.0)
# Academic AI Studio - SENA & Computer Science

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ $# -lt 1 ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════════════╗"
  echo "║         task-loop.sh - Bucle Autónomo Revisor <-> Editor             ║"
  echo "║           Auditoría de Pertinencia & Calidad (>= 8.5 / 9.0)          ║"
  echo "╚══════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Uso:"
  echo "  bash Academic-Engine/scripts/task-loop.sh <slug> [\"<requerimientos>\"] [\"<meta>\"] [target_folder]"
  echo "  bash Academic-Engine/scripts/task-loop.sh file <ruta_archivo.md> [\"<requerimientos>\"]"
  echo ""
  echo "Ejemplos:"
  echo "  bash Academic-Engine/scripts/task-loop.sh auth-jwt \"API REST con tokens JWT y Clean Code\""
  echo "  bash Academic-Engine/scripts/task-loop.sh file \"Academic Vault/Drafts/guia-poo.md\" \"Explicar encapsulamiento y polimorfismo\""
  echo ""
  exit 0
fi

MODE="$1"

if [ "$MODE" = "file" ]; then
  FILE_PATH="${2:-}"
  REQUIREMENTS="${3:-}"
  if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
    echo "❌ Error: El archivo '$FILE_PATH' no existe."
    exit 1
  fi

  echo "🔄 Iniciando bucle Revisor-Editor sobre archivo: $FILE_PATH"
  node -e "
    const fs = require('fs');
    const path = require('path');
    const sdd = require('$SCRIPT_DIR/sdd-orchestrator.js');
    const targetFile = path.resolve(process.argv[1]);
    const reqs = process.argv[2] || '';
    
    let content = fs.readFileSync(targetFile, 'utf8');
    const specData = { intent: { business_goal: reqs, target_icp: 'SENA Software Developers' } };
    
    console.log('Auditoría inicial...');
    for (let cycle = 1; cycle <= 5; cycle++) {
      const report = sdd.auditText(content, specData);
      console.log('Ciclo ' + cycle + ': Nota ' + report.total_score + '/9.0 (Umbral: 8.5)');
      if (report.passed) {
        console.log('🎉 ¡Archivo aprobado con éxito! (>= 8.5)');
        fs.writeFileSync(targetFile, content, 'utf8');
        process.exit(0);
      }
      console.log('Aplicando remediación no destructiva por task-editor...');
      content = sdd.autoRemediateDraft(content, report, specData);
    }
    console.log('⚠️ Se alcanzó el límite de 5 ciclos.');
    fs.writeFileSync(targetFile, content, 'utf8');
  " "$FILE_PATH" "$REQUIREMENTS"
  exit 0
fi

# SDD Slug Mode
SLUG="$1"
REQS="${2:-}"
GOAL="${3:-$REQS}"
FOLDER="${4:-Drafts}"

echo "══════════════════════════════════════════════════════════════════════"
echo "🚀 EJECUCIÓN UNIVERSAL DE TAREA EN BUCLE: $SLUG"
echo "══════════════════════════════════════════════════════════════════════"

# Step 1: Ensure spec exists
node "$SCRIPT_DIR/sdd-orchestrator.js" init "$SLUG" "$SLUG" "$FOLDER" "task-editor,academic-reviewer" "Aprendices SENA" "$GOAL"

# Step 2: Run Spec Loop (Revisor <-> Editor)
echo ""
echo "▶ FASE 1: Ejecutando Bucle de Optimización del Spec (Revisor <-> Editor)..."
node "$SCRIPT_DIR/sdd-orchestrator.js" loop-spec "$SLUG"

# Step 3: Check if spec approved, or request HITL approval
echo ""
echo "▶ FASE 2: Aprobación del Spec (HITL-1)..."
node "$SCRIPT_DIR/sdd-orchestrator.js" approve-spec "$SLUG"

# Step 4: Run Task Loop (Revisor <-> Editor)
echo ""
echo "▶ FASE 3: Ejecutando Bucle de Optimización de la Tarea (Revisor <-> Editor)..."
node "$SCRIPT_DIR/sdd-orchestrator.js" loop-task "$SLUG"

echo ""
echo "══════════════════════════════════════════════════════════════════════"
echo "🎉 BUCLE REVISOR <-> EDITOR COMPLETADO EXITOSAMENTE (Nota >= 8.5/9.0)"
echo "══════════════════════════════════════════════════════════════════════"
echo "👉 Para revisar el borrador aprobado: bash Academic-Engine/scripts/sdd-manager.sh review-deliverable $SLUG"
echo "👉 Para aprobar e integrar al Vault:  bash Academic-Engine/scripts/sdd-manager.sh approve-deliverable $SLUG"
