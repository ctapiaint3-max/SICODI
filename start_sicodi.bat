@echo off
REM SICODI — Arrancar todos los servidores
echo Iniciando SICODI...
echo.
echo [1/2] Backend PHP en localhost:8000...
start "SICODI-Backend" cmd /k "cd /d %~dp0 && php -S localhost:8000 -t public"
timeout /t 2 /nobreak >nul

echo [2/2] Frontend Next.js en localhost:3000...
start "SICODI-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ✅ SICODI iniciado!
echo    Frontend: http://localhost:3000
echo    API:      http://localhost:8000/api/health
echo.
start http://localhost:3000
