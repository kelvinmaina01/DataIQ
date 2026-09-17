@echo off
cd /d "%~dp0"
echo Starting DataIQ backend (port 3001) and frontend (port 3000)...
echo Keep both windows open. Frontend: http://localhost:3000/login
start "DataIQ backend" cmd /k "npx tsx --tsconfig tsconfig.backend.json backend/server.ts"
start "DataIQ frontend" cmd /k "npm run dev"
echo Done. Two new windows should be open.
pause
