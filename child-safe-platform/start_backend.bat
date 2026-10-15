@echo off
title ChildSafe Backend (FastAPI)
echo ====================================================
echo Starting ChildSafe Platform Backend on port 8000...
echo ====================================================
cd /d "%~dp0"
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause
