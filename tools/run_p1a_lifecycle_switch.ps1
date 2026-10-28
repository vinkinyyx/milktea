param(
  [Parameter(Mandatory=$true)][string]$BuildId,
  [Parameter(Mandatory=$true)][string]$EvidenceDir,
  [Parameter(Mandatory=$true)][string]$BaseUrl,
  [string]$Session = 'p1a-final',
  [string]$AttemptId = "life-$(Get-Date -Format 'yyyyMMddHHmmssfff')",
  [ValidateRange(1,600)][int]$DurationSeconds = 5
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$evidence = Join-Path $root $EvidenceDir
$attempts = Join-Path $evidence 'attempts'; $rawRoot = Join-Path $evidence 'raw'
$attemptDir = Join-Path $attempts $AttemptId
if ((Test-Path -LiteralPath $attemptDir) -or (Test-Path -LiteralPath (Join-Path $rawRoot $AttemptId))) { throw "Attempt already exists: $AttemptId" }
New-Item -ItemType Directory -Force -Path $attemptDir,(Join-Path $rawRoot $AttemptId) | Out-Null
$rawAttempt = Join-Path $rawRoot $AttemptId
$node = (Get-Command node.exe -ErrorAction Stop).Source
$npxEntry = 'C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js'
if (-not (Test-Path -LiteralPath $npxEntry)) { throw "npm exec entry is missing: $npxEntry" }
function Invoke-PlaywrightCli([string[]]$Arguments) {
  $info = [Diagnostics.ProcessStartInfo]::new(); $info.FileName = $node; $info.UseShellExecute = $false
  $info.RedirectStandardOutput = $true; $info.RedirectStandardError = $true
  foreach ($arg in @($npxEntry,'--yes','@playwright/cli') + $Arguments) { [void]$info.ArgumentList.Add($arg) }
  $proc = [Diagnostics.Process]::new(); $proc.StartInfo = $info
  if (-not $proc.Start()) { throw 'Could not start Playwright CLI.' }
  $outTask = $proc.StandardOutput.ReadToEndAsync(); $errTask = $proc.StandardError.ReadToEndAsync(); $proc.WaitForExit()
  return [pscustomobject]@{ ExitCode=$proc.ExitCode; Stdout=$outTask.GetAwaiter().GetResult(); Stderr=$errTask.GetAwaiter().GetResult() }
}
function Save-CommandResult([string]$Name,$Result) {
  $Result.Stdout | Set-Content -LiteralPath (Join-Path $rawAttempt "$Name.stdout.txt") -Encoding utf8
  $Result.Stderr | Set-Content -LiteralPath (Join-Path $rawAttempt "$Name.stderr.txt") -Encoding utf8
  if ($Result.ExitCode -ne 0) { throw "$Name failed with CLI exit $($Result.ExitCode); preserve raw output at $rawAttempt" }
}
$uri = [UriBuilder]::new($BaseUrl)
$query = @("p1aCase=lifecycle-smoke","attemptId=$([Uri]::EscapeDataString($AttemptId))",
  "expectedBuildId=$([Uri]::EscapeDataString($BuildId))","durationMs=$($DurationSeconds*1000)",
  "probeVersion=p1a-probe-v2","p1aProbe=off")
$uri.Query = $query -join '&'
$goto = Invoke-PlaywrightCli @("-s=$Session",'goto',$uri.Uri.AbsoluteUri)
if ($goto.ExitCode -ne 0 -and ($goto.Stdout + $goto.Stderr) -match "browser .* is not open") {
  $open = Invoke-PlaywrightCli @("-s=$Session",'open',$uri.Uri.AbsoluteUri,'--headed'); Save-CommandResult 'open' $open
} else { Save-CommandResult 'goto' $goto }
$prepare = Invoke-PlaywrightCli @("-s=$Session",'--raw','run-code','--filename',(Join-Path $PSScriptRoot 'p1a-lifecycle-prepare.js')); Save-CommandResult 'prepare' $prepare
$tabNew = Invoke-PlaywrightCli @("-s=$Session",'tab-new','about:blank'); Save-CommandResult 'tab-new' $tabNew
$helper = Invoke-PlaywrightCli @("-s=$Session",'--raw','run-code','--filename',(Join-Path $PSScriptRoot 'p1a-lifecycle-helper.js')); Save-CommandResult 'helper-focus' $helper
Start-Sleep -Seconds $DurationSeconds
$tabs = Invoke-PlaywrightCli @("-s=$Session",'tab-list'); Save-CommandResult 'tab-list' $tabs
$targetPattern = "(?m)^\s*-\s*(\d+):.*attemptId=$([regex]::Escape($AttemptId))"
$helperPattern = '(?m)^\s*-\s*(\d+):.*\(about:blank\)'
$targetTab = [regex]::Match($tabs.Stdout,$targetPattern)
$helperTab = [regex]::Match($tabs.Stdout,$helperPattern)
if (-not $targetTab.Success) { throw "Could not find lifecycle target tab; see $rawAttempt/tab-list.stdout.txt" }
if (-not $helperTab.Success) { throw "Could not find helper tab; see $rawAttempt/tab-list.stdout.txt" }
$select = Invoke-PlaywrightCli @("-s=$Session",'tab-select',$targetTab.Groups[1].Value); Save-CommandResult 'tab-select-target' $select
$read = Invoke-PlaywrightCli @("-s=$Session",'--raw','run-code','--filename',(Join-Path $PSScriptRoot 'p1a-lifecycle-read.js')); Save-CommandResult 'read-target' $read
$readJson = $read.Stdout | ConvertFrom-Json
$prepareJson = $prepare.Stdout | ConvertFrom-Json
$close = Invoke-PlaywrightCli @("-s=$Session",'tab-close',$helperTab.Groups[1].Value); Save-CommandResult 'tab-close-helper' $close
$hidden = @($readJson.capture | Where-Object { $_.visibility -eq 'hidden' })
$hostHidden = @($readJson.lifecycle.events | Where-Object { $_.source -eq 'dom' -and $_.hidden -eq $true -and $_.trusted -eq $true })
$hostShown = @($readJson.lifecycle.events | Where-Object { $_.source -eq 'dom' -and $_.hidden -eq $false -and $_.trusted -eq $true })
$samePhysics = $hidden.Count -gt 0 -and $readJson.status.tick -eq $hidden[0].tick -and $readJson.status.stepCount -eq $hidden[0].stepCount
$record = [ordered]@{ schemaVersion=1; caseId='LIFE-01-real-tab-switch-smoke'; buildId=$BuildId; attemptId=$AttemptId;
  targetUrl=$uri.Uri.AbsoluteUri; durationSeconds=$DurationSeconds; protocol='Playwright CLI tab-new/tab-select real tab switch';
  focusEmulationDisabledForTargetAndHelper=$true; syntheticEventsUsed=$false; prepare=$prepareJson; helper=$helper.Stdout | ConvertFrom-Json;
  targetAfterReturn=$readJson; hiddenCaptureCount=$hidden.Count; trustedDomHideCount=$hostHidden.Count; trustedDomShowCount=$hostShown.Count;
  tickAndStepFrozenThroughHidden=$samePhysics; tabList=$tabs.Stdout; status=if ($hidden.Count -gt 0 -and $hostHidden.Count -gt 0 -and $hostShown.Count -gt 0 -and $samePhysics) { 'PASS' } else { 'FAIL' };
  blockingReason=if ($hidden.Count -eq 0) { 'REAL_TAB_SWITCH_DID_NOT_PRODUCE_TRUSTED_HIDDEN' } elseif (-not $samePhysics) { 'PHYSICS_TICK_OR_STEP_CHANGED_DURING_HIDDEN_INTERVAL' } else { $null };
  recordedAt=[DateTimeOffset]::Now.ToString('o') }
$record | ConvertTo-Json -Depth 16 | Set-Content -LiteralPath (Join-Path $attemptDir 'lifecycle-attempt.json') -Encoding utf8
$record | ConvertTo-Json -Depth 16
