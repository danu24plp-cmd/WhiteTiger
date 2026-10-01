# ====================================================================
# White Tiger Dashboard - Central Database & Web Server
# Berbasis .NET HttpListener bawaan Windows (Tanpa perlu install Node/Python)
# ====================================================================

param(
    [int]$Port = 8080
)

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $baseDir) { $baseDir = Get-Location }
$dbPath = Join-Path $baseDir "data\database.json"

# Buat folder data jika belum ada
$dataDir = Join-Path $baseDir "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   WHITE TIGER CENTRAL DATABASE & HTTP SERVER" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Directori Kerja: $baseDir" -ForegroundColor Gray
Write-Host "Database File  : $dbPath" -ForegroundColor Gray
Write-Host "Port Server    : $Port" -ForegroundColor Gray

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$Port/")
$listener.Prefixes.Add("http://localhost:$Port/")

try {
    $listener.Start()
    Write-Host "[ONLINE] Server aktif di: http://localhost:$Port/" -ForegroundColor Green
    Write-Host "Tekan Ctrl+C di terminal ini untuk mematikan server." -ForegroundColor Yellow
} catch {
    # Fallback to localhost only if binding to wildcard requires admin
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Prefixes.Add("http://127.0.0.1:$Port/")
    $listener.Start()
    Write-Host "[ONLINE] Server aktif di: http://localhost:$Port/" -ForegroundColor Green
}

