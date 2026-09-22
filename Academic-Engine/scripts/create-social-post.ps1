$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$JsScript = Join-Path $ScriptDir "create-social-post.js"

node $JsScript $args
