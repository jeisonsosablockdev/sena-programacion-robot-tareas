$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($args.Count -lt 1) {
  Write-Host ""
  Write-Host "╔══════════════════════════════════════════════════════════════════════╗"
  Write-Host "║         task-loop.ps1 - Bucle Autónomo Revisor <-> Editor            ║"
  Write-Host "║           Auditoría de Pertinencia & Calidad (>= 8.5 / 9.0)          ║"
  Write-Host "╚══════════════════════════════════════════════════════════════════════╝"
  Write-Host ""
  Write-Host "Uso: .\task-loop.ps1 <slug> [`"<requerimientos>`"] [`"<meta>`"] [target_folder]"
  exit 0
}

$Mode = $args[0]

if ($Mode -eq "file") {
  $FilePath = $args[1]
  $Requirements = if ($args.Count -gt 2) { $args[2] } else { "" }
  
  if (-not (Test-Path $FilePath)) {
    Write-Host "❌ Error: El archivo '$FilePath' no existe."
    exit 1
  }
  
  $OrchestratorPath = Join-Path $ScriptDir "sdd-orchestrator.js"
  node -e @"
    const fs = require('fs');
    const path = require('path');
    const sdd = require(process.argv[1]);
    const targetFile = path.resolve(process.argv[2]);
    const reqs = process.argv[3] || '';
    let content = fs.readFileSync(targetFile, 'utf8');
    const specData = { intent: { business_goal: reqs, target_icp: 'SENA Software Developers' } };
    for (let cycle = 1; cycle <= 5; cycle++) {
      const report = sdd.auditText(content, specData);
      console.log('Ciclo ' + cycle + ': Nota ' + report.total_score + '/9.0');
      if (report.passed) {
        console.log('¡Archivo aprobado! (>= 8.5)');
        fs.writeFileSync(targetFile, content, 'utf8');
        process.exit(0);
      }
      content = sdd.autoRemediateDraft(content, report, specData);
    }
    fs.writeFileSync(targetFile, content, 'utf8');
"@ $OrchestratorPath $FilePath $Requirements
  exit 0
}

$Slug = $args[0]
$Reqs = if ($args.Count -gt 1) { $args[1] } else { "" }
$Goal = if ($args.Count -gt 2) { $args[2] } else { $Reqs }
$Folder = if ($args.Count -gt 3) { $args[3] } else { "Drafts" }

$Orchestrator = Join-Path $ScriptDir "sdd-orchestrator.js"
node $Orchestrator init $Slug $Slug $Folder "task-editor,academic-reviewer" "Aprendices SENA" $Goal
node $Orchestrator loop-spec $Slug
node $Orchestrator approve-spec $Slug
node $Orchestrator loop-task $Slug
