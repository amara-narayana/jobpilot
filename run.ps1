# ==============================================================================
# JobPilot One-Click Laptop Launcher
# ==============================================================================
param (
    [switch]$NoBrowser
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             JOBPILOT - ONE-CLICK LAUNCHER                " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Project Directory Anchor
$ProjectRoot = $PSScriptRoot
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path }
Set-Location $ProjectRoot

# 2. Add MSYS2 UCRT64 toolchain to PATH for Drogon and C++ runtime DLLs
$MsysPath = "C:\msys64\ucrt64\bin"
if (Test-Path $MsysPath) {
    $env:PATH = "$MsysPath;" + $env:PATH
    Write-Host "[OK] MSYS2 UCRT64 runtime toolchain active" -ForegroundColor Green
}

# 3. Ensure uploads and database/backups directories exist
New-Item -ItemType Directory -Force -Path "$ProjectRoot\uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "$ProjectRoot\database\backups" | Out-Null

# 4. Check or create .env configuration
$EnvFile = "$ProjectRoot\.env"
if (-not (Test-Path $EnvFile)) {
    Write-Host "[+] Creating .env from template..." -ForegroundColor Yellow
    if (Test-Path "$ProjectRoot\.env.example") {
        Copy-Item "$ProjectRoot\.env.example" $EnvFile
    } else {
        Set-Content -Path $EnvFile -Value "PORT=8080`nMYSQL_HOST=127.0.0.1`nMYSQL_PORT=3306`nMYSQL_USER=root`nMYSQL_PASSWORD=`nMYSQL_DATABASE=jobpilot`nMYSQL_POOL_SIZE=10"
    }
}

# Load .env into process environment
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line.Split("=", 2)
        [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), [System.EnvironmentVariableTarget]::Process)
    }
}

# 5. Verify MySQL Windows Service
$mysqlService = Get-Service -Name *mysql* -ErrorAction SilentlyContinue | Select-Object -First 1
if ($mysqlService) {
    if ($mysqlService.Status -ne 'Running') {
        Write-Host "[+] Starting MySQL Windows Service ($($mysqlService.Name))..." -ForegroundColor Yellow
        Start-Service $mysqlService.Name -ErrorAction SilentlyContinue
    }
    Write-Host "[OK] MySQL Service ($($mysqlService.Name)) is active" -ForegroundColor Green
}

# 6. Database Verification & Auto-Migration
$dbUser = $env:MYSQL_USER; if (-not $dbUser) { $dbUser = "root" }
$dbPass = $env:MYSQL_PASSWORD
$dbHost = $env:MYSQL_HOST; if (-not $dbHost) { $dbHost = "127.0.0.1" }
$dbPort = $env:MYSQL_PORT; if (-not $dbPort) { $dbPort = "3306" }
$dbName = $env:MYSQL_DATABASE; if (-not $dbName) { $dbName = "jobpilot" }

$mysqlCmd = "mysql"
$connArgs = @("-h", $dbHost, "-P", $dbPort, "-u", $dbUser)
if ($dbPass) { $connArgs += "-p$dbPass" }

$testConn = & $mysqlCmd $connArgs -e "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[!] Could not connect to MySQL with user '$dbUser'." -ForegroundColor Yellow
    Write-Host "[!] If your MySQL root user has a password, please enter it below." -ForegroundColor Yellow
    $promptPass = Read-Host "MySQL password for '$dbUser' (will be saved to .env)"
    $dbPass = $promptPass
    $env:MYSQL_PASSWORD = $dbPass

    # Save to .env
    $content = Get-Content $EnvFile
    if ($content -match '^MYSQL_PASSWORD=') {
        $content = $content -replace '^MYSQL_PASSWORD=.*', "MYSQL_PASSWORD=$dbPass"
    } else {
        $content += "MYSQL_PASSWORD=$dbPass"
    }
    $content | Set-Content $EnvFile

    $connArgs = @("-h", $dbHost, "-P", $dbPort, "-u", $dbUser)
    if ($dbPass) { $connArgs += "-p$dbPass" }
    $testConn = & $mysqlCmd $connArgs -e "SELECT 1;" 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] MySQL authentication verified" -ForegroundColor Green

    # Check if jobpilot database exists
    $checkDb = & $mysqlCmd $connArgs -e "SHOW DATABASES LIKE '$dbName';" 2>&1
    if ($checkDb -notmatch $dbName) {
        Write-Host "[+] Initializing '$dbName' database schema and sample data..." -ForegroundColor Cyan
        & $mysqlCmd $connArgs -e "CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        Get-Content "$ProjectRoot\database\schema\schema.sql" | & $mysqlCmd $connArgs $dbName
        Get-Content "$ProjectRoot\database\seeds\seeds.sql" | & $mysqlCmd $connArgs $dbName
        Write-Host "[OK] Database '$dbName' initialized with master schema and demo user (demo@jobpilot.io / Password123!)." -ForegroundColor Green
    } else {
        Write-Host "[OK] Database '$dbName' is ready" -ForegroundColor Green
    }
} else {
    Write-Host "[!] MySQL connection could not be established. Starting backend in standby mode." -ForegroundColor Yellow
}

# 7. Check / Build Backend Binary
$BackendExe = "$ProjectRoot\backend\build\jobpilot_server.exe"
if (-not (Test-Path $BackendExe)) {
    Write-Host "[+] Compiling C++ Drogon backend (first-time build)..." -ForegroundColor Cyan
    Set-Location "$ProjectRoot\backend"
    cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
    cmake --build build
    Set-Location $ProjectRoot
}
Write-Host "[OK] C++ Drogon Backend binary ready" -ForegroundColor Green

# 8. Check Frontend Dependencies
if (-not (Test-Path "$ProjectRoot\frontend\node_modules")) {
    Write-Host "[+] Installing frontend dependencies (npm install)..." -ForegroundColor Cyan
    Set-Location "$ProjectRoot\frontend"
    npm install
    Set-Location $ProjectRoot
}
Write-Host "[OK] Frontend dependencies ready" -ForegroundColor Green

# 9. Launch Backend Process
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[+] Starting C++ Drogon Backend on http://127.0.0.1:8080..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath $BackendExe -WorkingDirectory "$ProjectRoot" -PassThru -NoNewWindow

Start-Sleep -Seconds 1

# 10. Open Browser
if (-not $NoBrowser) {
    Write-Host "[+] Opening JobPilot in your default browser..." -ForegroundColor Cyan
    Start-Process "http://localhost:5173"
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  JOBPILOT IS RUNNING! Press Ctrl+C in this window to stop" -ForegroundColor Green
Write-Host "  Backend API:  http://127.0.0.1:8080/api/v1/             " -ForegroundColor Green
Write-Host "  Frontend App: http://localhost:5173/                    " -ForegroundColor Green
Write-Host "  Demo Login:   demo@jobpilot.io / Password123!           " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

try {
    Set-Location "$ProjectRoot\frontend"
    npm run dev
} finally {
    Write-Host "`n[+] Terminating backend server (PID: $($backendProcess.Id))..." -ForegroundColor Yellow
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[OK] JobPilot shut down cleanly." -ForegroundColor Green
}
