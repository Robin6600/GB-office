@echo off
echo Starting Personal Work Dashboard...

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Open Browser
start http://localhost:3000

REM Start Server
echo Starting Server on Port 3000...
node server.js
pause
