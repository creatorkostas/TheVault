#Requires -Version 5.1
<#
  Installs Enthymio right-click entries (per-user, no admin):
  - Images / videos / audio files  ->  Save to Enthymio
  - .url shortcuts (links)         ->  Save link to Enthymio
  - Folder background              ->  Save clipboard as note
#>
param(
  [string]$EnthymioUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Exe = Join-Path $RepoRoot "dist\enthymio-save.exe"
if (-not (Test-Path $Exe)) {
  throw "Helper not found at $Exe. Build it first:  cd os-integration; go build -o ..\dist\enthymio-save.exe .\cmd\enthymio-save"
}

# Persist vault URL for Explorer-spawned processes
[Environment]::SetEnvironmentVariable("ENTHYMIO_URL", $EnthymioUrl, "User")
$env:ENTHYMIO_URL = $EnthymioUrl

function Add-Verb($Key, $Label, $Command) {
  New-Item -Path $Key -Force | Out-Null
  Set-ItemProperty -Path $Key -Name "(Default)" -Value $Label
  New-Item -Path "$Key\command" -Force | Out-Null
  Set-ItemProperty -Path "$Key\command" -Name "(Default)" -Value $Command
}

$SaveFile = "`"$Exe`" --file `"%1`" --tags clipped"
Add-Verb "HKCU:\Software\Classes\SystemFileAssociations\image\shell\Enthymio.Save" "Save to Enthymio" $SaveFile
Add-Verb "HKCU:\Software\Classes\SystemFileAssociations\video\shell\Enthymio.Save" "Save to Enthymio" $SaveFile
Add-Verb "HKCU:\Software\Classes\SystemFileAssociations\audio\shell\Enthymio.Save" "Save to Enthymio" $SaveFile

Add-Verb "HKCU:\Software\Classes\InternetShortcut\shell\Enthymio.Save" "Save link to Enthymio" `
  "`"$Exe`" --url-file `"%1`" --tags clipped"

$ClipCmd = "powershell.exe -NoProfile -WindowStyle Hidden -Command `"Get-Clipboard -Raw | & '$Exe' --type note --content - --title 'Clipboard note' --tags clipped`""
Add-Verb "HKCU:\Software\Classes\Directory\Background\shell\Enthymio.Note" "Save clipboard note to Enthymio" $ClipCmd

Write-Host "Enthymio context menu installed (ENTHYMIO_URL=$EnthymioUrl). Restart Explorer if entries don't show yet."
