@echo off
REM ─────────────────────────────────────────────────────────
REM SICODI — Script de Setup y Deployment Automatizado
REM Ejecutar como Administrador en el servidor NAS/Windows
REM ─────────────────────────────────────────────────────────

echo.
echo ╔══════════════════════════════════════════════╗
echo ║  SICODI — Setup de Instalación Institucional ║
echo ╚══════════════════════════════════════════════╝
echo.

SET SICODI_DIR=%~dp0
SET DB_HOST=127.0.0.1
SET DB_NAME=sigdi
SET DB_USER=root
SET DB_PASS=

REM ── 1. Verificar PHP ──
where php >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PHP no encontrado. Instale XAMPP y agregue PHP al PATH.
    pause & exit /b 1
)
echo [OK] PHP encontrado: 
php -r "echo PHP_VERSION;"
echo.

REM ── 2. Verificar Node.js ──
where node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [WARN] Node.js no encontrado. El frontend no podrá iniciarse.
) ELSE (
    echo [OK] Node.js encontrado:
    node --version
)
echo.

REM ── 3. Instalar dependencias frontend ──
echo [INFO] Instalando dependencias del frontend...
cd "%SICODI_DIR%frontend"
npm install --silent
IF %ERRORLEVEL% EQU 0 (
    echo [OK] Dependencias frontend instaladas.
) ELSE (
    echo [WARN] Error instalando dependencias frontend.
)
cd "%SICODI_DIR%"
echo.

REM ── 4. Crear directorios de storage ──
echo [INFO] Creando directorios de almacenamiento...
mkdir "%SICODI_DIR%storage\expedientes" 2>nul
mkdir "%SICODI_DIR%storage\documentos"  2>nul
mkdir "%SICODI_DIR%storage\firmas"      2>nul
mkdir "%SICODI_DIR%storage\logs"        2>nul
mkdir "%SICODI_DIR%nginx\ssl"           2>nul
echo [OK] Directorios creados.
echo.

REM ── 5. Aplicar migraciones de BD ──
echo [INFO] Aplicando migraciones de base de datos...
IF "%DB_PASS%"=="" (
    SET MYSQL_CMD=mysql -h%DB_HOST% -u%DB_USER%
) ELSE (
    SET MYSQL_CMD=mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASS%
)

%MYSQL_CMD% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;" 2>nul
IF %ERRORLEVEL% EQU 0 (
    echo [OK] Base de datos "%DB_NAME%" verificada.
    FOR %%f IN ("%SICODI_DIR%database\migrations\*.sql") DO (
        echo    Aplicando: %%~nxf
        %MYSQL_CMD% %DB_NAME% < "%%f" 2>nul
    )
    echo    Cargando seeds...
    %MYSQL_CMD% %DB_NAME% < "%SICODI_DIR%database\seeds\001_initial_data.sql" 2>nul
    echo [OK] Migraciones aplicadas.
) ELSE (
    echo [WARN] No se pudo conectar a MySQL. Configure la BD manualmente.
)
echo.

REM ── 6. Listo ──
echo ╔══════════════════════════════════════════════════════════╗
echo ║  Setup completado. Para iniciar el sistema ejecute:     ║
echo ║                                                          ║
echo ║  start_sicodi.bat                                        ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
pause
