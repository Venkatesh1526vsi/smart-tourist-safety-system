@echo off
echo ========================================
echo Starting SAFEYATRA Frontend
echo ========================================
echo.

cd /d "c:\Users\Venkatesh Inamdar\Desktop\smart-tourist-safety-system\frontend"
echo Current directory: %cd%

echo Installing dependencies (if needed)...
npm install >nul 2>&1

echo Starting frontend on port 3000...
npm start

pause