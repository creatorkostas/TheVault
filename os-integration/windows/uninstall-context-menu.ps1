#Requires -Version 5.1
<# Removes TheVault right-click entries (per-user). #>
$ErrorActionPreference = "Continue"

Remove-Item -Path "HKCU:\Software\Classes\SystemFileAssociations\image\shell\TheVault.Save" -Recurse -Force
Remove-Item -Path "HKCU:\Software\Classes\SystemFileAssociations\video\shell\TheVault.Save" -Recurse -Force
Remove-Item -Path "HKCU:\Software\Classes\SystemFileAssociations\audio\shell\TheVault.Save" -Recurse -Force
Remove-Item -Path "HKCU:\Software\Classes\InternetShortcut\shell\TheVault.Save" -Recurse -Force
Remove-Item -Path "HKCU:\Software\Classes\Directory\Background\shell\TheVault.Note" -Recurse -Force

Write-Host "TheVault context menu removed."
