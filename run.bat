@echo off
setlocal
title JobPilot Career Operating System
cd /d "%~dp0"

echo ==========================================================
echo               JOBPILOT LAUNCHER FOR WINDOWS               
echo ==========================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1"

endlocal
