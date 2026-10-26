param(
  [string]$EvidenceDir = "evidence/P1-A/20261027-p1a-foundation"
)
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$OutputDir = Join-Path $Root 'temp/p1a-core'
$EvidencePath = Join-Path $Root $EvidenceDir
New-Item -ItemType Directory -Force -Path $OutputDir, $EvidencePath | Out-Null

Push-Location $Root
try {
  npm exec --yes --package=typescript@5.4.5 -- tsc --target ES2020 --module commonjs --strict --skipLibCheck --rootDir client/assets/scripts --outDir $OutputDir client/assets/scripts/core/ConfigLoader.ts client/assets/scripts/core/Clock.ts client/assets/scripts/physics/CoordinateMapper.ts client/assets/scripts/physics/CupGeometry.ts client/assets/scripts/contracts/types.ts
  if ($LASTEXITCODE -ne 0) { throw "TypeScript core check failed with exit code $LASTEXITCODE" }
  $NodeOutput = node client/validation/p1a-core-check.cjs
  $NodeExitCode = $LASTEXITCODE
  $NodeOutput | ForEach-Object { Write-Output $_ }
  $JsonText = ($NodeOutput -join [Environment]::NewLine) + [Environment]::NewLine
  [System.IO.File]::WriteAllText((Join-Path $EvidencePath 'core-logic-results.json'), $JsonText, [System.Text.UTF8Encoding]::new($false))
  if ($NodeExitCode -ne 0) { throw "Core assertions failed with exit code $NodeExitCode" }
}
finally { Pop-Location }
