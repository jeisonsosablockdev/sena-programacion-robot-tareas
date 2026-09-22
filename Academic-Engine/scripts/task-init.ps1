$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $ScriptDir "task-init.js") @args
