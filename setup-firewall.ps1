# Script pentru configurarea firewall-ului Windows
# Permite conexiuni externe pe porturile backend-ului

Write-Host "Configurare Firewall pentru Home Inventory Backend" -ForegroundColor Cyan
Write-Host ""

# Verifica daca ruleaza ca Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ATENTIE: Trebuie sa rulezi acest script ca Administrator!" -ForegroundColor Red
    Write-Host "Click-dreapta pe PowerShell -> Run as Administrator" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Apasa Enter pentru a inchide"
    exit
}

Write-Host "Adaug reguli firewall pentru porturile 5000 si 5005..." -ForegroundColor Yellow

# Sterge regulile existente (daca exista)
Remove-NetFirewallRule -DisplayName "Home Inventory Backend HTTP" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Home Inventory Backend HTTPS" -ErrorAction SilentlyContinue

# Adauga regula pentru portul 5000 (HTTP)
New-NetFirewallRule -DisplayName "Home Inventory Backend HTTP" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 5000 `
    -Action Allow `
    -Profile Any `
    -Description "Permite conexiuni HTTP la backend-ul Home Inventory"

# Adauga regula pentru portul 5005 (HTTPS)
New-NetFirewallRule -DisplayName "Home Inventory Backend HTTPS" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 5005 `
    -Action Allow `
    -Profile Any `
    -Description "Permite conexiuni HTTPS la backend-ul Home Inventory"

Write-Host ""
Write-Host "Regulile firewall au fost adaugate cu succes!" -ForegroundColor Green
Write-Host ""
Write-Host "Verificare reguli:" -ForegroundColor Yellow
Get-NetFirewallRule -DisplayName "Home Inventory Backend*" | Select-Object DisplayName, Enabled, Direction, Action | Format-Table

Write-Host ""
Write-Host "Acum poti accesa backend-ul de pe mobil la:" -ForegroundColor Cyan
Write-Host "  - http://192.168.0.193:5000" -ForegroundColor White
Write-Host "  - https://192.168.0.193:5005" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Asigura-te ca backend-ul ruleaza!" -ForegroundColor Yellow
Write-Host "  cd c:\Projects\HomeInventory\backend\HomeInventory.WebApi" -ForegroundColor Gray
Write-Host "  dotnet run" -ForegroundColor Gray
