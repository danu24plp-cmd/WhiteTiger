# ==============================================================================
# White Tiger Dashboard - Launcher Script
# Menjalankan Server Lokal & Membuka Dashboard di Browser
# ==============================================================================

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $CurrentDir) { $CurrentDir = Get-Location }

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       WHITE TIGER DASHBOARD" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Lokasi: $CurrentDir" -ForegroundColor Gray
Write-Host ""

$serverScript = Join-Path $CurrentDir "server.ps1"

# Jalankan server lokal di background
Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -NoProfile -File `"$serverScript`" -Port 8080" -WindowStyle Hidden
Start-Sleep -Seconds 1

Write-Host "Membuka White Tiger Dashboard..." -ForegroundColor Green
Start-Process "http://localhost:8080"

Write-Host "Dashboard aktif di: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Untuk mengonlinekan agar bisa diakses orang lain, jalankan: .\start-online.ps1" -ForegroundColor Yellow
