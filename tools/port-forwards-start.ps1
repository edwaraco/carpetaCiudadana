# Script para iniciar todos los port-forwards necesarios en background

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Port-Forwards en Background" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que minikube esta corriendo
$minikubeStatus = minikube status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Minikube no esta corriendo" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Minikube esta corriendo" -ForegroundColor Green
Write-Host ""

# Funcion para iniciar un port-forward en background
function Start-PortForward {
    param([string]$Name, [string]$Namespace, [string]$Service, [string]$Ports, [string]$Type)
    
    $jobName = "pf-$Name"
    $existingJob = Get-Job -Name $jobName -ErrorAction SilentlyContinue
    if ($existingJob) {
        Write-Host "  [WARN] Port-forward '$Name' ya esta corriendo" -ForegroundColor Yellow
        return
    }
    
    $job = Start-Job -Name $jobName -ScriptBlock {
        param($ns, $svc, $ports)
        kubectl port-forward -n $ns svc/$svc $ports
    } -ArgumentList $Namespace, $Service, $Ports
    
    Start-Sleep -Milliseconds 500
    
    $status = (Get-Job -Name $jobName).State
    if ($status -eq "Running") {
        $typeColor = if ($Type -eq "REQUERIDO") { "Green" } else { "Cyan" }
        Write-Host "  [OK] $Name [$Type] - Puertos: $Ports" -ForegroundColor $typeColor
    } else {
        Write-Host "  [ERROR] Error iniciando $Name" -ForegroundColor Red
    }
}

Write-Host "Iniciando port-forwards..." -ForegroundColor Cyan
Write-Host ""

Write-Host "SERVICIOS REQUERIDOS:" -ForegroundColor Green
Start-PortForward -Name "citizen-web" -Namespace "carpeta-ciudadana" -Service "citizen-web" -Ports "8080:8080" -Type "REQUERIDO"
Start-PortForward -Name "rabbitmq" -Namespace "carpeta-ciudadana" -Service "carpeta-rabbitmq" -Ports "5672:5672,15672:15672" -Type "REQUERIDO"

Write-Host ""
Write-Host "INTERFACES DE ADMINISTRACION:" -ForegroundColor Cyan
Start-PortForward -Name "minio-console" -Namespace "carpeta-ciudadana" -Service "minio-console" -Ports "9001:9001" -Type "OPCIONAL"
Start-PortForward -Name "minio-api" -Namespace "carpeta-ciudadana" -Service "minio" -Ports "9000:9000" -Type "OPCIONAL"
Start-PortForward -Name "k8s-dashboard" -Namespace "kubernetes-dashboard" -Service "kubernetes-dashboard" -Ports "8443:443" -Type "OPCIONAL"

Write-Host ""
Write-Host "APIS Y DOCUMENTACION:" -ForegroundColor Cyan
Start-PortForward -Name "carpeta-api" -Namespace "carpeta-ciudadana" -Service "carpeta-ciudadana-service" -Ports "8082:8080" -Type "OPCIONAL"
Start-PortForward -Name "registry-api" -Namespace "carpeta-ciudadana" -Service "ciudadano-registry-service" -Ports "8081:8081" -Type "OPCIONAL"
Start-PortForward -Name "doc-auth-api" -Namespace "carpeta-ciudadana" -Service "document-authentication-service" -Ports "8083:8083" -Type "OPCIONAL"

Write-Host ""
Write-Host "BASE DE DATOS:" -ForegroundColor Cyan
Start-PortForward -Name "auth-postgres" -Namespace "carpeta-ciudadana" -Service "auth-postgres-service" -Ports "5432:5432" -Type "OPCIONAL"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Port-Forwards Iniciados" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ACCESO A LOS SERVICIOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Frontend:              http://localhost:8080" -ForegroundColor Green
Write-Host "  RabbitMQ Management:   http://localhost:15672 (admin/admin123)" -ForegroundColor Cyan
Write-Host "  MinIO Console:         http://localhost:9001 (admin/admin123)" -ForegroundColor Cyan
Write-Host "  Kubernetes Dashboard:  https://localhost:8443 (requiere token)" -ForegroundColor Cyan
Write-Host "  Carpeta API Swagger:   http://localhost:8082/api/v1/swagger-ui.html" -ForegroundColor Cyan
Write-Host "  Registry API Swagger:  http://localhost:8081/ciudadano-registry/swagger-ui.html" -ForegroundColor Cyan
Write-Host "  Doc Auth API Docs:     http://localhost:8083/api/v1/docs" -ForegroundColor Cyan
Write-Host "  PostgreSQL (Auth):     localhost:5432 (auth_service_db)" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Todos los port-forwards estan activos en background" -ForegroundColor Green
Write-Host "     Para detenerlos: .\port-forwards-stop.ps1" -ForegroundColor DarkGray
Write-Host "     Ver estado: .\port-forwards-status.ps1" -ForegroundColor DarkGray
Write-Host ""
