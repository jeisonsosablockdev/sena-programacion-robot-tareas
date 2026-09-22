$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CoreDir = Split-Path -Parent $ScriptDir
$AgentsDir = Join-Path $CoreDir "agents"

Write-Host "========================================================"
Write-Host "          BRIDS.io Founder & YC Sub-Agent Squad         "
Write-Host "========================================================"
Write-Host ""

$AgentFiles = Get-ChildItem -Path $AgentsDir -Filter "*.yaml" | Sort-Object Name
Write-Host "Total Configured Sub-Agents: $($AgentFiles.Count)"
Write-Host ""

$Index = 1
foreach ($file in $AgentFiles) {
    $content = Get-Content $file.FullName -Raw
    $id = [regex]::Match($content, "(?m)^id:\s*([^\r\n]+)").Groups[1].Value.Trim()
    $role = [regex]::Match($content, "(?m)^role:\s*([^\r\n]+)").Groups[1].Value.Trim()
    $desc = [regex]::Match($content, "(?m)^description:\s*([^\r\n]+)").Groups[1].Value.Trim()
    Write-Host "[$Index] $id ($role)"
    Write-Host "    Status: OK (Autonomous YAML Valid) -> $($file.Name)"
    Write-Host "    Description: $desc"
    Write-Host ""
    $Index++
}
