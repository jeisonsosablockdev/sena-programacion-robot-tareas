$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir "..\\..")
$CodexSkillsDir = if ($env:CODEX_SKILLS_DIR) { $env:CODEX_SKILLS_DIR } else { Join-Path $HOME ".codex\\skills" }
$LocalDir = Join-Path $Root "Academic-Engine\\skills"
$Mode = if ($args.Count -gt 0) { $args[0] } else { "safe" }

New-Item -ItemType Directory -Force -Path $CodexSkillsDir | Out-Null

function Link-Skill {
    param(
        [string]$SourceDir,
        [string]$SkillName
    )

    $Target = Join-Path $CodexSkillsDir $SkillName

    if (Test-Path $Target) {
        if ($Mode -eq "--force") {
            Remove-Item -Recurse -Force $Target
        } else {
            Write-Output "skip  $SkillName (already exists in ~/.codex/skills)"
            return
        }
    }

    try {
        New-Item -ItemType SymbolicLink -Path $Target -Target $SourceDir | Out-Null
        Write-Output "link  $SkillName -> $SourceDir"
    } catch {
        Copy-Item -Recurse -Force $SourceDir $Target
        Write-Output "copy  $SkillName -> $Target"
    }
}

Write-Output "Activating project skills from:"
Write-Output "  local:    $LocalDir"
Write-Output ""

Get-ChildItem $LocalDir -Directory | Sort-Object Name | ForEach-Object {
    Link-Skill -SourceDir $_.FullName -SkillName $_.Name
}

Get-ChildItem $ImportedDir -Directory | Sort-Object Name | ForEach-Object {
    Link-Skill -SourceDir $_.FullName -SkillName $_.Name
}

Write-Output ""
Write-Output "Done."
Write-Output "Use '--force' to replace existing ~/.codex/skills entries with the project versions."
