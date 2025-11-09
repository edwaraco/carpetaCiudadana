# Script para ver el estado de todos los port-forwards

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Estado de Port-Forwards" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$portForwardJobs = Get-Job | Where-Object { $_.Name -like 'pf-*' }

if ($portForwardJobs.Count -eq 0) {
    Write-Host "[ERROR] No hay port-forwards activos" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para iniciarlos:" -ForegroundColor DarkGray
    Write-Host "  .\start-all-port-forwards.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Write-Host "Total de port-forwards: $($portForwardJobs.Count)" -ForegroundColor Yellow
Write-Host ""

$running = @()
$failed = @()
$stopped = @()

foreach ($job in $portForwardJobs) {
    $serviceName = $job.Name -replace '^pf-', ''
    switch ($job.State) {
        "Running" { $running += $serviceName }
        "Failed" { $failed += $serviceName }
        default { $stopped += $serviceName }
    }
}

if ($running.Count -gt 0) {
    Write-Host "[OK] ACTIVOS ($($running.Count)):" -ForegroundColor Green
    foreach ($name in $running) { Write-Host "  - $name" -ForegroundColor White }
    Write-Host ""
}

if ($failed.Count -gt 0) {
    Write-Host "[ERROR] CON ERRORES ($($failed.Count)):" -ForegroundColor Red
    foreach ($name in $failed) {
        Write-Host "  - $name" -ForegroundColor White
        Write-Host "    Ver error: Receive-Job -Name pf-$name -Keep" -ForegroundColor DarkGray
    }
    Write-Host ""
}

if ($stopped.Count -gt 0) {
    Write-Host "[WARN] DETENIDOS ($($stopped.Count)):" -ForegroundColor Yellow
    foreach ($name in $stopped) { Write-Host "  - $name" -ForegroundColor White }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DETALLES:" -ForegroundColor Yellow
Write-Host ""

$portForwardJobs | Format-Table -Property @(
    @{Label="Servicio"; Expression={$_.Name -replace '^pf-', ''}},
    @{Label="Estado"; Expression={$_.State}},
    @{Label="Inicio"; Expression={$_.PSBeginTime.ToString("HH:mm:ss")}},
    @{Label="ID"; Expression={$_.Id}}
) -AutoSize

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
