@echo off
title Paytm VentureAI - Launcher
color 0B

echo =====================================================================
echo                Paytm VentureAI - Local Demo Launcher
echo =====================================================================
echo.

cd /d "%~dp0"

REM 1. Check or Setup .env
if not exist .env (
    echo [*] Creating .env from .env.example
    copy .env.example .env >nul
)

REM 2. Check Backend Virtual Environment
if not exist backend\venv\Scripts\activate.bat (
    echo [*] Creating Python virtual environment in backend\venv
    python -m venv backend\venv
    echo [*] Installing backend dependencies
    call backend\venv\Scripts\activate.bat
    pip install -r backend\requirements.txt
)

REM 3. Seed Database if not present
if not exist backend\venture_ai.db (
    echo [*] Seeding deterministic 90-day kirana store data
    call backend\venv\Scripts\python.exe backend\scripts\seed.py
)

REM Free ports 8000 and 3000 if occupied by older processes
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING 2^>nul') do taskkill /f /pid %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do taskkill /f /pid %%a >nul 2>nul

REM 4. Start Backend Server in a new window
echo [*] Launching FastAPI Backend on http://localhost:8000
start "Paytm VentureAI - Backend (FastAPI)" /D "%~dp0backend" cmd /k "call venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

REM 5. Start Frontend Server in a new window
echo [*] Launching Next.js Frontend on http://localhost:3000
start "Paytm VentureAI - Frontend (Next.js)" /D "%~dp0frontend" cmd /k "npm run dev"

REM 6. Wait and open browser
echo.
echo =====================================================================
echo  Services Starting:
echo    - Backend API:  http://localhost:8000/api/docs
echo    - Mobile Web:   http://localhost:3000
echo.
echo  Demo Login Credentials:
echo    - Email:    demo@venture.ai
echo    - Password: demo123
echo =====================================================================
echo [*] Opening Paytm VentureAI in your browser in 4 seconds...
ping 127.0.0.1 -n 4 >nul
start http://localhost:3000

echo.
echo Servers are running in their respective windows.
exit /b 0
