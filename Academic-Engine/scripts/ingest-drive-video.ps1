$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ToolDir = Resolve-Path "$ScriptDir\..\tools\drive-ingest"

npx --prefix "$ToolDir" tsx "$ToolDir\src\index.ts" $args
