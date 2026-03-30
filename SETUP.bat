@echo off
title NutriUniverse - First Time Setup
color 0B

echo.
echo  ==========================================
echo   NutriUniverse Agent - First Time Setup
echo  ==========================================
echo.

:: Check Node.js
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0C
    echo  Node.js is NOT installed.
    echo.
    echo  Opening nodejs.org for you...
    echo  Download and install it, then run this file again.
    echo.
    start https://nodejs.org
    pause
    exit
) ELSE (
    echo  [OK] Node.js is installed.
)

:: Create .env if missing
IF NOT EXIST ".env" (
    echo.
    echo  ==========================================
    echo   Enter your Anthropic API Key
    echo  ==========================================
    echo.
    echo  Get it from: https://console.anthropic.com
    echo  (Sign up free, then click API Keys)
    echo.
    set /p APIKEY="  Paste your API key here and press Enter: "
    echo ANTHROPIC_API_KEY=%APIKEY%> .env
    echo.
    echo  [OK] .env file created.
) ELSE (
    echo  [OK] .env file found.
)

:: Install packages
echo.
echo  Installing packages...
npm install
echo.
echo  [OK] All done!
echo.
echo  ==========================================
echo   Setup complete!
echo   Now double-click START.bat to run agent
echo  ==========================================
echo.
pause
