$ErrorActionPreference = "Continue"
$Port = 27124
$Url = "https://127.0.0.1:$Port/"

Write-Host "Verificando conexion con Obsidian Local REST API en puerto $Port..."
try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 3 -UseBasicParsing
    Write-Host "Obsidian API respondiendo correctamente."
} catch {
    Write-Host "Obsidian Local REST API no detectada en $Url (inicia Obsidian con Local REST API si deseas sync en vivo)."
}
