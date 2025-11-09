# Script para detener todos los port-forwards en background

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deteniendo Port-Forwards" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$portForwardJobs = Get-Job | Where-Object { $_.Name -like 'pf-*' }

if ($portForwardJobs.Count -eq 0) {
    Write-Host "[OK] No hay port-forwards activos" -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host "Encontrados $($portForwardJobs.Count) port-forwards activos:" -ForegroundColor Yellow
Write-Host ""

foreach ($job in $portForwardJobs) {
    $serviceName = $job.Name -replace '^pf-', ''
    $status = $job.State
    
    Write-Host "  - $serviceName [$status] " -NoNewline -ForegroundColor White
    
    Stop-Job -Name $job.Name -ErrorAction SilentlyContinue
    Remove-Job -Name $job.Name -Force -ErrorAction SilentlyContinue
    
    Write-Host "-> Detenido [OK]" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[OK] Todos los port-forwards han sido detenidos" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para reiniciarlos:" -ForegroundColor DarkGray
Write-Host "  .\start-all-port-forwards.ps1" -ForegroundColor Yellow
Write-Host ""
