param(
  [Parameter(Mandatory=$true)][ValidateSet('LIFE-01','LIFE-02','LIFE-03','LIFE-04','LIFE-05','LIFE-06','LIFE-07','LIFE-08','LIFE-09-QUEUE','LIFE-09-REBUILD','LIFE-10')][string]$CaseId,
  [Parameter(Mandatory=$true)][string]$AttemptId,
  [string]$BuildId = '20261029-p1a-final-14',
  [string]$BaseUrl = 'http://127.0.0.1:8784/',
  [string]$Session = 'p1a-final14',
  [string]$CliPackage = '@playwright/cli@0.1.22',
  [string]$EvidenceDir = 'evidence/P1-A/20261029-p1a-final-14',
  [int]$DurationMs = 0
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if ($AttemptId -notmatch '^[A-Za-z0-9._-]+$') { throw 'AttemptId must be ASCII-safe.' }
$evidence = Join-Path $projectRoot $EvidenceDir
$attemptPath = Join-Path $evidence "attempts/$AttemptId"
if (Test-Path -LiteralPath $attemptPath) { throw "Preserve existing attempt: $attemptPath" }
New-Item -ItemType Directory -Path $attemptPath | Out-Null
$node = (Get-Command node.exe -ErrorAction Stop).Source
$npmEntry = 'C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js'
$runner = Join-Path $PSScriptRoot 'p1a-lifecycle-real-case.js'
$attemptRunner = Join-Path $attemptPath 'runner.js'
Copy-Item -LiteralPath $runner -Destination $attemptRunner
$uri = [UriBuilder]::new($BaseUrl)
$uri.Query = "p1aCase=$CaseId&attemptId=$AttemptId&expectedBuildId=$BuildId&probeVersion=p1a-probe-v2&p1aProbe=off" + $(if ($DurationMs -gt 0) { "&durationMs=$DurationMs" } else { '' })
function Invoke-P1ACli([string[]]$Arguments) {
  $info = [Diagnostics.ProcessStartInfo]::new()
  $info.FileName = $node; $info.UseShellExecute = $false; $info.CreateNoWindow = $true
  $info.RedirectStandardOutput = $true; $info.RedirectStandardError = $true
  foreach ($arg in @($npmEntry, '--yes', $CliPackage, "-s=$Session", '--raw') + $Arguments) { [void]$info.ArgumentList.Add($arg) }
  $proc = [Diagnostics.Process]::new(); $proc.StartInfo = $info
  if (-not $proc.Start()) { throw 'Could not start Playwright CLI.' }
  $out = $proc.StandardOutput.ReadToEndAsync(); $err = $proc.StandardError.ReadToEndAsync()
  $proc.WaitForExit()
  return @{ exitCode=$proc.ExitCode; stdout=$out.GetAwaiter().GetResult(); stderr=$err.GetAwaiter().GetResult() }
}
$start = [DateTimeOffset]::Now.ToString('o')
$navigation = Invoke-P1ACli @('goto', $uri.Uri.AbsoluteUri)
$navigation | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $attemptPath 'navigation.json') -Encoding utf8
if ($navigation.exitCode -ne 0) { throw 'Navigation failed; see preserved navigation.json.' }
$execution = Invoke-P1ACli @('run-code', '--filename', $attemptRunner)
[IO.File]::WriteAllText((Join-Path $attemptPath 'stdout.log'), $execution.stdout, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $attemptPath 'stderr.log'), $execution.stderr, [Text.UTF8Encoding]::new($false))
$result = $null; $parseError = $null
try { $result = $execution.stdout | ConvertFrom-Json -ErrorAction Stop } catch { $parseError = $_.Exception.Message }
if ($null -ne $result) { $result | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath (Join-Path $attemptPath 'result.json') -Encoding utf8 }
$record = [ordered]@{ schemaVersion=1; caseId=$CaseId; attemptId=$AttemptId; buildId=$BuildId; url=$uri.Uri.AbsoluteUri;
  startedAt=$start; finishedAt=[DateTimeOffset]::Now.ToString('o'); cliExitCode=$execution.exitCode; parseError=$parseError;
  toolSha256=(Get-FileHash -LiteralPath $attemptRunner -Algorithm SHA256).Hash.ToLowerInvariant(); cliPackage=$CliPackage; pass=$result.pass;
  originalFocusSessionDisabled=$true; syntheticEventsUsed=$false }
$record | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $attemptPath 'metadata.json') -Encoding utf8
@{ caseId=$CaseId; attemptId=$AttemptId; pass=$result.pass; checks=$result.checks; error=$result.error; parseError=$parseError;
   resultFile=(Join-Path $attemptPath 'result.json') } | ConvertTo-Json -Depth 5
if ($execution.exitCode -ne 0 -or $null -eq $result -or $result.pass -ne $true) { throw "Lifecycle attempt failed: $AttemptId" }
