# Updates C:\Windows\System32\drivers\etc\hosts with the current Minikube IP
# Run after minikube start so the changes take effect
# Requires Administrator privileges

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuración de Minikube Hosts" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Asegúrate de tener 'minikube tunnel' corriendo" -ForegroundColor Yellow
Write-Host "   El tunnel es NECESARIO para que el Ingress funcione." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Si aún no lo has iniciado, abre OTRA ventana PowerShell ADMIN y ejecuta:" -ForegroundColor Yellow
Write-Host "   minikube tunnel" -ForegroundColor Cyan
Write-Host ""

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
$Domains = @("citizen-web.local")

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

# Esperar un momento y verificar acceso al frontend
Write-Host "`nVerificando acceso al frontend..." -ForegroundColor Cyan
Write-Host "Esperando a que el Ingress esté listo (esto puede tomar 10-30 segundos)..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
$success = $false

while ($attempt -lt $maxAttempts -and -not $success) {
    $attempt++
    Start-Sleep -Seconds 2
    
    try {
        $response = Invoke-WebRequest -Uri "http://citizen-web.local" -Method Head -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $success = $true
        Write-Host ""
        Write-Host "✅ Frontend accesible en http://citizen-web.local - Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 ¡Todo listo! Puedes acceder a la aplicación en tu navegador:" -ForegroundColor Green
        Write-Host "   http://citizen-web.local" -ForegroundColor Cyan
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

if (-not $success) {
    Write-Host ""
    Write-Host ""
    Write-Host "⚠️  No se pudo conectar al frontend después de $maxAttempts intentos" -ForegroundColor Yellow
    Write-Host "   Esto puede deberse a que los pods todavía se están iniciando." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   📋 Checklist de troubleshooting:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   1. ¿Está corriendo 'minikube tunnel'? (NECESARIO para Ingress)" -ForegroundColor Yellow
    Write-Host "      En PowerShell ADMIN: minikube tunnel" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   2. Verifica el estado de los pods:" -ForegroundColor Yellow
    Write-Host "      kubectl get pods -n carpeta-ciudadana" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   3. Verifica el Ingress:" -ForegroundColor Yellow
    Write-Host "      kubectl get ingress -n carpeta-ciudadana" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Luego intenta acceder manualmente a: http://citizen-web.local" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Presiona Enter para cerrar..." -ForegroundColor Gray
Read-Host
