@echo off
echo ========================================
echo Starting SAFEYATRA Backend Services
echo ========================================
echo.

echo 1. Checking if MongoDB is running...
netstat -an | findstr :27017 >nul
if %errorlevel% == 0 (
    echo ✓ MongoDB is already running on port 27017
) else (
    echo ⚠ MongoDB not found on port 27017
    echo Starting MongoDB with Docker...
    docker run -d -p 27017:27017 --name mongo mongo:7
    if %errorlevel% == 0 (
        echo ✓ MongoDB started successfully
    ) else (
        echo ❌ Failed to start MongoDB
        echo Please start MongoDB manually or install it
        pause
        exit /b 1
    )
)

echo.
echo 2. Starting Backend API Server...
cd /d "c:\Users\Venkatesh Inamdar\Desktop\smart-tourist-safety-system\backend-api"
echo Current directory: %cd%

echo Installing dependencies (if needed)...
npm install >nul 2>&1

echo Starting server on port 3001...
node index.js

pause