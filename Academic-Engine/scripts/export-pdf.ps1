$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$JsScript = Join-Path $ScriptDir "export-pdf.js"

node $JsScript @args
