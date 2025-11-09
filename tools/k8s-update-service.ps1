<#
.SYNOPSIS
    Kubernetes Service Update Script for Windows

.DESCRIPTION
    Script genérico para actualizar servicios en Kubernetes (Minikube) en Windows

.PARAMETER ServiceName
    Nombre del servicio (citizen-web, auth-service, etc.)

.PARAMETER Namespace
    Namespace de Kubernetes (default: carpeta-ciudadana)

.PARAMETER SkipBuild
    Saltar construcción de imagen Docker

.PARAMETER SkipLoad
    Saltar carga de imagen en Minikube

.PARAMETER SkipConfig
    Saltar aplicación de ConfigMap

.PARAMETER Tag
    Tag de la imagen Docker (default: latest)

.EXAMPLE
    .\k8s-update-service.ps1 -ServiceName citizen-web

.EXAMPLE
    .\k8s-update-service.ps1 -ServiceName auth-service -SkipBuild

.EXAMPLE
    .\k8s-update-service.ps1 -ServiceName carpeta-ciudadana-service -Namespace carpeta-ciudadana

.EXAMPLE
    .\k8s-update-service.ps1 -ServiceName document-authentication-service -Tag v1.2.0
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$ServiceName,

    [Parameter(Mandatory=$false)]
    [string]$Namespace = "carpeta-ciudadana",

    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,

    [Parameter(Mandatory=$false)]
    [switch]$SkipLoad,

    [Parameter(Mandatory=$false)]
    [switch]$SkipConfig,

    [Parameter(Mandatory=$false)]
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

# Funciones para imprimir con color
function Print-Step {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Show-Usage {
    Write-Host @"

Kubernetes Service Update Script para Windows

Uso:
    .\k8s-update-service.ps1 -ServiceName <service-name> [options]

Parámetros:
    -ServiceName        Nombre del servicio (citizen-web, auth-service, etc.) [Requerido]
    -Namespace          Namespace de Kubernetes (default: carpeta-ciudadana)
    -SkipBuild          Saltar construcción de imagen Docker
    -SkipLoad           Saltar carga de imagen en Minikube
    -SkipConfig         Saltar aplicación de ConfigMap
    -Tag                Tag de la imagen Docker (default: latest)
    -Help               Mostrar esta ayuda

Ejemplos:
    # Actualización completa
    .\k8s-update-service.ps1 -ServiceName citizen-web

    # Solo rebuild sin cargar en Minikube
    .\k8s-update-service.ps1 -ServiceName auth-service -SkipLoad

    # Actualizar sin reconstruir imagen
    .\k8s-update-service.ps1 -ServiceName carpeta-ciudadana-service -SkipBuild

    # Usar tag específico
    .\k8s-update-service.ps1 -ServiceName document-authentication-service -Tag v1.2.0

Servicios disponibles:
    - citizen-web
    - auth-service
    - carpeta-ciudadana-service
    - ciudadano-registry-service
    - document-authentication-service
    - notifications-service

"@ -ForegroundColor Cyan
}

# Mapeo de servicios a directorios
$ServiceDirs = @{
    "citizen-web" = "services\citizen-web"
    "auth-service" = "services\auth-service"
    "carpeta-ciudadana-service" = "services\carpeta-ciudadana-service"
    "ciudadano-registry-service" = "services\ciudadano-registry-service"
    "document-authentication-service" = "services\document-authentication-service"
    "notifications-service" = "services\notifications-service"
}

# Validar que el servicio existe
if (-not $ServiceDirs.ContainsKey($ServiceName)) {
    Print-Error "Servicio desconocido: $ServiceName"
    Write-Host "`nServicios disponibles:" -ForegroundColor Yellow
    foreach ($service in $ServiceDirs.Keys) {
        Write-Host "  - $service" -ForegroundColor White
    }
    exit 1
}

$ServiceDir = $ServiceDirs[$ServiceName]

# Obtener la ruta del proyecto
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ServicePath = Join-Path $ProjectRoot $ServiceDir
$ImageName = "${ServiceName}:${Tag}"

# Verificar que el directorio existe
if (-not (Test-Path $ServicePath)) {
    Print-Error "Directorio no encontrado: $ServicePath"
    exit 1
}

# Verificar que existe Dockerfile
$DockerfilePath = Join-Path $ServicePath "Dockerfile"
if (-not (Test-Path $DockerfilePath)) {
    Print-Error "Dockerfile no encontrado en: $ServicePath"
    exit 1
}

Write-Host ""
Print-Step "🚀 Actualizando $ServiceName en Kubernetes..."
Write-Host ""
Print-Step "📋 Configuración:"
Write-Host "  - Servicio: $ServiceName"
Write-Host "  - Namespace: $Namespace"
Write-Host "  - Imagen: $ImageName"
Write-Host "  - Directorio: $ServicePath"
Write-Host ""

# Paso 1: Construir imagen Docker
if (-not $SkipBuild) {
    Print-Step "📦 Paso 1: Construyendo imagen Docker..."
    Push-Location $ServicePath
    try {
        docker build -t $ImageName .
        if ($LASTEXITCODE -ne 0) {
            throw "Fallo al construir la imagen"
        }
        Print-Success "Imagen construida exitosamente"
    }
    catch {
        Print-Error "Fallo al construir la imagen"
        Pop-Location
        exit 1
    }
    finally {
        Pop-Location
    }
    Write-Host ""
}
else {
    Print-Warning "Saltando construcción de imagen (-SkipBuild)"
    Write-Host ""
}

# Paso 2: Cargar imagen en Minikube
if (-not $SkipLoad) {
    Print-Step "📥 Paso 2: Cargando imagen en Minikube..."
    
    # Intentar eliminar imagen anterior (puede fallar si no existe)
    minikube image rm $ImageName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Imagen anterior eliminada de Minikube"
    }
    else {
        Print-Warning "No se pudo eliminar imagen anterior (puede no existir)"
    }

    minikube image load $ImageName
    if ($LASTEXITCODE -ne 0) {
        Print-Error "Fallo al cargar imagen en Minikube"
        exit 1
    }
    Print-Success "Imagen cargada en Minikube"
    Write-Host ""
}
else {
    Print-Warning "Saltando carga en Minikube (-SkipLoad)"
    Write-Host ""
}

