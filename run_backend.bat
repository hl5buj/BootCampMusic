@echo off
echo Starting Backend Server...
cd backend
call ..\venv\Scripts\activate
python manage.py migrate
echo Server is starting at http://localhost:8000
python manage.py runserver 0.0.0.0:8000
pause
