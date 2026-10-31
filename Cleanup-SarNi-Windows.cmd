@echo off
setlocal
cd /d "%~dp0"
echo.
echo SarNi Cleanup - PREVIEW ONLY
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Remove-Old-SarNi-Files.ps1"
if errorlevel 1 (
 echo PREVIEW FAILED. No files were deleted.
 pause
 exit /b 1
)
echo.
echo To delete ONLY the old versioned assets listed above,
echo type DELETE and press Enter. Any other reply cancels.
set /p ANSWER=Confirmation: 
if not "%ANSWER%"=="DELETE" (
 echo Cancelled. No files deleted.
 pause
 exit /b 0
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Remove-Old-SarNi-Files.ps1" -Apply
if errorlevel 1 (
 echo Cleanup failed. Review the message above.
 pause
 exit /b 1
)
echo.
echo NEXT: Review deleted files in GitHub Desktop, then Commit and Push.
echo IMPORTANT: Do not commit these cleanup scripts to GitHub.
pause
