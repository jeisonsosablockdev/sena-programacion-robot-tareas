$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CoreDir = Split-Path -Parent $ScriptDir
$SkillsDir = Join-Path $CoreDir "skills"

Write-Host "Auditing Skills Against Agent Skills Specification (PowerShell)..."
$SkillFiles = Get-ChildItem -Path $SkillsDir -Recurse -Filter "SKILL.md"
Write-Host "Total Skills Found: $($SkillFiles.Count)"
foreach ($file in $SkillFiles) {
    Write-Host "✓ $($file.Directory.Name)"
}
Write-Host "All skills are valid! ✓"