function Get-MimeType($extension) {
    switch ($extension.ToLower()) {
        ".html" { return "text/html; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".js"   { return "application/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif"  { return "image/gif" }
        ".svg"  { return "image/svg+xml" }
        ".ico"  { return "image/x-icon" }
        default { return "application/octet-stream" }
    }
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # CORS Headers
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $urlPath = $request.Url.LocalPath

        # =======================================================
        # REST API ROUTING
        # =======================================================
        if ($urlPath -eq "/api/data" -and $request.HttpMethod -eq "GET") {
            $response.ContentType = "application/json; charset=utf-8"
            if (Test-Path $dbPath) {
                $bytes = [System.IO.File]::ReadAllBytes($dbPath)
            } else {
                $emptyJson = "{}"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($emptyJson)
            }
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if ($urlPath -eq "/api/inventory/deposit" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $payload = $body | ConvertFrom-Json

            $db = Get-Content $dbPath -Raw -Encoding UTF8 | ConvertFrom-Json

            $jenis = $payload.jenis
            $item = $payload.item
            $log = $payload.log

            $qty = [double]$item.qty
            $harga = [double]$item.hargaPerUnit

            if ($jenis -eq "BAHAN") {
                $found = $false
                foreach ($m in $db.materials) {
                    if ($m.nama.ToLower() -eq $item.nama.ToLower()) {
                        $m.qty = [double]$m.qty + $qty
                        if ($harga -gt 0) { $m.hargaPerUnit = $harga }
                        $m.totalNilai = [double]$m.qty * [double]$m.hargaPerUnit
                        $found = $true
                        break
                    }
                }
                if (-not $found) {
                    $newMat = [PSCustomObject]@{
                        id = "mat-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                        nama = $item.nama
                        unit = if ($item.unit) { $item.unit } else { "pcs" }
                        qty = $qty
                        hargaPerUnit = $harga
                        totalNilai = $qty * $harga
                        keterangan = if ($item.keterangan) { $item.keterangan } else { "Material Tambang" }
                    }
                    $db.materials = @($db.materials) + $newMat
                }
            } else {
                $found = $false
                foreach ($w in $db.weapons) {
                    if ($w.nama.ToLower() -eq $item.nama.ToLower()) {
                        $w.qty = [int]$w.qty + [int]$qty
                        if ($harga -gt 0) { $w.hargaPerUnit = $harga }
                        $w.totalNilai = [double]$w.qty * [double]$w.hargaPerUnit
                        if ($item.kondisi) { $w.kondisi = $item.kondisi }
                        $found = $true
                        break
                    }
                }
                if (-not $found) {
                    $newWpn = [PSCustomObject]@{
                        id = "wpn-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                        nama = $item.nama
                        kategori = if ($item.kategori) { $item.kategori } else { "Handgun" }
                        qty = [int]$qty
                        hargaPerUnit = $harga
                        totalNilai = $qty * $harga
                        kondisi = if ($item.kondisi) { $item.kondisi } else { "Baik (100%)" }
                    }
                    $db.weapons = @($db.weapons) + $newWpn
                }
            }

            # Tambahkan log
            if ($log) {
                $db.inventoryLogs = @($log) + @($db.inventoryLogs)
                if ($db.inventoryLogs.Count -gt 100) {
                    $db.inventoryLogs = $db.inventoryLogs[0..99]
                }
            }

            # Simpan database
            $updatedJson = $db | ConvertTo-Json -Depth 10
            [System.IO.File]::WriteAllText($dbPath, $updatedJson, [System.Text.Encoding]::UTF8)

            $response.ContentType = "application/json; charset=utf-8"
            $respBytes = [System.Text.Encoding]::UTF8.GetBytes($updatedJson)
            $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
            $response.Close()
            continue
        }

        if ($urlPath -eq "/api/inventory/withdraw" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $payload = $body | ConvertFrom-Json

            $db = Get-Content $dbPath -Raw -Encoding UTF8 | ConvertFrom-Json
            $jenis = $payload.jenis
            $id = $payload.id
            $qtyWithdraw = [double]$payload.jumlah
            $petugas = if ($payload.petugas) { $payload.petugas } else { "Admin" }

            $namaBarang = ""
            $unitBarang = "pcs"
            $errorMsg = $null

            if ($jenis -eq "BAHAN") {
                $item = $db.materials | Where-Object { $_.id -eq $id }
                if (-not $item) { $errorMsg = "Bahan tidak ditemukan." }
                elseif ([double]$item.qty -lt $qtyWithdraw) {
                    $errorMsg = "Stok tidak mencukupi! Tersisa $($item.qty) $($item.unit)."
                } else {
                    $item.qty = [double]$item.qty - $qtyWithdraw
                    $item.totalNilai = [double]$item.qty * [double]$item.hargaPerUnit
                    $namaBarang = $item.nama
                    $unitBarang = $item.unit
                }
            } else {
                $item = $db.weapons | Where-Object { $_.id -eq $id }
                if (-not $item) { $errorMsg = "Senjata tidak ditemukan." }
                elseif ([int]$item.qty -lt [int]$qtyWithdraw) {
                    $errorMsg = "Stok tidak mencukupi! Tersisa $($item.qty) unit."
                } else {
                    $item.qty = [int]$item.qty - [int]$qtyWithdraw
                    $item.totalNilai = [double]$item.qty * [double]$item.hargaPerUnit
                    $namaBarang = $item.nama
                    $unitBarang = "unit"
                }
            }

            if ($errorMsg) {
                $response.StatusCode = 400
                $response.ContentType = "application/json; charset=utf-8"
                $errObj = @{ message = $errorMsg } | ConvertTo-Json
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errObj)
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                $response.Close()
                continue
            }

            $waktu = (Get-Date).ToString("dd/MM/yyyy HH:mm")
            $logItem = [PSCustomObject]@{
                id = "log-inv-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                waktu = $waktu
                jenis = $jenis
                nama = $namaBarang
                aksi = "WITHDRAW"
                jumlah = $qtyWithdraw
                unit = $unitBarang
                petugas = $petugas
            }

            $db.inventoryLogs = @($logItem) + @($db.inventoryLogs)
            if ($db.inventoryLogs.Count -gt 100) { $db.inventoryLogs = $db.inventoryLogs[0..99] }

            $updatedJson = $db | ConvertTo-Json -Depth 10
            [System.IO.File]::WriteAllText($dbPath, $updatedJson, [System.Text.Encoding]::UTF8)

            $response.ContentType = "application/json; charset=utf-8"
            $respBytes = [System.Text.Encoding]::UTF8.GetBytes($updatedJson)
            $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
            $response.Close()
            continue
        }

        # =======================================================
        # STATIC FILE SERVING
        # =======================================================
        if ($urlPath -eq "/" -or [string]::IsNullOrWhiteSpace($urlPath)) {
            $urlPath = "/index.html"
        }

        $localFilePath = Join-Path $baseDir ($urlPath.TrimStart("/").Replace("/", "\"))

        if (Test-Path $localFilePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localFilePath)
            $response.ContentType = Get-MimeType $ext
            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("File Not Found: $urlPath")
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
            $response.Close()
        }
    } catch {
        # Log and continue
    }
}
