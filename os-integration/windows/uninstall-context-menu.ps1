#Requires -Version 5.1
<# Removes Enthymio right-click entries (per-user). #>
$ErrorActionPreference = "Continue"

Remove-Item -Path "HKCU:\Software\Classes\SystemFileAssociations\image\shell\Enthymio.Save" -Recurse -Force
Remove-Item -Path "HKCU:\Software\Classes\SystemFileAssociations\video\shell\Enthymio.Save" -Recurse -Force
Remove-Item -Path "HKCU:\Software\Classes\SystemFileAssociations\audio\shell\Enthymio.Save" -Recurse -Force
Remove-Item -Path "HKCU:\Software\Classes\InternetShortcut\shell\Enthymio.Save" -Recurse -Force
Remove-Item -Path "HKCU:\Software\Classes\Directory\Background\shell\Enthymio.Note" -Recurse -Force

Write-Host "Enthymio context menu removed."
