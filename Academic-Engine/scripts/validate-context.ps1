$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$JsScript = Join-Path $ScriptDir "validate-context.js"
node $JsScript $args
