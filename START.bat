@echo off
title NutriUniverse Agent
color 0A

echo.
echo  ==========================================
echo   NutriUniverse Agent - Starting...
echo  ==========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0C
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Please go to https://nodejs.org
    echo  Download and install Node.js first.
    echo  Then double-click this file again.
    echo.
    pause
    exit
)

:: Check if .env file exists
IF NOT EXIST ".env" (
    color 0C
    echo  ERROR: .env file not found!
    echo.
    echo  Please create a file called .env in this folder
    echo  with the following content:
    echo.
    echo  ANTHROPIC_API_KEY=your-api-key-here
    echo.
    echo  Get your API key from: https://console.anthropic.com
    echo.
    pause
    exit
)

:: Install dependencies if node_modules missing
IF NOT EXIST "node_modules" (
    echo  Installing dependencies for the first time...
    echo  (This only happens once, please wait)
    echo.
    npm install
    echo.
)

:: Open browser after 3 seconds
echo  Starting NutriUniverse Agent...
echo.
start "" timeout /t 3 /nobreak >nul & start "" "http://localhost:3000"
start /wait "" timeout /t 3 /nobreak >nul
start http://localhost:3000

:: Start the server
node server.js

echo.
echo  Server stopped.
pause
