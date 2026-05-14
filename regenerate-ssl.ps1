# Script pentru regenerarea certificatelor SSL
# Folosit cand IP-ul se schimba sau pentru a include noi domenii

Write-Host "Regenerare Certificate SSL pentru Home Inventory" -ForegroundColor Cyan
Write-Host ""

$hostname = $env:COMPUTERNAME
$hostname_lower = $hostname.ToLower()
$hostname_local = "$hostname_lower.local"

# Detecteaza IP-ul curent
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.254.*"
} | Select-Object -First 1).IPAddress

Write-Host "Informatii detectate:" -ForegroundColor Yellow
Write-Host "   Hostname: $hostname" -ForegroundColor White
Write-Host "   Hostname local: $hostname_local" -ForegroundColor White
Write-Host "   IP curent: $ipAddress" -ForegroundColor White
Write-Host ""

# Navigheaza in folderul .ssl
Set-Location "$PSScriptRoot\.ssl"

# Creeaza certificatul cu toate variantele posibile
Write-Host "Generez certificat SSL cu hostname si IP..." -ForegroundColor Cyan

$domains = @(
    "localhost",
    "127.0.0.1",
    $hostname,
    $hostname_lower,
    $hostname_local,
    $ipAddress
)

$domainString = $domains -join " "

Write-Host "   Domenii incluse: $domainString" -ForegroundColor Gray

# Genereaza certificatul
& mkcert create-cert --domains $domains --key localhost+host.key --cert localhost+host.crt --validity 825

if ($LASTEXITCODE -eq 0) {
    Write-Host "Certificat generat cu succes!" -ForegroundColor Green
    
    # Converteste in PFX pentru .NET
    Write-Host "Conversie in format PFX pentru .NET..." -ForegroundColor Cyan
    & openssl pkcs12 -export -out localhost+host.pfx -inkey localhost+host.key -in localhost+host.crt -passout pass:dev123
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Certificat PFX generat!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Urmatorii pasi:" -ForegroundColor Yellow
        Write-Host "   1. Actualizat vite.config.ts -> localhost+host.key si localhost+host.crt" -ForegroundColor White
        Write-Host "   2. Actualizat appsettings.Development.json -> localhost+host.pfx" -ForegroundColor White
        Write-Host "   3. Acceseaza aplicatia prin:" -ForegroundColor White
        Write-Host "      - https://$hostname_local`:5173 (RECOMANDAT)" -ForegroundColor Green
        Write-Host "      - https://$ipAddress`:5173" -ForegroundColor White
        Write-Host ""
        Write-Host "TIP: Foloseste $hostname_local pentru a evita regenerarea la schimbarea IP-ului!" -ForegroundColor Cyan
    } else {
        Write-Host "Eroare la conversie PFX" -ForegroundColor Red
    }
} else {
    Write-Host "Eroare la generarea certificatului" -ForegroundColor Red
}

Write-Host ""
$sslPath = Join-Path $PSScriptRoot ".ssl"
Write-Host "Certificatele sunt in: $sslPath" -ForegroundColor Gray
