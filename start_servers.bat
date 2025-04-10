@echo off
echo Starting Django backend server...
start cmd /k "cd backend && python manage.py runserver"

echo Starting Next.js frontend server...
start cmd /k "cd frontend && npm run dev"

echo Servers started! Access the application at http://localhost:3000 