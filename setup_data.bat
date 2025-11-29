@echo off
echo Setting up sample data...
cd backend
echo Generating database entries from EXISTING files...
call ..\venv\Scripts\activate
python create_sample_data.py
echo.
echo Setup complete!
pause
