param(
  [Parameter(Mandatory=$true)][string]$BuildId,
  [string]$EvidenceDir = "evidence/P1-A/$BuildId",
  [int]$Port = 8777,
  [string]$BuildRoot = 'D:/cocos-p1a-build'
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$build = (Resolve-Path -LiteralPath (Join-Path $BuildRoot $BuildId)).Path
$evidence = Join-Path $root $EvidenceDir
$expectedPrefix = [IO.Path]::GetFullPath($BuildRoot).TrimEnd('\') + '\'
if (-not $build.StartsWith($expectedPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw "Build root is outside expected directory: $build" }
if (-not (Test-Path -LiteralPath (Join-Path $build 'index.html')) -or -not (Test-Path -LiteralPath (Join-Path $build 'src/settings.json'))) { throw "Incomplete Web Mobile output: $build" }
if ($Port -lt 1024 -or $Port -gt 65535) { throw 'Port must be in 1024..65535.' }
New-Item -ItemType Directory -Force -Path $evidence | Out-Null
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
try { $listener.Start() } catch { throw "127.0.0.1:$Port is already occupied; choose another port. $_" } finally { $listener.Stop() }
$python = (Get-Command python.exe -ErrorAction Stop).Source
$outLog = Join-Path $evidence 'http-server.log'; $errLog = Join-Path $evidence 'http-server-error.log'
$process = Start-Process -FilePath $python -ArgumentList @('-m','http.server',"$Port",'--bind','127.0.0.1','--directory',$build) `
  -PassThru -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog
$serverPid = $process.Id
$deadline = [DateTime]::UtcNow.AddSeconds(15); $responseStatus = $null
while ([DateTime]::UtcNow -lt $deadline) {
  if ($process.HasExited) { throw "HTTP server exited early with code $($process.ExitCode)." }
  try { $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -TimeoutSec 2 -UseBasicParsing; $responseStatus = [int]$response.StatusCode; break } catch { Start-Sleep -Milliseconds 200 }
}
if ($responseStatus -ne 200) { throw "Local HTTP server did not answer 200 at 127.0.0.1:$Port." }
$record = [ordered]@{ buildId=$BuildId; pid=$serverPid; host='127.0.0.1'; port=$Port; root=$build; url="http://127.0.0.1:$Port/"; status=$responseStatus; startedAt=[DateTimeOffset]::Now.ToString('o'); processCapture='Diagnostics.Process'; outputHash=(Get-FileHash -LiteralPath (Join-Path $build 'index.html') -Algorithm SHA256).Hash.ToLowerInvariant() }
$record | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $evidence 'http-server.json') -Encoding utf8
$record | ConvertTo-Json -Depth 5
