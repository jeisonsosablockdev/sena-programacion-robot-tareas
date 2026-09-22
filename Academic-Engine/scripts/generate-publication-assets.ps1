# ==============================================================================
# Script: generate-publication-assets.ps1
# Purpose: Context-Aware Publication Asset Generator for BRIDS (Windows)
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeScript = Join-Path $ScriptDir "generate-publication-assets.js"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Error: Node.js no está instalado o no se encuentra en el PATH."
    exit 1
}

node $NodeScript @args
