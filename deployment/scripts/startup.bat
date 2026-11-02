@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo           JobPilot Server Launcher (Windows)       
echo ===================================================

:: Ensure working directory is repo root
cd /d "%~dp0..\.."

:: Set environment path for UCRT64 runtime libraries (Drogon, MariaDB, Argon2, OpenSSL)
set "PATH=C:\msys64\ucrt64\bin;%PATH%"

:: Ensure uploads directory exists
if not exist "uploads" (
    echo [+] Creating uploads directory...
    mkdir uploads
)

:: Verify MySQL Service
sc query MySQL80 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [+] Detected MySQL80 service. Ensuring it is running...
    net start MySQL80 >nul 2>&1
) else (
    echo [!] MySQL80 service not registered as Windows Service. Ensure MySQL daemon is running on localhost:3306.
)

:: Check if backend binary exists
if not exist "backend\build\jobpilot_server.exe" (
    echo [ERROR] Backend binary not found at backend\build\jobpilot_server.exe
    echo [!] Please build the backend using CMake and Ninja first.
    exit /b 1
)

:: Load environment file if available
if exist ".env" (
    echo [+] Found .env file.
) else (
    echo [!] Warning: .env not found, using compiled defaults.
)

echo.
echo ===================================================
echo [+] Starting JobPilot C++ Drogon Backend on port 8080...
echo [+] API Base: http://localhost:8080/api/v1/
echo [+] Press Ctrl+C to terminate the server.
echo ===================================================
echo.

backend\build\jobpilot_server.exe

endlocal
