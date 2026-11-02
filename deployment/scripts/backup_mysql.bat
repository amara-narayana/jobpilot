@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo           JobPilot MySQL Backup Utility (Windows)  
echo ===================================================

cd /d "%~dp0..\.."

if not exist "database\backups" (
    mkdir database\backups
)

:: Generate timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set dt=%%I
set TIMESTAMP=%dt:~0,4%%dt:~4,2%%dt:~6,2%_%dt:~8,2%%dt:~10,2%%dt:~12,2%
set BACKUP_FILE=database\backups\jobpilot_backup_%TIMESTAMP%.sql

set DB_HOST=127.0.0.1
set DB_PORT=3306
set DB_NAME=jobpilot
set DB_USER=jobpilot_user

if "%~1"=="" (
    echo [+] Using default user '%DB_USER%' on database '%DB_NAME%'.
    set /p DB_PASS="Enter password for %DB_USER% (or press Enter if configured in my.ini): "
) else (
    set DB_USER=%~1
)

echo [+] Dumping database '%DB_NAME%' to '%BACKUP_FILE%'...

if "%DB_PASS%"=="" (
    mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% --single-transaction --routines --triggers --default-character-set=utf8mb4 %DB_NAME% > "%BACKUP_FILE%"
) else (
    mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% --single-transaction --routines --triggers --default-character-set=utf8mb4 %DB_NAME% > "%BACKUP_FILE%"
)

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Backup completed successfully: %BACKUP_FILE%
    for %%F in ("%BACKUP_FILE%") do echo [INFO] Backup file size: %%~zF bytes
) else (
    echo [ERROR] mysqldump failed with error code %ERRORLEVEL%.
    if exist "%BACKUP_FILE%" del "%BACKUP_FILE%"
)

endlocal
