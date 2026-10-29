# WorkSphere - Local Environment Verification Script (Giai doan 1)
# Kiem tra cac cong cu phat trien can thiet theo tai lieu canonical

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  WorkSphere - Local Environment Audit (Stage 1)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Refresh PATH from registry if needed
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')

$results = [ordered]@{}

# Git Check
try {
    $gitVer = & git --version 2>$null
    if ($LASTEXITCODE -eq 0 -and $gitVer) {
        $results["Git"] = "OK: $gitVer"
    } else {
        $results["Git"] = "WARN: git command not in current PATH (Check 'C:\Program Files\Git\cmd')"
    }
} catch {
    $results["Git"] = "MISSING: Git CLI not found"
}

# Java Check
try {
    $javaVer = & java -version 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0 -and $javaVer) {
        $firstLine = ($javaVer -split "`n")[0].Trim()
        $results["Java (JDK)"] = "OK: $firstLine"
    } else {
        $results["Java (JDK)"] = "MISSING: Java runtime not found"
    }
} catch {
    $results["Java (JDK)"] = "MISSING: Java runtime not found"
}

# Node.js Check
try {
    $nodeVer = & node -v 2>$null
    if ($LASTEXITCODE -eq 0 -and $nodeVer) {
        $results["Node.js"] = "OK: $nodeVer"
    } else {
        $results["Node.js"] = "MISSING: Node.js not found"
    }
} catch {
    $results["Node.js"] = "MISSING: Node.js not found"
}

# npm Check
try {
    $npmVer = & npm.cmd -v 2>$null
    if ($LASTEXITCODE -eq 0 -and $npmVer) {
        $results["npm"] = "OK: $npmVer"
    } else {
        $results["npm"] = "MISSING: npm not found"
    }
} catch {
    $results["npm"] = "MISSING: npm not found"
}

# Docker Check
try {
    $dockerVer = & docker --version 2>$null
    if ($LASTEXITCODE -eq 0 -and $dockerVer) {
        $results["Docker CLI"] = "OK: $dockerVer"
    } else {
        $results["Docker CLI"] = "MISSING: Docker CLI not found"
    }
} catch {
    $results["Docker CLI"] = "MISSING: Docker CLI not found"
}

# Docker Compose Check
try {
    $composeVer = & docker compose version 2>$null
    if ($LASTEXITCODE -eq 0 -and $composeVer) {
        $results["Docker Compose"] = "OK: $composeVer"
    } else {
        $results["Docker Compose"] = "MISSING: Docker Compose not found"
    }
} catch {
    $results["Docker Compose"] = "MISSING: Docker Compose not found"
}

# Android SDK Check
$androidHome = [Environment]::GetEnvironmentVariable('ANDROID_HOME', 'User')
if (-not $androidHome) {
    $androidHome = "$env:LOCALAPPDATA\Android\Sdk"
}
if (Test-Path $androidHome) {
    $results["Android SDK (ANDROID_HOME)"] = "OK: $androidHome"
} else {
    $results["Android SDK (ANDROID_HOME)"] = "MISSING: Android SDK path not found"
}

# adb Check
$adbPath = "$androidHome\platform-tools\adb.exe"
if (Test-Path $adbPath) {
    $adbVer = & $adbPath version 2>$null | Select-Object -First 1
    $results["Android adb"] = "OK: $adbVer"
} else {
    $results["Android adb"] = "MISSING: adb.exe not found at $adbPath"
}

# Output Summary
Write-Host ""
foreach ($key in $results.Keys) {
    $val = $results[$key]
    if ($val -like "OK*") {
        Write-Host " [PASS] $key - $val" -ForegroundColor Green
    } elseif ($val -like "WARN*") {
        Write-Host " [WARN] $key - $val" -ForegroundColor Yellow
    } else {
        Write-Host " [FAIL] $key - $val" -ForegroundColor Red
    }
}
Write-Host ""
Write-Host "Verification complete." -ForegroundColor Cyan
