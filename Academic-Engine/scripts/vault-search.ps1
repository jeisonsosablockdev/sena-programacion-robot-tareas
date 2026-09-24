# vault-search.ps1 - Lean in-memory hybrid search for Academic Vault & Context
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& node --experimental-strip-types "$ScriptDir\vault-search.ts" $args
