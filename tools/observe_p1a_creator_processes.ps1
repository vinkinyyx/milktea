param(
  [Parameter(Mandatory=$true)][int]$RootPid,
  [Parameter(Mandatory=$true)][string]$OutputPath
)
$ErrorActionPreference = 'Stop'
$seen = @{}
$missing = @{}
$started = [DateTimeOffset]::Now
$lastDescendantAt = [DateTime]::UtcNow
$deadline = [DateTime]::UtcNow.AddMinutes(3)
while ([DateTime]::UtcNow -lt $deadline) {
  $all = Get-CimInstance Win32_Process
  $ids = [System.Collections.Generic.HashSet[int]]::new(); [void]$ids.Add($RootPid)
  $changed = $true
  while ($changed) {
    $changed = $false
    foreach ($process in $all) {
      if ($ids.Contains([int]$process.ParentProcessId) -and $ids.Add([int]$process.ProcessId)) { $changed = $true }
    }
  }
  foreach ($processId in @($ids)) {
    $process = $all | Where-Object { [int]$_.ProcessId -eq $processId } | Select-Object -First 1
    if (-not $process) { continue }
    $lastDescendantAt = [DateTime]::UtcNow
    $key = [string]$processId
    $signature = "$($process.CreationDate)|$($process.ParentProcessId)|$($process.Name)|$($process.CommandLine)"
    if (-not $seen.ContainsKey($key)) {
      $row = [ordered]@{ at=[DateTimeOffset]::Now.ToString('o'); event='process-seen'; pid=$processId;
        ppid=[int]$process.ParentProcessId; name=$process.Name; creationDate=$process.CreationDate; commandLine=$process.CommandLine }
      Add-Content -LiteralPath $OutputPath -Value ($row | ConvertTo-Json -Compress -Depth 5)
      $seen[$key] = @{ signature=$signature; last=$row }
    } elseif ($seen[$key].signature -cne $signature) {
      $row = [ordered]@{ at=[DateTimeOffset]::Now.ToString('o'); event='process-command-update'; pid=$processId;
        ppid=[int]$process.ParentProcessId; name=$process.Name; creationDate=$process.CreationDate; commandLine=$process.CommandLine }
      Add-Content -LiteralPath $OutputPath -Value ($row | ConvertTo-Json -Compress -Depth 5)
      $seen[$key] = @{ signature=$signature; last=$row }
    }
    $missing.Remove($key)
  }
  foreach ($key in @($seen.Keys)) {
    if ($ids.Contains([int]$key) -or $missing.ContainsKey($key)) { continue }
    $last = $seen[$key].last
    $row = [ordered]@{ at=[DateTimeOffset]::Now.ToString('o'); event='process-exit-observed'; pid=[int]$key;
      ppid=$last.ppid; name=$last.name; creationDate=$last.creationDate; exitStatus=$null;
      capture='Win32_Process polling; process disappeared, OS exit status and signal unavailable' }
    Add-Content -LiteralPath $OutputPath -Value ($row | ConvertTo-Json -Compress -Depth 5)
    $missing[$key] = $true
  }
  $rootAlive = $ids.Contains($RootPid) -and @($all | Where-Object { [int]$_.ProcessId -eq $RootPid }).Count -gt 0
  if (-not $rootAlive -and [DateTime]::UtcNow -gt $lastDescendantAt.AddSeconds(2)) { break }
  Start-Sleep -Milliseconds 50
}
$summary = [ordered]@{ rootPid=$RootPid; started=$started.ToString('o'); finished=[DateTimeOffset]::Now.ToString('o');
  capturedProcessCount=$seen.Count; disappearedProcessCount=$missing.Count; pollingIntervalMs=50;
  exitStatusAvailable=$false; wmiStopSubscription='access denied in this process token; polling fallback used' }
$summary | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath ($OutputPath + '.summary.json') -Encoding utf8
