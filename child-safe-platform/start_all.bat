@echo off
title ChildSafe Platform Launcher
echo Launching Backend and Frontend in separate windows...
cd /d "%~dp0"
start "ChildSafe Backend" cmd /k "start_backend.bat"
start "ChildSafe Frontend" cmd /k "start_frontend.bat"
echo Both servers are starting up!
echo Backend will be at http://localhost:8000
echo Frontend will be at http://localhost:5173
pause
