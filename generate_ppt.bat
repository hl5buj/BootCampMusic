@echo off
echo Installing python-pptx...
pip install python-pptx
if %errorlevel% neq 0 (
    echo Failed to install python-pptx.
    pause
    exit /b %errorlevel%
)
echo Generating presentation...
python create_presentation.py
if %errorlevel% neq 0 (
    echo Failed to generate presentation.
    pause
    exit /b %errorlevel%
)
echo Presentation generated successfully: BootCampMusic_Project_Presentation.pptx
pause
