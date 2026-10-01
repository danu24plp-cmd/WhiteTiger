# ====================================================================
# WHITE TIGER DASHBOARD - 1-KLIK ONLINE & MULTI-USER LAUNCHER
# Menjalankan server lokal dan menghubungkannya ke internet via Cloudflare Tunnel
# ====================================================================

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $baseDir) { $baseDir = Get-Location }

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   🐯 WHITE TIGER DASHBOARD - 1-KLIK ONLINE LAUNCHER   " -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Cek / Unduh Cloudflare Tunnel executable jika belum ada
$cloudflaredPath = Join-Path $baseDir "cloudflared.exe"
if (-not (Test-Path $cloudflaredPath)) {
    Write-Host "[1/3] Mengunduh Cloudflare Tunnel (resmi & gratis)..." -ForegroundColor Yellow
    $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    try {
        curl.exe -L -o $cloudflaredPath $url
        Write-Host "      Download selesai!" -ForegroundColor Green
    } catch {
        Write-Host "      Gagal download otomatis. Menjalankan mode server lokal..." -ForegroundColor Red
    }
} else {
    Write-Host "[1/3] Cloudflare Tunnel sudah tersedia." -ForegroundColor Green
}

# 2. Jalankan Backend Server di Port 8080
Write-Host "[2/3] Memulai server lokal di background..." -ForegroundColor Yellow
$serverScript = Join-Path $baseDir "server.ps1"
$serverProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -NoProfile -File `"$serverScript`" -Port 8080" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2

# 3. Buat Tunnel Online Publik
if (Test-Path $cloudflaredPath) {
    Write-Host "[3/3] Menghubungkan ke Internet publik (Cloudflare Quick Tunnel)..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "-------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "Tautan online publik sedang dibuat..." -ForegroundColor White
    Write-Host "Setelah muncul teks 'https://....trycloudflare.com'," -ForegroundColor White
    Write-Host "Anda bisa langsung SALIN dan BAGIKAN link tersebut ke orang lain!" -ForegroundColor White
    Write-Host "-------------------------------------------------------" -ForegroundColor Cyan
    Write-Host ""

    # Buka browser lokal
    Start-Process "http://localhost:8080"

    # Jalankan cloudflared di terminal aktif agar link tampil jelas
    & $cloudflaredPath tunnel --url http://localhost:8080
} else {
    Write-Host "[3/3] Membuka dashboard lokal..." -ForegroundColor Yellow
    Start-Process "http://localhost:8080"
    Write-Host ""
    Write-Host "Dashboard aktif di: http://localhost:8080" -ForegroundColor Green
    Write-Host "Untuk mematikan server, tutup jendela ini." -ForegroundColor Yellow
    Read-Host "Tekan Enter untuk keluar"
}
