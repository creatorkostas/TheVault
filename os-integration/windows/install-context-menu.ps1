#Requires -Version 5.1
<#
  Installs TheVault right-click entries (per-user, no admin):
  - Images / videos / audio files  ->  Save to TheVault
  - .url shortcuts (links)         ->  Save link to TheVault
  - Folder background              ->  Save clipboard as note
#>
param(
  [string]$VaultUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Exe = Join-Path $RepoRoot "dist\vault-save.exe"
if (-not (Test-Path $Exe)) {
  throw "Helper not found at $Exe. Build it first:  cd os-integration; go build -o ..\dist\vault-save.exe .\cmd\vault-save"
}

# Persist vault URL for Explorer-spawned processes
[Environment]::SetEnvironmentVariable("VAULT_URL", $VaultUrl, "User")
$env:VAULT_URL = $VaultUrl

function Add-Verb($Key, $Label, $Command) {
  New-Item -Path $Key -Force | Out-Null
  Set-ItemProperty -Path $Key -Name "(Default)" -Value $Label
  New-Item -Path "$Key\command" -Force | Out-Null
  Set-ItemProperty -Path "$Key\command" -Name "(Default)" -Value $Command
}

$SaveFile = "`"$Exe`" --file `"%1`" --tags clipped"
Add-Verb "HKCU:\Software\Classes\SystemFileAssociations\image\shell\TheVault.Save" "Save to TheVault" $SaveFile
Add-Verb "HKCU:\Software\Classes\SystemFileAssociations\video\shell\TheVault.Save" "Save to TheVault" $SaveFile
Add-Verb "HKCU:\Software\Classes\SystemFileAssociations\audio\shell\TheVault.Save" "Save to TheVault" $SaveFile

Add-Verb "HKCU:\Software\Classes\InternetShortcut\shell\TheVault.Save" "Save link to TheVault" `
  "`"$Exe`" --url-file `"%1`" --tags clipped"

$ClipCmd = "powershell.exe -NoProfile -WindowStyle Hidden -Command `"Get-Clipboard -Raw | & '$Exe' --type note --content - --title 'Clipboard note' --tags clipped`""
Add-Verb "HKCU:\Software\Classes\Directory\Background\shell\TheVault.Note" "Save clipboard note to TheVault" $ClipCmd

Write-Host "TheVault context menu installed (VAULT_URL=$VaultUrl). Restart Explorer if entries don't show yet."
