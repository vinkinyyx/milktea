param(
  [string]$EvidenceDir = "evidence/P1-A/20261027-p1a-foundation",
  [string]$AttemptId = "core-$(Get-Date -Format 'yyyyMMddHHmmssfff')"
)
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$OutputDir = Join-Path $Root 'temp/p1a-core'
$EvidencePath = Join-Path $Root $EvidenceDir
$AttemptDir = Join-Path (Join-Path $EvidencePath 'attempts') $AttemptId
if (Test-Path -LiteralPath $AttemptDir) { throw "Core-check attempt exists; choose a new AttemptId: $AttemptId" }
New-Item -ItemType Directory -Force -Path $OutputDir, $AttemptDir | Out-Null

Push-Location $Root
try {
  $Compiler = Join-Path $Root 'client/node_modules/.bin/tsc.cmd'
  if (-not (Test-Path -LiteralPath $Compiler)) { throw 'Missing pinned TypeScript; run npm ci in client first.' }
  & $Compiler --target ES2020 --module commonjs --strict --skipLibCheck --rootDir client/assets/scripts --outDir $OutputDir client/assets/scripts/core/ConfigLoader.ts client/assets/scripts/core/Clock.ts client/assets/scripts/physics/CoordinateMapper.ts client/assets/scripts/physics/CupGeometry.ts client/assets/scripts/physics/CupSweepProbe.ts client/assets/scripts/contracts/types.ts client/assets/scripts/presentation/ArtCatalog.ts client/assets/scripts/debug/LabPauseGate.ts client/assets/scripts/debug/LabProbe.ts client/assets/scripts/debug/NineSizeQueueLedger.ts
  if ($LASTEXITCODE -ne 0) { throw "TypeScript core check failed with exit code $LASTEXITCODE" }
  $NodeOutput = node client/validation/p1a-core-check.cjs
  $NodeExitCode = $LASTEXITCODE
  $NodeOutput | ForEach-Object { Write-Output $_ }
  $JsonText = ($NodeOutput -join [Environment]::NewLine) + [Environment]::NewLine
  [System.IO.File]::WriteAllText((Join-Path $AttemptDir 'core-logic-results.json'), $JsonText, [System.Text.UTF8Encoding]::new($false))
  if ($NodeExitCode -ne 0) { throw "Core assertions failed with exit code $NodeExitCode" }
}
finally { Pop-Location }
