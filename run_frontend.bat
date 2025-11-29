@echo off
echo Starting Frontend Server...
cd frontend
echo Installing dependencies if needed...
call npm install
echo Server is starting at http://localhost:5173
npm run dev
pause
