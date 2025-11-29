@echo off
echo ========================================================
echo  GitHub Push Setup
echo ========================================================
echo.
echo Please provide your GitHub repository URL
echo Example: https://github.com/username/BootCampMusic.git
echo.
set /p REPO_URL="Enter your GitHub repository URL: "

if "%REPO_URL%"=="" (
    echo Error: URL cannot be empty!
    pause
    exit /b 1
)

echo.
echo Initializing Git repository...
git init

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit: BootCampMusic full-stack music platform"

echo.
echo Setting up remote origin...
git remote add origin %REPO_URL% 2>nul
if %errorlevel% neq 0 (
    echo Remote already exists, updating URL...
    git remote set-url origin %REPO_URL%
)

echo.
echo Renaming branch to main...
git branch -M main

echo.
echo Pushing to GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo  Push failed!
    echo ========================================================
    echo Possible reasons:
    echo 1. Authentication required - please enter your credentials
    echo 2. Repository URL is incorrect
    echo 3. Network connection issue
    echo.
    echo Please check the error message above and try again.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo  Successfully pushed to GitHub!
echo ========================================================
echo Your code is now available at: %REPO_URL%
echo.
pause
