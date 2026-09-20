# ==============================================================================
# White Tiger Dashboard - Launcher Script
# Opens index.html in the default system browser
# ==============================================================================

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$IndexPath = Join-Path $CurrentDir "index.html"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       WHITE TIGER DASHBOARD" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Theme: Pure White & Royal Blue (#0570e9)" -ForegroundColor Gray
Write-Host "Path:  $IndexPath" -ForegroundColor Gray
Write-Host ""

if (Test-Path $IndexPath) {
    Write-Host "Launching White Tiger Dashboard in your default browser..." -ForegroundColor Green
    Start-Process $IndexPath
} else {
    Write-Host "Error: index.html not found in $CurrentDir" -ForegroundColor Red
}
