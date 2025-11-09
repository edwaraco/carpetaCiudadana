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

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Configuración completada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Asegúrate de tener 'minikube tunnel' corriendo" -ForegroundColor Yellow
Write-Host "   (en otra ventana PowerShell como ADMIN):" -ForegroundColor Yellow
Write-Host "   minikube tunnel" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Luego accede a la aplicación en tu navegador:" -ForegroundColor Yellow
Write-Host "   http://citizen-web.local" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Troubleshooting si no funciona:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  • Verifica pods: kubectl get pods -n carpeta-ciudadana" -ForegroundColor Gray
Write-Host "  • Verifica Ingress: kubectl get ingress -n carpeta-ciudadana" -ForegroundColor Gray
Write-Host "  • Verifica tunnel: debe estar corriendo y mostrar 'citizen-web'" -ForegroundColor Gray

Write-Host ""
Write-Host "Presiona Enter para cerrar..." -ForegroundColor Gray
Read-Host
