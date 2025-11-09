# Updates C:\Windows\System32\drivers\etc\hosts with the current Minikube IP
# Run after minikube start so the changes take effect
# Requires Administrator privileges

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

Write-Host "Actualizando hosts con la IP de Minikube..." -ForegroundColor Cyan

# Obtener IP de Minikube
$MinikubeIP = minikube ip
if (-not $MinikubeIP) {
    Write-Host "Error: No se pudo obtener la IP de Minikube. ¿Está Minikube ejecutándose?" -ForegroundColor Red
    exit 1
}

Write-Host "IP de Minikube: $MinikubeIP" -ForegroundColor Green

# Ruta del archivo hosts
$HostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"

# Dominios a actualizar
$Domains = @("citizen-web.local", "citizen-os.local")

# Leer el contenido actual del archivo hosts
$HostsContent = Get-Content $HostsFile

# Filtrar líneas que no contengan los dominios
$NewContent = $HostsContent | Where-Object { 
    $line = $_
    $shouldKeep = $true
    foreach ($domain in $Domains) {
        if ($line -match [regex]::Escape($domain)) {
            $shouldKeep = $false
            break
        }
    }
    $shouldKeep
}

# Agregar las nuevas entradas
foreach ($domain in $Domains) {
    $NewContent += "$MinikubeIP $domain"
    Write-Host "Agregado: $MinikubeIP $domain" -ForegroundColor Green
}

# Escribir el nuevo contenido al archivo hosts
$NewContent | Set-Content $HostsFile -Force

Write-Host "`n✅ Archivo hosts actualizado exitosamente" -ForegroundColor Green
Write-Host "`nEntradas actuales:" -ForegroundColor Cyan
foreach ($domain in $Domains) {
    Get-Content $HostsFile | Where-Object { $_ -match [regex]::Escape($domain) }
}
