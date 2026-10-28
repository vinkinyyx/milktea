param(
  [Parameter(Mandatory=$true)][string]$BuildId,
  [Parameter(Mandatory=$true)][string]$EvidenceDir,
  [Parameter(Mandatory=$true)][string]$CaseId,
  [Parameter(Mandatory=$true)][string]$BaseUrl,
  [string]$Session = 'p1a-final',
  [string]$AttemptId = "$CaseId-$(Get-Date -Format 'yyyyMMddHHmmssfff')",
  [ValidateSet('off','light','summary','legacy')][string]$Probe = 'off',
  [int]$DurationMs = 5000
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$evidence = Join-Path $root $EvidenceDir
$attempts = Join-Path $evidence 'attempts'; $rawRoot = Join-Path $evidence 'raw'
New-Item -ItemType Directory -Force -Path $attempts,$rawRoot | Out-Null
$artifactDir = Join-Path $rawRoot $AttemptId
if ((Test-Path -LiteralPath $artifactDir) -or (Test-Path -LiteralPath (Join-Path $attempts "$AttemptId.json"))) { throw "Attempt already exists; use a new AttemptId to preserve prior evidence: $AttemptId" }
New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null
$uri = [UriBuilder]::new($BaseUrl)
$pairs = @("p1aCase=$([Uri]::EscapeDataString($CaseId))", "attemptId=$([Uri]::EscapeDataString($AttemptId))",
  "expectedBuildId=$([Uri]::EscapeDataString($BuildId))",
  "durationMs=$DurationMs",
  "probeVersion=p1a-probe-v2", "p1aProbe=$([Uri]::EscapeDataString($Probe))", "artifactDir=$([Uri]::EscapeDataString($artifactDir.Replace('\','/')))" )
if ($uri.Query) { $uri.Query = $uri.Query.TrimStart('?') + '&' + ($pairs -join '&') } else { $uri.Query = $pairs -join '&' }
$node = (Get-Command node.exe -ErrorAction Stop).Source
$npxEntry = 'C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js'
if (-not (Test-Path -LiteralPath $npxEntry)) { throw "npm exec entry is missing: $npxEntry" }
function Invoke-PlaywrightCli([string[]]$Arguments) {
  $info = [Diagnostics.ProcessStartInfo]::new(); $info.FileName = $node; $info.UseShellExecute = $false
  $info.RedirectStandardOutput = $true; $info.RedirectStandardError = $true
  [void]$info.ArgumentList.Add($npxEntry); [void]$info.ArgumentList.Add('--yes'); [void]$info.ArgumentList.Add('@playwright/cli')
  foreach ($arg in $Arguments) { [void]$info.ArgumentList.Add($arg) }
  $proc = [Diagnostics.Process]::new(); $proc.StartInfo = $info
  if (-not $proc.Start()) { throw 'Could not start Playwright CLI.' }
  $stdoutTask = $proc.StandardOutput.ReadToEndAsync(); $stderrTask = $proc.StandardError.ReadToEndAsync(); $proc.WaitForExit()
  return [pscustomobject]@{ ExitCode=$proc.ExitCode; Stdout=$stdoutTask.GetAwaiter().GetResult(); Stderr=$stderrTask.GetAwaiter().GetResult() }
}
$goto = Invoke-PlaywrightCli @("-s=$Session",'goto',$uri.Uri.AbsoluteUri)
if ($goto.ExitCode -ne 0 -and ($goto.Stderr + $goto.Stdout) -match "browser .* is not open") {
  $open = Invoke-PlaywrightCli @("-s=$Session",'open',$uri.Uri.AbsoluteUri,'--headed')
  if ($open.ExitCode -ne 0) { throw "Playwright browser startup failed: $($open.Stderr) $($open.Stdout)" }
} elseif ($goto.ExitCode -ne 0) { throw "Playwright navigation failed: $($goto.Stderr) $($goto.Stdout)" }
$runner = Join-Path $PSScriptRoot 'p1a-runtime-case.js'
$execution = Invoke-PlaywrightCli @("-s=$Session",'--raw','run-code','--filename',$runner)
$execution.Stdout | Set-Content -LiteralPath (Join-Path $attempts "$AttemptId.stdout.log") -Encoding utf8
$execution.Stderr | Set-Content -LiteralPath (Join-Path $attempts "$AttemptId.stderr.log") -Encoding utf8
$rawJson = Join-Path $attempts "$AttemptId.json"
[IO.File]::WriteAllText($rawJson, $execution.Stdout + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
$caseResult = $null; $caseResultParseError = $null
try { $caseResult = $execution.Stdout | ConvertFrom-Json -ErrorAction Stop } catch { $caseResultParseError = $_.Exception.Message }
if ($null -ne $caseResult) { $caseResult | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath (Join-Path $attempts "$AttemptId.result.json") -Encoding utf8 }
$record = [ordered]@{ caseId=$CaseId; attemptId=$AttemptId; buildId=$BuildId; embeddedBuildId=$caseResult.buildId; expectedBuildId=$BuildId;
  probe=$Probe; url=$uri.Uri.AbsoluteUri; cliExitCode=$execution.ExitCode; acceptance=$caseResult.acceptance; pass=$caseResult.pass;
  resultParseError=$caseResultParseError; stderr=$execution.Stderr; artifacts=$artifactDir; recordedAt=[DateTimeOffset]::Now.ToString('o');
  playwrightCommand="node $npxEntry --yes @playwright/cli -s=$Session --raw run-code --filename $runner" }
$record | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $attempts "$AttemptId.metadata.json") -Encoding utf8
if ($execution.ExitCode -ne 0) { throw "Playwright case failed; raw attempt preserved at $(Join-Path $attempts "$AttemptId.json")" }
if ($null -ne $caseResult -and $caseResult.pass -eq $false) { throw "Acceptance FAIL for $CaseId; raw attempt preserved at $(Join-Path $attempts "$AttemptId.result.json")" }
$record | ConvertTo-Json -Depth 12
