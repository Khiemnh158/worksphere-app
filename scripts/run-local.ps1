param(
    [string]$PgBinPath,
    [string]$DbUser = 'postgres',
    [int]$DbPort = 5432,
    [string]$DbName = 'worksphere_web_local',
    [int]$ApiPort = 18120,
    [int]$WebPort = 18110,
    [string]$MavenPath,
    [string]$MavenRepository,
    [switch]$Stop
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$localRoot = Join-Path $repoRoot '.local'
$processFile = Join-Path $localRoot 'processes.json'
function Owned-Process($entry) {
    $candidate = Get-Process -Id $entry.id -ErrorAction SilentlyContinue
    if ($candidate -and $candidate.StartTime.ToUniversalTime().Ticks.ToString() -eq $entry.startTicks) { return $candidate }
    return $null
}
if (Test-Path $processFile) {
    $saved = Get-Content $processFile -Raw | ConvertFrom-Json
    if ($saved.repoRoot -ne $repoRoot) { throw 'Process record belongs to another checkout; no process was stopped.' }
    if ($Stop) {
        foreach ($entry in $saved.processes) {
            $owned = Owned-Process $entry
            if ($owned) { Stop-Process -Id $owned.Id }
        }
        Write-Host 'Stopped the application processes recorded by this checkout. PostgreSQL and data were kept.'
        return
    }
    $running = @($saved.processes | ForEach-Object { Owned-Process $_ } | Where-Object { $null -ne $_ })
    if ($running.Count -eq 2) {
        try {
            $health = Invoke-RestMethod "http://127.0.0.1:$($saved.apiPort)/actuator/health" -TimeoutSec 3
            $front = Invoke-WebRequest "http://127.0.0.1:$($saved.webPort)/" -UseBasicParsing -TimeoutSec 3
            if ($health.status -eq 'UP' -and $front.StatusCode -eq 200) {
                Write-Host "Already running: http://127.0.0.1:$($saved.webPort)/. Local demo credentials: .local/accounts.txt"
                return
            }
        } catch { }
        throw 'Recorded application is not ready. Inspect .local logs; use -Stop before restarting this checkout.'
    }
    if ($running.Count -gt 0) { throw 'Only part of this checkout is running. Inspect logs or use -Stop.' }
}
if ($Stop) { Write-Host 'No live application processes recorded by this checkout.'; return }
if ($DbName -notmatch '^worksphere_web[a-z0-9_]*$') { throw 'Use a dedicated lowercase local database named worksphere_web…' }
foreach ($port in @($DbPort, $ApiPort, $WebPort)) { if ($port -lt 1024 -or $port -gt 65535) { throw 'Ports must be between 1024 and 65535.' } }
if (@($DbPort,$ApiPort,$WebPort | Select-Object -Unique).Count -ne 3) { throw 'Database, API and web ports must differ.' }
foreach ($port in @($ApiPort,$WebPort)) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw "Port $port is in use. Choose another port; no unrelated process was stopped." }
}
$node = (Get-Command node.exe -ErrorAction Stop).Source
$java = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin\java.exe' } else { (Get-Command java.exe -ErrorAction Stop).Source }
$javaInfo = (& $java -version 2>&1 | Out-String)
if ($javaInfo -notmatch 'version "(?<major>\d+)') { throw 'Cannot determine Java version.' }
if ([int]$Matches.major -lt 21) { throw 'Install JDK 21 or newer; backend compilation target is Java 21.' }
$nodeInfo = & $node --version
if ($nodeInfo -notmatch '^v24\.') { throw 'Use Node 24, as specified by mobile/package.json.' }
$psql = if ($PgBinPath) { Join-Path $PgBinPath 'psql.exe' } else { (Get-Command psql.exe -ErrorAction Stop).Source }
if (!$MavenPath) { $MavenPath = Join-Path $repoRoot 'backend\mvnw.cmd' }
New-Item -ItemType Directory -Path $localRoot -Force | Out-Null
$runtimeFile = Join-Path $localRoot 'runtime.json'
if (!(Test-Path $runtimeFile)) {
    @{jwt=([guid]::NewGuid().ToString('N')+[guid]::NewGuid().ToString('N')); demoPassword=([guid]::NewGuid().ToString('N')+'aA1!'); dbName=$DbName; dbPort=$DbPort; databaseInitialized=$false} |
        ConvertTo-Json | Set-Content -LiteralPath $runtimeFile -Encoding UTF8
}
$secrets = Get-Content $runtimeFile -Raw | ConvertFrom-Json
if ($secrets.dbName -ne $DbName -or $secrets.dbPort -ne $DbPort) { throw 'This checkout is bound to another local database. Use its original database settings or a separate checkout.' }
$dbPassword = $env:WORKSPHERE_DB_PASSWORD
if (!$dbPassword) {
    $secure = Read-Host 'PostgreSQL password (kept in this process only)' -AsSecureString
    $dbPassword = [System.Net.NetworkCredential]::new('', $secure).Password
}
$oldPgPassword = $env:PGPASSWORD
try {
    $env:PGPASSWORD = $dbPassword
    $exists = & $psql -h 127.0.0.1 -p $DbPort -U $DbUser -d postgres -At -c "SELECT 1 FROM pg_database WHERE datname='$DbName'"
    if ($LASTEXITCODE -ne 0) { throw 'Cannot connect to local PostgreSQL. Start it and check the database credentials.' }
    if ($exists -eq '1' -and !$secrets.databaseInitialized) { throw 'Database already exists and is not owned by this setup. Choose a new dedicated database name before first setup.' }
    if ($exists -ne '1') {
        & $psql -h 127.0.0.1 -p $DbPort -U $DbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DbName"
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the dedicated demo database.' }
    }
    $secrets.databaseInitialized = $true
    $secrets | ConvertTo-Json | Set-Content -LiteralPath $runtimeFile -Encoding UTF8
} finally { $env:PGPASSWORD = $oldPgPassword }
$mavenArgs = @('-DskipTests','package')
if ($MavenRepository) { $mavenArgs = @("-Dmaven.repo.local=$MavenRepository") + $mavenArgs }
Push-Location (Join-Path $repoRoot 'backend')
try {
    & $MavenPath @mavenArgs *> (Join-Path $localRoot 'build.log')
    if ($LASTEXITCODE -ne 0) { throw 'Backend build failed. See .local/build.log.' }
} finally { Pop-Location }
$env:SPRING_PROFILES_ACTIVE = 'dev'
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://127.0.0.1:$DbPort/$DbName"
$env:SPRING_DATASOURCE_USERNAME = $DbUser
$env:SPRING_DATASOURCE_PASSWORD = $dbPassword
$env:WORKSPHERE_JWT_SECRET = $secrets.jwt
$env:WORKSPHERE_STORAGE_PATH = Join-Path $localRoot 'uploads'
$env:WORKSPHERE_WEB_DEMO_ENABLED = 'true'
$env:WORKSPHERE_WEB_DEMO_PASSWORD = $secrets.demoPassword
$env:WORKSPHERE_DEV_E2E_USER_ENABLED = 'false'
$env:WORKSPHERE_NOTIFICATION_SCHEDULING_ENABLED = 'false'
$env:WORKSPHERE_PEOPLE_SCHEDULING_ENABLED = 'false'
$env:WORKSPHERE_MAIL_LOCAL_ENABLED = 'true'
$env:WORKSPHERE_MAIL_LOCAL_PATH = Join-Path $localRoot 'mailbox'
$env:WORKSPHERE_PUBLIC_URL = "http://127.0.0.1:$WebPort"
$env:WORKSPHERE_PREVIEW_PORT = $WebPort.ToString()
$env:WORKSPHERE_BACKEND_PORT = $ApiPort.ToString()
$started = @()
$ready = $false
try {
    $jar = Join-Path $repoRoot 'backend\target\worksphere-web.jar'
    $started += Start-Process -FilePath $java -ArgumentList @('-Xms64m','-Xmx512m','-jar',('"'+$jar+'"'),"--server.port=$ApiPort",'--server.address=127.0.0.1') -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $localRoot 'backend.log') -RedirectStandardError (Join-Path $localRoot 'backend.error.log')
    $preview = Join-Path $PSScriptRoot 'preview-ui.mjs'
    $started += Start-Process -FilePath $node -ArgumentList ('"'+$preview+'"') -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $localRoot 'web.log') -RedirectStandardError (Join-Path $localRoot 'web.error.log')
    $metadata = @{repoRoot=$repoRoot; apiPort=$ApiPort; webPort=$WebPort; processes=@($started | ForEach-Object { @{id=$_.Id; startTicks=$_.StartTime.ToUniversalTime().Ticks.ToString()} })}
    $metadata | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $processFile -Encoding UTF8
    for ($attempt=0; $attempt -lt 45; $attempt++) {
        try {
            $health = Invoke-RestMethod "http://127.0.0.1:$ApiPort/actuator/health" -TimeoutSec 2
            $front = Invoke-WebRequest "http://127.0.0.1:$WebPort/" -UseBasicParsing -TimeoutSec 2
            if ($health.status -eq 'UP' -and $front.StatusCode -eq 200) { $ready=$true; break }
        } catch { }
        Start-Sleep -Seconds 1
    }
    if (!$ready) { throw 'Local app did not become ready. See .local backend/web logs.' }
    $accounts = "Local demo only - http://127.0.0.1:$WebPort/`nPassword: $($secrets.demoPassword)`nAdmin: admin.web`nExecutive: giamdoc.web`nIT manager: hung.it`nEmployees: hai.it, lan.it`nHR/time specialist: thao.hc`nOther accounts: ngoc.kd, minh.kd, linh.kd, mai.hc, an.hc`n"
    [IO.File]::WriteAllText((Join-Path $localRoot 'accounts.txt'),$accounts,[Text.UTF8Encoding]::new($false))
    Write-Host "Ready: http://127.0.0.1:$WebPort/. Demo credentials: .local/accounts.txt; test mailbox: .local/mailbox."
} finally {
    if (!$ready) {
        foreach ($process in $started) {
            $current = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
            if ($current -and $current.StartTime -eq $process.StartTime) { Stop-Process -Id $current.Id }
        }
    }
    $env:SPRING_DATASOURCE_PASSWORD = $null
    $env:WORKSPHERE_WEB_DEMO_PASSWORD = $null
    $env:WORKSPHERE_JWT_SECRET = $null
}
