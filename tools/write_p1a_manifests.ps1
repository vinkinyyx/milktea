param(
  [Parameter(Mandatory=$true)][string]$BuildId,
  [Parameter(Mandatory=$true)][string]$EvidenceDir,
  [Parameter(Mandatory=$true)][string]$ProjectPath,
  [Parameter(Mandatory=$true)][string]$OutputPath,
  [string]$CreatorPath = 'C:/ProgramData/cocos/editors/Creator/3.8.8/CocosCreator.exe'
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$project = (Resolve-Path -LiteralPath $ProjectPath).Path
$output = (Resolve-Path -LiteralPath $OutputPath).Path
$evidence = Join-Path $root $EvidenceDir
if (-not (Test-Path -LiteralPath (Join-Path $output 'index.html'))) { throw "Build output is incomplete: $output" }
New-Item -ItemType Directory -Force -Path $evidence | Out-Null

$sourceFiles = Get-ChildItem -LiteralPath $project -Recurse -File -Force | Where-Object {
  $relative = $_.FullName.Substring($project.Length).TrimStart('\')
  $relative.StartsWith('assets\',[StringComparison]::OrdinalIgnoreCase) -or
  $relative.StartsWith('settings\',[StringComparison]::OrdinalIgnoreCase) -or
  $relative.StartsWith('extensions\',[StringComparison]::OrdinalIgnoreCase) -or
  $relative -match '^(package\.json|package-lock\.json|tsconfig\.json|project\.json|\.npmrc)$' -or
  $relative.StartsWith('profiles\',[StringComparison]::OrdinalIgnoreCase)
} | Sort-Object FullName
$sourceInventory = foreach ($file in $sourceFiles) {
  [ordered]@{ path=$file.FullName.Substring($project.Length).TrimStart('\').Replace('\','/'); size=$file.Length;
    sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
}
$creator = (Resolve-Path -LiteralPath $CreatorPath).Path
$asar = Join-Path (Split-Path -Parent $creator) 'resources/app.asar'
$creatorInfo = Get-Item -LiteralPath $creator
$engineRoot = Join-Path (Split-Path -Parent $creator) 'resources/resources/3d/engine'
$box2dPackage = Get-Content -LiteralPath (Join-Path $engineRoot 'node_modules/@cocos/box2d/package.json') -Raw | ConvertFrom-Json
$sourceManifest = [ordered]@{ schemaVersion=2; buildId=$BuildId; projectPath=$project; creatorPath=$creator;
  creatorProductVersion=$creatorInfo.VersionInfo.ProductVersion; creatorFileVersion=$creatorInfo.VersionInfo.FileVersion;
  cocosEngineBox2dPackageVersion=$box2dPackage.version;
  creatorAsarSha256=(Get-FileHash -LiteralPath $asar -Algorithm SHA256).Hash.ToLowerInvariant(); sourceFileCount=@($sourceInventory).Count; files=@($sourceInventory) }
$sourceManifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $evidence 'source-manifest.json') -Encoding utf8

$builtFiles = Get-ChildItem -LiteralPath $output -Recurse -File -Force | Sort-Object FullName
$buildInventory = foreach ($file in $builtFiles) {
  [ordered]@{ path=$file.FullName.Substring($output.Length).TrimStart('\').Replace('\','/'); size=$file.Length;
    sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
}
$buildManifest = [ordered]@{ schemaVersion=2; buildId=$BuildId; platform='web-mobile'; outputPath=$output;
  sourceManifest='source-manifest.json'; fileCount=@($buildInventory).Count; files=@($buildInventory) }
$buildManifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $evidence 'build-manifest.json') -Encoding utf8

$runtimeScripts = Get-ChildItem -LiteralPath $output -Recurse -File -Filter '*.js' -Force
$identityParts = foreach ($scriptFile in $runtimeScripts) { Get-Content -LiteralPath $scriptFile.FullName -Raw }
$identity = $identityParts -join "`n"
$box2dVersionMatches = [regex]::Match($identity,'b2_version=new b2Version\((\d+),(\d+),(\d+)\)')
$box2dCommitMatch = [regex]::Match($identity,'b2_commit="([0-9a-f]+)"')
$runtimeIdentity = [ordered]@{ requestedBuildId=$BuildId; embeddedBuildIdPresent=$identity.Contains($BuildId);
  cocosBox2dPackageVersion=$box2dPackage.version;
  bundledBox2dCoreVersion=if ($box2dVersionMatches.Success) { "{0}.{1}.{2}" -f $box2dVersionMatches.Groups[1].Value,$box2dVersionMatches.Groups[2].Value,$box2dVersionMatches.Groups[3].Value } else { $null };
  bundledBox2dCommit=if ($box2dCommitMatch.Success) { $box2dCommitMatch.Groups[1].Value } else { $null };
  embeddedCandidates=([regex]::Matches($identity,'202610\d{2}-p1a-[A-Za-z0-9._-]+') | ForEach-Object Value | Sort-Object -Unique);
  indexHtmlSha256=(Get-FileHash -LiteralPath (Join-Path $output 'index.html') -Algorithm SHA256).Hash.ToLowerInvariant();
  applicationSha256=(Get-FileHash -LiteralPath (Join-Path $output 'application.js') -Algorithm SHA256).Hash.ToLowerInvariant();
  scriptSettingsSha256=(Get-FileHash -LiteralPath (Join-Path $output 'src/settings.json') -Algorithm SHA256).Hash.ToLowerInvariant() }
$runtimeIdentity | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $evidence 'build-identity-static.json') -Encoding utf8
if (-not $runtimeIdentity.embeddedBuildIdPresent) { throw "Embedded runtime buildId mismatch. Candidates: $($runtimeIdentity.embeddedCandidates -join ', ')" }
