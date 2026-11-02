param([string]$DeviceId, [string]$ApkPath, [int]$ApiPort=18120, [int]$ClientPort=18120)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path $PSScriptRoot -Parent
if(!$ApkPath) { $ApkPath=Join-Path $repoRoot 'mobile\android\app\build\outputs\apk\localDemo\app-localDemo.apk' }
$ApkPath=(Resolve-Path -LiteralPath $ApkPath).Path
if($env:ANDROID_HOME) { $adb=Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe' }
else { $adb=(Get-Command adb.exe -ErrorAction Stop).Source }
if($ApiPort -lt 1024 -or $ApiPort -gt 65535 -or $ClientPort -lt 1024 -or $ClientPort -gt 65535) {throw 'Invalid local API port.'}
$health=Invoke-RestMethod "http://127.0.0.1:$ApiPort/actuator/health" -TimeoutSec 5
if($health.status -ne 'UP') {throw 'Start the local backend first with scripts/run-local.ps1.'}
& $adb start-server | Out-Null
$connected=@((& $adb devices) | ForEach-Object {if($_ -match '^(\S+)\s+device\s*$') {$Matches[1]}})
if(!$DeviceId) {
    if($connected.Count -ne 1) {throw 'Connect one authorized Android device or provide -DeviceId. Accept USB debugging on the phone yourself if prompted.'}
    $DeviceId=$connected[0]
}
if($connected -notcontains $DeviceId) {throw 'Selected device is not connected/authorized. Check the USB confirmation on the device.'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[IO.Compression.ZipFile]::OpenRead($ApkPath)
try {
    $abis=@($zip.Entries | ForEach-Object {if($_.FullName -match '^lib/([^/]+)/.*\.so$') {$Matches[1]}} | Sort-Object -Unique)
    if(!($zip.Entries.FullName -contains 'assets/index.android.bundle')) {throw 'This launcher requires the bundled localDemo APK; a debug APK still needs Metro.'}
} finally {$zip.Dispose()}
$deviceAbis=((& $adb -s $DeviceId shell getprop ro.product.cpu.abilist) | Out-String).Trim().Split(',')
if(!@($deviceAbis | Where-Object {$abis -contains $_}).Count) {throw 'APK architectures do not match this device. Build arm64-v8a for most phones or x86_64 for the emulator.'}
& $adb -s $DeviceId reverse "tcp:$ClientPort" "tcp:$ApiPort"
if($LASTEXITCODE -ne 0) {throw 'Could not establish the local USB connection.'}
& $adb -s $DeviceId install -r $ApkPath
if($LASTEXITCODE -ne 0) {throw 'Installation failed. Check the phone confirmation/signature; no app data was removed.'}
& $adb -s $DeviceId shell am start -n com.workspheremobile/.MainActivity
if($LASTEXITCODE -ne 0) {throw 'Could not launch WorkSphere.'}
Write-Host 'Bundled WorkSphere opened without Metro. Keep USB connected to the local backend; demo credentials belong to the backend checkout.'
