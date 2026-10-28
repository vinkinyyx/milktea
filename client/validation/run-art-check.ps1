param([string]$EvidenceDir = 'evidence/progress-2026-10-27-art-binding')
$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
& (Join-Path $PSScriptRoot 'run-core-check.ps1') -EvidenceDir $EvidenceDir
if ($LASTEXITCODE -ne 0) { throw 'Core verification failed' }
Push-Location $ProjectRoot
try {
  $ResultText = node client/validation/art-binding-check.cjs
  $CheckExitCode = $LASTEXITCODE
  $ResultText | ForEach-Object { Write-Output $_ }
  [System.IO.File]::WriteAllText((Join-Path $ProjectRoot "$EvidenceDir/art-binding-results.json"), ($ResultText -join [Environment]::NewLine) + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
  if ($CheckExitCode -ne 0) { throw "Art verification failed: $CheckExitCode" }
}
finally { Pop-Location }
