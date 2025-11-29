@echo off
echo ========================================================
echo  BootCampMusic GitHub Push Helper
echo ========================================================
echo.
echo 1. Please go to https://github.com/new and create a new repository.
echo    Name it 'BootCampMusic' (or any name you prefer).
echo    Do NOT check "Initialize with README", .gitignore, or License.
echo.
echo 2. Once created, copy the HTTPS URL (e.g., https://github.com/username/BootCampMusic.git)
echo.
set /p REPO_URL="Paste your GitHub Repository URL here: "

if "%REPO_URL%"=="" (
    echo Error: URL cannot be empty.
    pause
    exit /b 1
)

echo.
echo Setting remote origin...
git remote add origin %REPO_URL%
if %errorlevel% neq 0 (
    echo Remote 'origin' might already exist. Updating it...
    git remote set-url origin %REPO_URL%
)

echo.
echo Pushing to GitHub...
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo Push failed. Please check your credentials and URL.
    pause
    exit /b 1
)

echo.
echo Successfully pushed to GitHub!
pause