# Paso 3: Verificar imagen
Print-Step "✅ Paso 3: Verificando imagen en Minikube..."
$images = minikube image ls 2>$null | Select-String $ServiceName
if ($images) {
    Print-Success "Imagen verificada en Minikube"
    $images | ForEach-Object { Write-Host $_ }
}
else {
    Print-Warning "Imagen no encontrada en Minikube (puede ser normal si se usó -SkipLoad)"
}
Write-Host ""

# Paso 4: Aplicar ConfigMap (si existe)
if (-not $SkipConfig) {
    $ConfigMapPath = Join-Path $ServicePath "k8s\configmap.yaml"
    if (Test-Path $ConfigMapPath) {
        Print-Step "📋 Paso 4: Aplicando ConfigMap..."
        
        kubectl apply -f $ConfigMapPath
        if ($LASTEXITCODE -ne 0) {
            Print-Error "Fallo al aplicar ConfigMap"
            exit 1
        }
        Print-Success "ConfigMap aplicado exitosamente"
    }
    else {
        Print-Warning "ConfigMap no encontrado (k8s\configmap.yaml) - Saltando"
    }
}
else {
    Print-Warning "Saltando aplicación de ConfigMap (-SkipConfig)"
}
Write-Host ""

# Paso 5: Reiniciar deployment
Print-Step "🔄 Paso 5: Reiniciando deployment..."

kubectl rollout restart "deployment/$ServiceName" -n $Namespace
if ($LASTEXITCODE -ne 0) {
    Print-Error "Fallo al reiniciar deployment"
    exit 1
}
Print-Success "Deployment reiniciado"
Write-Host ""

# Paso 6: Esperar rollout
Print-Step "⏳ Paso 6: Esperando rollout..."

kubectl rollout status "deployment/$ServiceName" -n $Namespace --timeout=300s
if ($LASTEXITCODE -ne 0) {
    Print-Error "Timeout o fallo en rollout"
    exit 1
}
Print-Success "Rollout completado exitosamente"
Write-Host ""

# Paso 7: Verificar pods
Print-Step "🔍 Paso 7: Verificando pods..."
kubectl get pods -n $Namespace -l "app=$ServiceName"
Write-Host ""

# Paso 8: Mostrar logs
Print-Step "📜 Paso 8: Mostrando logs recientes..."
kubectl logs -n $Namespace -l "app=$ServiceName" --tail=20
Write-Host ""

# Paso 9: Obtener URL del servicio
Print-Step "🌐 Paso 9: Información del servicio..."
kubectl get svc $ServiceName -n $Namespace
Write-Host ""

# Obtener IP del LoadBalancer
$ServiceIP = (kubectl get svc $ServiceName -n $Namespace -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null)
$ServicePort = (kubectl get svc $ServiceName -n $Namespace -o jsonpath='{.spec.ports[0].port}' 2>$null)

if ($ServiceIP -and $ServicePort) {
    Print-Success "✅ ¡Actualización completada!"
    Write-Host ""
    Print-Step "📍 Accede al servicio en: http://${ServiceIP}:${ServicePort}"
}
else {
    Print-Success "✅ ¡Actualización completada!"
    Write-Host ""
    Print-Warning "No se pudo obtener la IP del servicio (puede ser ClusterIP)"
    Write-Host "Usa: kubectl port-forward svc/$ServiceName -n $Namespace <local-port>:<service-port>"
}

Write-Host ""
