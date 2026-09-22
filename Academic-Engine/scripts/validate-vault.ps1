$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$JsScript = Join-Path $ScriptDir "validate-vault.js"
node $JsScript $args
