@echo off
cd /d "%~dp0.."
echo.
echo ================================================
echo   Google Scholar synchronization
echo ================================================
echo.
call npm run sync-scholar
if errorlevel 1 (
  echo.
  echo Synchronization failed. Read the error above.
  pause
  exit /b 1
)
echo.
echo Synchronization completed successfully.
pause
