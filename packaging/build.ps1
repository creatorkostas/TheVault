#Requires -Version 5.1
<# Builds dist/vault/: standalone Next server + vault.exe launcher + Go helper. #>
$ErrorActionPreference = "Stop"
$env:Path += ";$env:USERPROFILE\.bun\bin"
Set-Location (Split-Path $PSScriptRoot -Parent)

bun install
bun run build

$Out = "dist\vault"
New-Item -ItemType Directory -Force -Path $Out | Out-Null
Copy-Item -Recurse -Force ".next\standalone\*" $Out
Copy-Item -Recurse -Force ".next\static" "$Out\.next\static"
if (Test-Path "public") { Copy-Item -Recurse -Force "public" "$Out\public" }

Set-Location os-integration
go build -o "..\$Out\vault-save.exe" .\cmd\vault-save
Set-Location tray
go build -o "..\..\$Out\vault-tray.exe" .
Set-Location ..
$env:GOOS = "linux"; go build -o "..\dist\vault-save-linux" .\cmd\vault-save
$env:GOOS = $null
Set-Location ..

bun build --compile packaging/launcher.ts --outfile "$Out\vault.exe"
Write-Host "Done: $Out\vault.exe — double-click to run (keep the folder together)."
