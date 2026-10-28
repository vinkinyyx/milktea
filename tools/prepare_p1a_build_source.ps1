param(
  [Parameter(Mandatory=$true)][string]$BuildId,
  [Parameter(Mandatory=$true)][string]$EvidenceDir
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$source = (Resolve-Path (Join-Path $root 'client')).Path
$targetRoot = 'D:/cocos-p1a-build-source'
$target = Join-Path $targetRoot $BuildId
$evidence = Join-Path $root $EvidenceDir
if ($BuildId -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') { throw 'BuildId must be ASCII-safe.' }
if (Test-Path -LiteralPath $target) { throw "Build source already exists; preserve it and choose another BuildId: $target" }
New-Item -ItemType Directory -Force -Path $targetRoot,$evidence | Out-Null
$startedAt = [DateTimeOffset]::Now.ToString('o')
$excluded = @('temp','library','build','local')
& robocopy.exe $source $target /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /XJ /XD (Join-Path $source 'temp') (Join-Path $source 'library') (Join-Path $source 'build') (Join-Path $source 'local')
$copyCode = $LASTEXITCODE
if ($copyCode -ge 8) { throw "robocopy failed with exit code $copyCode" }
$sourceFiles = Get-ChildItem -LiteralPath $source -Recurse -File -Force | Where-Object {
  $relative = $_.FullName.Substring($source.Length).TrimStart('\')
  -not ($excluded | Where-Object { $relative.StartsWith($_ + '\', [StringComparison]::OrdinalIgnoreCase) })
}
$sourceHashes = [System.Collections.Generic.Dictionary[string,string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($file in $sourceFiles) {
  $relative = $file.FullName.Substring($source.Length).TrimStart('\')
  $sourceHashes[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
}
$targetHashes = [System.Collections.Generic.Dictionary[string,string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($file in Get-ChildItem -LiteralPath $target -Recurse -File -Force) {
  $relative = $file.FullName.Substring($target.Length).TrimStart('\')
  $targetHashes[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
}
$missing = @($sourceHashes.Keys | Where-Object { -not $targetHashes.ContainsKey($_) })
$extra = @($targetHashes.Keys | Where-Object { -not $sourceHashes.ContainsKey($_) })
$changed = @($sourceHashes.Keys | Where-Object { $targetHashes.ContainsKey($_) -and $sourceHashes[$_] -cne $targetHashes[$_] })
$verified = $missing.Count -eq 0 -and $extra.Count -eq 0 -and $changed.Count -eq 0
$record = [ordered]@{ source=$source; target=$target; startedAt=$startedAt; finishedAt=[DateTimeOffset]::Now.ToString('o'); robocopyExitCode=$copyCode; excluded=$excluded; sourceFileCount=$sourceHashes.Count; targetFileCount=$targetHashes.Count; verified=$verified; missing=$missing; extra=$extra; changed=$changed; sourceHashes=$sourceHashes; targetHashes=$targetHashes }
$record | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $evidence 'build-source-copy.json') -Encoding utf8
if (-not $verified) { throw 'Isolated source copy hash verification failed; preserve the copy and inspect build-source-copy.json.' }
Write-Output $target
