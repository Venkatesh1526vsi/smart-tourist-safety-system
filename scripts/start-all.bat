@echo off
REM Smart Tourist Safety System - Start All Services (Windows)

echo.
echo ======================================================
echo Smart Tourist Safety System - Starting All Services
echo ======================================================
echo.

REM Colors aren't native to Windows batch, so we'll use simple messages

REM Check if .env files exist
echo Checking environment files...
if not exist "backend-api\.env" (
    echo Creating backend-api\.env from template...
    copy backend-api\.env.example backend-api\.env
    echo WARNING: Please edit backend-api\.env with your actual credentials!
    echo.
)

REM Kill any existing processes on our ports (optional, can cause issues)
REM For now, we'll skip this to be safe

REM Note: On Windows, you typically need to run these in separate terminal windows
REM Or use a process manager like Concurrently or PM2

echo.
echo Instructions for Windows:
echo.
echo Option 1: Use Docker (Recommended)
echo   cd docker
echo   docker-compose up
echo.
echo Option 2: Manual Setup (Open 3 terminal windows)
echo.
echo   Terminal 1 - Backend API:
echo   cd backend-api
echo   npm install
echo   npm start
echo.
echo   Terminal 2 - Frontend:
echo   cd frontend
echo   npm install
echo   npm start
echo.
echo   Terminal 3 - AI Services:
echo   cd ai-services
echo   pip install -r requirements.txt
echo   python app.py
echo.
echo Then access at:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:5000
echo   AI:        http://localhost:8000
echo.
