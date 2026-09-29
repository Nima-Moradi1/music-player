param([string]$JavaHome, [string]$AndroidSdk, [string]$Drive = 'M', [string[]]$Tasks = @('assembleDebug', 'testDebugUnitTest'))
$ErrorActionPreference = 'Stop'
$workspacePath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if ($Drive -notmatch '^[D-Z]$') { throw 'Use an available drive letter D through Z.' }
$driveName = $Drive + ':'
$aliasRoot = $driveName + '\'
$mapping = subst | Where-Object { $_.StartsWith($driveName + '\:') }
if ($mapping -and -not $mapping.EndsWith($workspacePath)) { throw 'The requested drive alias belongs to another directory.' }
if (-not $mapping) {
  if (Test-Path -LiteralPath $aliasRoot) { throw 'The requested drive already exists.' }
  subst $driveName $workspacePath
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the workspace drive alias.' }
}
if ($JavaHome) { $env:JAVA_HOME = $JavaHome }
if ($AndroidSdk) { $env:ANDROID_HOME = $AndroidSdk }
if (-not $env:JAVA_HOME -or -not $env:ANDROID_HOME) { throw 'Set JAVA_HOME and ANDROID_HOME or pass JavaHome and AndroidSdk.' }
$env:MUSIC_PLAYER_SHORT_ROOT = $aliasRoot
$cachePath = Join-Path $workspacePath 'app\android\build\generated\autolinking\autolinking.json'
if (Test-Path -LiteralPath $cachePath) { Remove-Item -LiteralPath $cachePath }
$ErrorActionPreference = 'Continue' # Windows PowerShell 5 treats ordinary native stderr as errors.
& (Join-Path $env:JAVA_HOME 'bin\java.exe') '-Dorg.gradle.appname=gradlew' -jar (Join-Path $aliasRoot 'app\android\gradle\wrapper\gradle-wrapper.jar') -p (Join-Path $aliasRoot 'app\android') @Tasks '-PreactNativeArchitectures=x86_64' '--console=plain'
exit $LASTEXITCODE
