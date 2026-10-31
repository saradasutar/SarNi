# SarNi safe GitHub cleanup — only for a LOCAL GitHub Desktop clone.
# Example: powershell -NoProfile -File .\Remove-Old-SarNi-Files.ps1
# After verifying the proposed files: powershell -NoProfile -File .\Remove-Old-SarNi-Files.ps1 -Apply
param([switch]$Apply,[switch]$IncludeOptional)
$ErrorActionPreference='Stop'
if (!(Test-Path '.git') -or !(Test-Path 'index.html') -or !(Test-Path 'app-v20-10-3.js')) {
 Write-Error 'STOP: Open the cloned SarNi repository root and first upload v20.10.3. No files removed.'
 exit 1
}
$index = Get-Content -Path 'index.html' -Raw
if ($index -notmatch 'app-v20-10-3\.js') {
 Write-Error 'STOP: index.html does not load app-v20-10-3.js. No files removed.'
 exit 1
}
$base=@('app-v20-10-0.js',
'app-v20-10-1.js',
'app-v20-10-2.js',
'app-v20-7-0.js',
'app-v20-8-10.js',
'app-v20-8-11.js',
'app-v20-8-12.js',
'app-v20-8-13.js',
'app-v20-8-14.js',
'app-v20-8-16.js',
'app-v20-8-17.js',
'app-v20-8-18.js',
'app-v20-8-19.js',
'app-v20-8-3.js',
'app-v20-8-6.js',
'app-v20-8-7.js',
'app-v20-8-8.js',
'app-v20-8-9.js',
'app-v20-9-0.js',
'app-v20-9-1.js',
'app-v20-9-2.js',
'sarni-diary-knowledge-v1.css',
'sarni-diary-knowledge-v1.js',
'sarni-family-planner-v20-8-15.css',
'sarni-family-planner-v20-8-15.js',
'sarni-security-storage - Copy.js',
'sarni-ux-v20-9-1.css',
'sarni-ux-v20-9-1.js',
'smart-paste-v20-8-3.js')
if ($IncludeOptional) { $base += @('DIRECT-HOSTING-20261017.md',
'HISTORY-SEARCH-v20.9.2.md',
'INSTALL-FIRST.md',
'INSTALL-LIVE-STEPS.txt',
'INSTALL_v20.10.3.md',
'IndexApp.html',
'QA_RESULTS.md',
'QUALITY-CHECK.md',
'QUALITY_REVIEW_v20.9.2.md',
'README-FIRST.txt',
'RELEASE_20.10.0.md',
'RELEASE_20.10.1.md',
'RELEASE_20.10.2.md',
'RELEASE_v20.9.1.md',
'SARNI-20.8.8-RELEASE.md',
'SarNi_FE_One_Click_ZIP_Maker.html',
'TEST-RESULTS.md',
'github-direct-preview.html',
'index-backup-20261017-before-delight.html',
'launcher-recovery-20261016.html',
'mobile-preview.png',
'mobile-quick-add.png',
'preview.html',
'repair-login.html',
'small-mobile-preview.png') }
$present=@($base | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf })
Write-Host ('Found ' + $present.Count + ' obsolete files. mode: ' + $(if($Apply){'APPLY'}else{'PREVIEW ONLY'}))
$present | ForEach-Object { Write-Host (' - ' + $_) }
if (!$Apply) { Write-Host 'No files deleted. Rerun with -Apply to delete the above from the local clone.'; exit 0 }
foreach ($file in $present) { Remove-Item -LiteralPath $file -Force }
Write-Host 'Local deletion complete. Review Changes in GitHub Desktop, then Commit and Push.'
