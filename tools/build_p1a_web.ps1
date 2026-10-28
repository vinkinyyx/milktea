param(
  [Parameter(Mandatory=$true)][string]$BuildId,
  [Parameter(Mandatory=$true)][string]$EvidenceDir,
  [string]$ProjectPath = (Join-Path $PSScriptRoot '../client'),
  [string]$CreatorPath = 'C:/ProgramData/cocos/editors/Creator/3.8.8/CocosCreator.exe'
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$client = (Resolve-Path -LiteralPath $ProjectPath).Path
$evidence = Join-Path $root $EvidenceDir
$buildRoot = 'D:/cocos-p1a-build'
$output = Join-Path $buildRoot $BuildId
if ($BuildId -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') { throw 'BuildId must be ASCII-safe.' }
$creator = (Resolve-Path -LiteralPath $CreatorPath).Path
if (-not (Test-Path -LiteralPath $client)) { throw 'Client project is missing.' }
if (Test-Path -LiteralPath $output) { throw "Build output already exists; preserve it and choose a new BuildId: $output" }
foreach ($prior in @('creator-exit.json','build-stdout.log','build-stderr.log','creator-process-tree.jsonl','creator-kill-trace.jsonl')) {
  if (Test-Path -LiteralPath (Join-Path $evidence $prior)) { throw "Build evidence already exists; preserve it and choose a new BuildId/EvidenceDir: $prior" }
}
New-Item -ItemType Directory -Force -Path $evidence, $buildRoot | Out-Null
$bootMeta = Get-Content -LiteralPath (Join-Path $client 'assets/scenes/Boot.scene.meta') -Raw | ConvertFrom-Json
$sceneUuid = $bootMeta.uuid
$buildOptions = "platform=web-mobile;debug=true;buildPath=$($buildRoot.Replace('\','/'));outputName=$BuildId;startScene=$sceneUuid"
$startedAt = [DateTimeOffset]::Now.ToString('o')
$processTreePath = Join-Path $evidence 'creator-process-tree.jsonl'
$killTracePath = Join-Path $evidence 'creator-kill-trace.jsonl'
$creatorAsar = Join-Path (Split-Path -Parent $creator) 'resources/app.asar'
$parentNodeOptionsBefore = [string][Environment]::GetEnvironmentVariable('NODE_OPTIONS','Process')
$parentBridgeBefore = [string][Environment]::GetEnvironmentVariable('MILKTEA_DISABLE_EDITOR_BRIDGE','Process')
$process = $null
$treeProcess = $null
$killTraceProcess = $null
$debugPort = 0
try {
  $portProbe = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
  $portProbe.Start(); $debugPort = ([Net.IPEndPoint]$portProbe.LocalEndpoint).Port; $portProbe.Stop()
  $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = $creator
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  [void]$startInfo.ArgumentList.Add("--remote-debugging-port=$debugPort")
  [void]$startInfo.ArgumentList.Add('--remote-allow-origins=*')
  [void]$startInfo.ArgumentList.Add('--project')
  [void]$startInfo.ArgumentList.Add($client)
  [void]$startInfo.ArgumentList.Add('--build')
  [void]$startInfo.ArgumentList.Add($buildOptions)
  $startInfo.Environment['MILKTEA_DISABLE_EDITOR_BRIDGE'] = '1'
  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $startInfo
  $stdoutTask = $null
  $stderrTask = $null
  if (-not $process.Start()) { throw 'Could not start the Creator build process.' }
  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()
  $creatorPid = $process.Id
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  $killTraceInfo = [Diagnostics.ProcessStartInfo]::new(); $killTraceInfo.FileName = $node; $killTraceInfo.UseShellExecute = $false
  [void]$killTraceInfo.ArgumentList.Add((Join-Path $root 'tools/creator-renderer-kill-trace.cjs'))
  [void]$killTraceInfo.ArgumentList.Add([string]$debugPort); [void]$killTraceInfo.ArgumentList.Add($killTracePath)
  $killTraceProcess = [Diagnostics.Process]::new(); $killTraceProcess.StartInfo = $killTraceInfo
  [void]$killTraceProcess.Start()
  $treeInfo = [Diagnostics.ProcessStartInfo]::new(); $treeInfo.FileName = (Get-Command pwsh.exe -ErrorAction Stop).Source; $treeInfo.UseShellExecute = $false
  [void]$treeInfo.ArgumentList.Add('-NoProfile'); [void]$treeInfo.ArgumentList.Add('-File')
  [void]$treeInfo.ArgumentList.Add((Join-Path $root 'tools/observe_p1a_creator_processes.ps1'))
  [void]$treeInfo.ArgumentList.Add('-RootPid'); [void]$treeInfo.ArgumentList.Add([string]$creatorPid)
  [void]$treeInfo.ArgumentList.Add('-OutputPath'); [void]$treeInfo.ArgumentList.Add($processTreePath)
  $treeProcess = [Diagnostics.Process]::new(); $treeProcess.StartInfo = $treeInfo
  [void]$treeProcess.Start()
  $process.WaitForExit()
  $stdout = $stdoutTask.GetAwaiter().GetResult()
  $stderr = $stderrTask.GetAwaiter().GetResult()
  Set-Content -LiteralPath (Join-Path $evidence 'build-stdout.log') -Value $stdout -Encoding utf8
  Set-Content -LiteralPath (Join-Path $evidence 'build-stderr.log') -Value $stderr -Encoding utf8
  $actualExitCode = $process.ExitCode
  $parentNodeOptionsAfter = [string][Environment]::GetEnvironmentVariable('NODE_OPTIONS','Process')
  $parentBridgeAfter = [string][Environment]::GetEnvironmentVariable('MILKTEA_DISABLE_EDITOR_BRIDGE','Process')
  if ($null -ne $treeProcess -and -not $treeProcess.HasExited) { [void]$treeProcess.WaitForExit(5000) }
  $killTraceFinished = $false
  if ($null -ne $killTraceProcess -and -not $killTraceProcess.HasExited) { $killTraceFinished = $killTraceProcess.WaitForExit(5000) }
  if ($null -ne $killTraceProcess -and -not $killTraceProcess.HasExited) { $killTraceProcess.Kill(); $killTraceProcess.WaitForExit() }
  $record = [ordered]@{ buildId=$BuildId; command="`"$creator`" --remote-debugging-port=$debugPort --remote-allow-origins=* --project `"$client`" --build `"$buildOptions`""; creatorPid=$creatorPid; startedAt=$startedAt; finishedAt=[DateTimeOffset]::Now.ToString('o'); exitCode=$actualExitCode; bridgeDisabled='1 in Creator-only environment'; processTreePath=$processTreePath; treeCaptureExitCode=if ($treeProcess -and $treeProcess.HasExited) { $treeProcess.ExitCode } else { $null }; killTracePath=$killTracePath; killTraceExitCode=if ($killTraceProcess -and $killTraceProcess.HasExited) { $killTraceProcess.ExitCode } else { $null }; killTraceFinishedNaturally=$killTraceFinished; debugPort=$debugPort; parentNodeOptionsBefore=$parentNodeOptionsBefore; parentNodeOptionsAfter=$parentNodeOptionsAfter; parentBridgeBefore=$parentBridgeBefore; parentBridgeAfter=$parentBridgeAfter; creatorAsarPath=$creatorAsar; creatorAsarSha256=(Get-FileHash -LiteralPath $creatorAsar -Algorithm SHA256).Hash.ToLowerInvariant(); outputPath=$output; projectPath=$client; processCapture='System.Diagnostics.Process retained handle, WaitForExit and ExitCode' }
  $record | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $evidence 'creator-exit.json') -Encoding utf8
  if ($actualExitCode -ne 36) { throw "Creator build exited $actualExitCode, expected 36. Preserve logs and partial output." }
  foreach ($required in @('index.html','src/settings.json','assets')) {
    if (-not (Test-Path -LiteralPath (Join-Path $output $required))) { throw "Build output missing $required" }
  }
} finally {
  if ($null -ne $process) { $process.Dispose() }
  if ($null -ne $treeProcess) { $treeProcess.Dispose() }
  if ($null -ne $killTraceProcess) { $killTraceProcess.Dispose() }
}
