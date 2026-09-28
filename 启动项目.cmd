@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Please install Node.js 22.12 or newer.
 pause
 exit /b 1
)
call node scripts/check-runtime.cjs
if errorlevel 1 goto fail
if not exist node_modules\.bin\vite.cmd (
 call npm.cmd ci
 if errorlevel 1 goto fail
)
call npm.cmd run dev -- --open
if errorlevel 1 goto fail
exit /b 0
:fail
echo Startup failed. Please copy the error message to Codex.
pause
exit /b 1
