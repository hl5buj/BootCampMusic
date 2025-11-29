@echo off
echo Creating Django Superuser...
cd backend
call ..\venv\Scripts\activate
echo.
echo Please enter superuser details:
python manage.py createsuperuser
pause
