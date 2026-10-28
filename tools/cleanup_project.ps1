param(
    [string]$PlanPath = 'evidence/asset-supplement-2026-10-27/cleanup-plan.json'
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
$planAbsolute = [IO.Path]::GetFullPath((Join-Path $projectRoot $PlanPath))
if (-not $planAbsolute.StartsWith($projectRoot + '\evidence\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Cleanup plan must be inside project evidence.' }
$plan = Get-Content -LiteralPath $planAbsolute -Raw -Encoding utf8 | ConvertFrom-Json
$backupRoot = [IO.Path]::GetFullPath($plan.backup_root).TrimEnd('\')
$allowedBackup = [IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $projectRoot) '_cleanup-backups')).TrimEnd('\')
if (-not $backupRoot.StartsWith($allowedBackup + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Backup destination escaped the dedicated backup folder.' }
if (Test-Path -LiteralPath $backupRoot) { throw 'Backup already exists. Inspect any previous execution before proceeding.' }
$records = [Collections.Generic.List[object]]::new()
$entries = [Collections.Generic.List[object]]::new()
foreach ($entry in $plan.entries) {
    $source = [IO.Path]::GetFullPath($entry.source).TrimEnd('\')
    $destination = [IO.Path]::GetFullPath($entry.destination).TrimEnd('\')
    if (-not $source.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Source escaped project or targeted its root.' }
    if (-not $destination.StartsWith($backupRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Destination escaped verified backup root.' }
    $item = Get-Item -LiteralPath $source -Force
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Reparse-point cleanup target requires separate review.' }
    $children = if ($item.PSIsContainer) { @(Get-ChildItem -LiteralPath $source -Force -Recurse) } else { @($item) }
    if (@($children | Where-Object { ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0 }).Count -gt 0) { throw 'A cleanup tree contains a reparse point.' }
    $fileItems = @($children | Where-Object { -not $_.PSIsContainer })
    $entryBytes = 0L
    foreach ($file in $fileItems) {
        $absolute = [IO.Path]::GetFullPath($file.FullName)
        if (-not $absolute.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'File escaped project.' }
        $relative = $absolute.Substring($projectRoot.Length + 1)
        $archived = [IO.Path]::GetFullPath((Join-Path $backupRoot $relative))
        if (-not $archived.StartsWith($backupRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'File backup escaped root.' }
        $records.Add([pscustomobject]@{original=$relative.Replace('\','/'); archived=$archived; sha256=(Get-FileHash -LiteralPath $absolute -Algorithm SHA256).Hash.ToLowerInvariant(); bytes=$file.Length})
        $entryBytes += $file.Length
    }
    $entries.Add([pscustomobject]@{source=$source; destination=$destination; reason=$entry.reason; files=$fileItems.Count; bytes=$entryBytes})
}
$refreshed = [pscustomobject]@{project_root=$projectRoot; backup_root=$backupRoot; action='reversible_move_not_permanent_delete'; entries=@($entries.ToArray()); files=@($records.ToArray()); total_files=$records.Count; total_bytes=($records | Measure-Object -Property bytes -Sum).Sum}
$refreshed | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $planAbsolute -Encoding utf8
$null = New-Item -ItemType Directory -Path $backupRoot
Copy-Item -LiteralPath $planAbsolute -Destination (Join-Path $backupRoot 'cleanup-plan.json')
$moved = [Collections.Generic.List[object]]::new()
$executionPath = Join-Path (Split-Path -Parent $planAbsolute) 'cleanup-execution.json'
foreach ($entry in $entries) {
    if (Test-Path -LiteralPath $entry.destination) { throw 'Would overwrite backup content.' }
    $null = New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($entry.destination)) -Force
    Move-Item -LiteralPath $entry.source -Destination $entry.destination
    $moved.Add($entry)
    [pscustomobject]@{status='in_progress'; completed_entries=@($moved.ToArray()); backup_root=$backupRoot} | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $executionPath -Encoding utf8
}
foreach ($record in $records) {
    if (-not (Test-Path -LiteralPath $record.archived -PathType Leaf)) { throw 'Archived file missing.' }
    if ((Get-FileHash -LiteralPath $record.archived -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) { throw 'Archived file hash mismatch.' }
}
foreach ($entry in $entries) { if (Test-Path -LiteralPath $entry.source) { throw 'Cleanup source still exists.' } }
$result = [pscustomobject]@{status='pass'; action='reversible_move'; archived_files=$records.Count; archived_bytes=$refreshed.total_bytes; entries=$entries.Count; archive_hashes_verified=$records.Count; backup_root=$backupRoot; permanently_deleted_files=0}
$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $executionPath -Encoding utf8
Copy-Item -LiteralPath $executionPath -Destination (Join-Path $backupRoot 'cleanup-execution.json')
$result | ConvertTo-Json -Depth 8

