# Instalare certificat CA în Windows
# Run this script as Administrator if needed

$certPath = "$PSScriptRoot\.ssl\ca.crt"

Write-Host "Installing CA certificate from: $certPath" -ForegroundColor Cyan

# Import in Current User Root store
$cert = Import-Certificate -FilePath $certPath -CertStoreLocation Cert:\CurrentUser\Root -ErrorAction Stop

Write-Host "Certificate installed successfully!" -ForegroundColor Green
Write-Host "Subject: $($cert.Subject)" -ForegroundColor Yellow
Write-Host "Thumbprint: $($cert.Thumbprint)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please restart your browser for changes to take effect." -ForegroundColor Cyan
