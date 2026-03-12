@echo off
setlocal

:: SICODI DATABASE AND NAS BACKUP SCRIPT (3-2-1 Rule)
:: Se asume ejecución cronometrada via Windows Task Scheduler

echo =========================================
echo SICODI - SISTEMA DE BACKUPS INSTITUCIONAL
echo =========================================

:: Variables
set MYSQL_USER=root
set MYSQL_PASSWORD=
set DATABASE=sigdi
set BACKUP_DIR=C:\Users\nylom\Desktop\SICODI\storage\backups
set NAS_DIR=C:\Users\nylom\Desktop\SICODI\storage
set DATE=%DATE:~6,4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%
set DATE=%DATE: =0%

:: Crear directorio si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo [1/3] Iniciando volcado de Base de Datos MySQL...
:: Nota: Asumiendo que mysqldump está en el sistema (XAMPP PATH)
mysqldump -u%MYSQL_USER% %DATABASE% > "%BACKUP_DIR%\db_sigdi_%DATE%.sql"
if %errorlevel% neq 0 (
    echo [ERROR] Falló el volcado SQL. Verifica mysqldump y credenciales.
) else (
    echo [OK] Base de datos 'sigdi' respaldada en db_sigdi_%DATE%.sql
)

echo [2/3] Sincronizando NAS Documental (Expedientes, Firmas, Documentos)...
:: Se simula xcopy / robocopy en Windows o rsync en Linux
robocopy "%NAS_DIR%\documentos" "%BACKUP_DIR%\NAS_Documentos_%DATE%" /E /Z /C /R:5 /W:5 /MT:8
robocopy "%NAS_DIR%\expedientes" "%BACKUP_DIR%\NAS_Expedientes_%DATE%" /E /Z /C /R:5 /W:5 /MT:8
robocopy "%NAS_DIR%\firmas" "%BACKUP_DIR%\NAS_Firmas_%DATE%" /E /Z /C /R:5 /W:5 /MT:8

echo [3/3] Aplicando Retención y Compresión (Pendiente modulo Zip)...
echo.
echo =========================================
echo BACKUP FINALIZADO.
echo La regla 3-2-1 dicta copiar estos archivos a una cinta o NAS secundario.
echo =========================================
exit /b 0
