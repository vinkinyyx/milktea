$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath('D:\Workspace\TapTap\奶茶挤挤')
$taskArchive = [IO.Path]::GetFullPath('D:\Workspace\TapTap\_cleanup-backups\奶茶挤挤-20261105-project-cleanup')
$taskEvidence = Join-Path $taskRoot 'evidence\maintenance\20261105-project-cleanup'
$targets = @('docs/development/spill-revive/01-delivery-review.md','docs/development/spill-revive/05-execution-prompt.md','docs/development/spill-revive/06-qa-prompt.md','docs/development/animation-start-physics/01-review.md','docs/development/animation-start-physics/05-build-delivery.md','docs/development/animation-start-physics/06-execution-prompt.md','docs/development/animation-start-physics/07-qa-prompt.md','docs/development/animation-start-physics/08-acceptance-report.md')
foreach ($relative in $targets) {
    $source = [IO.Path]::GetFullPath((Join-Path $taskRoot $relative))
    $dest = [IO.Path]::GetFullPath((Join-Path $taskArchive $relative))
    if (-not $source.StartsWith($taskRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or -not $dest.StartsWith($taskArchive + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Out of scope' }
    if (Test-Path -LiteralPath $dest) { throw "Archive collision $relative" }
    $file = Get-Item -LiteralPath $source
    $hash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
    New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force | Out-Null
    Move-Item -LiteralPath $source -Destination $dest
    if ((Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash.ToLowerInvariant() -ne $hash) { throw 'Hash mismatch' }
    Add-Content -LiteralPath (Join-Path $taskEvidence 'archive-files.jsonl') -Encoding utf8 -Value (@{path=$relative;bytes=$file.Length;sha256=$hash} | ConvertTo-Json -Compress)
    Add-Content -LiteralPath (Join-Path $taskEvidence 'execution.jsonl') -Encoding utf8 -Value (@{action='archive';path=$relative;status='PASS';files=1;bytes=$file.Length;reason='Superseded review/execution prompt; current prompt retained with latest review'} | ConvertTo-Json -Compress)
}
Write-Output 'Archived 8 superseded review/prompt documents'
