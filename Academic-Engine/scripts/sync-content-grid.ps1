# ==============================================================================
# Script: sync-content-grid.ps1
# Purpose: Synchronizes the 15-day Content Grid with deliverable notes and visual assets (Windows)
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeScript = Join-Path $ScriptDir "sync-content-grid.js"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Error: Node.js no está instalado o no se encuentra en el PATH."
    exit 1
}

node $NodeScript @args
