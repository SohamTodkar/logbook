@echo off
title Logbook - Quiet Personal Productivity
cd /d "%~dp0"
set "PATH=%~dp0..\nodejs;%PATH%"

echo ========================================================
echo               STILL LOGBOOK (Modern Edition)
echo ========================================================
echo.
echo Launching your local productivity logbook...
echo Opening http://localhost:8000 in your browser...
echo.
echo Press Ctrl+C in this window anytime to stop the server.
echo ========================================================
echo.

start "" "http://localhost:8000"
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
pause
