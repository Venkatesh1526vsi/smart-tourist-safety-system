@echo off
echo ========================================
echo Testing SAFEYATRA System Connection
echo ========================================
echo.

echo Testing if backend is accessible on port 3001...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001' -TimeoutSec 5; Write-Host '✓ Backend is running' } catch { Write-Host '✗ Backend is not accessible' }"

echo.
echo Testing if frontend is accessible on port 3000...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 5; Write-Host '✓ Frontend is running' } catch { Write-Host '✗ Frontend is not accessible' }"

echo.
echo Testing MongoDB connection...
powershell -Command "try { $socket = New-Object System.Net.Sockets.TcpClient('localhost', 27017); Write-Host '✓ MongoDB is running'; $socket.Close() } catch { Write-Host '✗ MongoDB is not accessible' }"

echo.
echo If any services show '✗', please start them using:
echo - start-full-system.bat (for backend + MongoDB)
echo - start-frontend.bat (for frontend)
echo.
pause