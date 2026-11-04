$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath('D:\Workspace\TapTap\奶茶挤挤')
$taskEvidence = Join-Path $taskRoot 'evidence\maintenance\20261105-project-cleanup'
$taskPlan = Get-Content -LiteralPath (Join-Path $taskEvidence 'plan.json') -Raw | ConvertFrom-Json
$taskArchive = [IO.Path]::GetFullPath($taskPlan.archiveRoot)
$expectedArchive = [IO.Path]::GetFullPath('D:\Workspace\TapTap\_cleanup-backups\奶茶挤挤-20261105-project-cleanup')
if ($taskPlan.root -ne $taskRoot -or $taskArchive -ne $expectedArchive) { throw 'Unexpected workspace or archive scope' }
if (Test-Path -LiteralPath $taskArchive) { throw 'Archive already exists; refuse overwrite' }
function Assert-Child([string]$candidate, [string]$scope) {
    $resolved = [IO.Path]::GetFullPath($candidate)
    if (-not $resolved.StartsWith($scope + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Out of scope: $resolved" }
    return $resolved
}
$actionLog = Join-Path $taskEvidence 'execution.jsonl'
$hashLog = Join-Path $taskEvidence 'archive-files.jsonl'
function Record-Action($entry) { Add-Content -LiteralPath $actionLog -Value ($entry | ConvertTo-Json -Compress) -Encoding utf8 }
New-Item -ItemType Directory -Path $taskArchive | Out-Null
# Preserve active documentation before rewriting stale status/entry points.
$activeDocs = @('README.md','AGENTS.md','progress.md','docs\13-developer-handoff.md','docs\22-current-progress-and-resume.md','docs\38-taptap-minigame-current.md','docs\43-spill-revive-performance-design.md','docs\archive-location.md','output\taptap-upload\CURRENT-CANDIDATE.md','tools\README.md','奶茶挤挤\README.md')
foreach ($relative in $activeDocs) {
    $source = Assert-Child (Join-Path $taskRoot $relative) $taskRoot
    $dest = Assert-Child (Join-Path $taskArchive ('_active-docs-before-cleanup\' + $relative)) $taskArchive
    New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $dest
    if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash) { throw "Backup mismatch $relative" }
}
# Every archive is hash-verified before any reproducible output is deleted.
foreach ($action in @($taskPlan.actions | Where-Object action -eq 'archive')) {
    $source = Assert-Child (Join-Path $taskRoot $action.path) $taskRoot
    $dest = Assert-Child (Join-Path $taskArchive $action.path) $taskArchive
    $item = Get-Item -LiteralPath $source -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse target $source" }
    $items = if ($item.PSIsContainer) { @(Get-ChildItem -LiteralPath $source -Recurse -File -Force) } else { @($item) }
    $hashes = foreach ($file in $items) {
        $relative = $file.FullName.Substring($taskRoot.Length + 1)
        [PSCustomObject]@{path=$relative;bytes=$file.Length;sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
    }
    New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force | Out-Null
    if (Test-Path -LiteralPath $dest) { throw "Archive collision $dest" }
    Move-Item -LiteralPath $source -Destination $dest
    foreach ($file in $hashes) {
        $archived = Assert-Child (Join-Path $taskArchive $file.path) $taskArchive
        if ((Get-FileHash -LiteralPath $archived -Algorithm SHA256).Hash.ToLowerInvariant() -ne $file.sha256) { throw "Archive verification failed $archived" }
        Add-Content -LiteralPath $hashLog -Value ($file | ConvertTo-Json -Compress) -Encoding utf8
    }
    Record-Action @{action='archive';path=$action.path;status='PASS';files=$items.Count;bytes=($items | Measure-Object Length -Sum).Sum}
}
foreach ($action in @($taskPlan.actions | Where-Object action -eq 'delete')) {
    $source = Assert-Child (Join-Path $taskRoot $action.path) $taskRoot
    if (-not (Test-Path -LiteralPath $source)) { throw "Target disappeared before deletion: $source" }
    $item = Get-Item -LiteralPath $source -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse target $source" }
    # Full absolute path is checked above; deletion uses native PowerShell only.
    if ($item.PSIsContainer) { Remove-Item -LiteralPath $source -Recurse -Force } else { Remove-Item -LiteralPath $source -Force }
    if (Test-Path -LiteralPath $source) { throw "Target remains: $source" }
    Record-Action @{action='delete';path=$action.path;status='PASS'}
}
# Remove only empty generated containers left after retaining archived ZIPs.
foreach ($relative in @('build-artifacts\cocos-taptap-minigame-build','奶茶挤挤\packages','.screenshots','.codex\.tmp')) {
    $parent = Assert-Child (Join-Path $taskRoot $relative) $taskRoot
    if (-not (Test-Path -LiteralPath $parent)) { continue }
    $dirs = @(Get-ChildItem -LiteralPath $parent -Directory -Recurse -Force | Sort-Object { $_.FullName.Length } -Descending)
    foreach ($dir in $dirs) {
        $target = Assert-Child $dir.FullName $taskRoot
        if (@(Get-ChildItem -LiteralPath $target -Force).Count -eq 0) { Remove-Item -LiteralPath $target -Force }
    }
    if (@(Get-ChildItem -LiteralPath $parent -Force).Count -eq 0) { Remove-Item -LiteralPath $parent -Force }
}
$counts = Get-Content -LiteralPath $actionLog | ForEach-Object { $_ | ConvertFrom-Json } | Group-Object action | Select-Object Name,Count
$counts | ConvertTo-Json -Compress
