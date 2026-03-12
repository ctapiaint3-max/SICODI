$distPath = "dist_sicodi"
$zipFile = "SICODI_DEPLOY.zip"

if (Test-Path $distPath) { Remove-Item -Recurse -Force $distPath }
if (Test-Path $zipFile) { Remove-Item $zipFile }

# 1. Crear directorios
New-Item -ItemType Directory -Path "$distPath\backend"
New-Item -ItemType Directory -Path "$distPath\frontend"

Write-Host ">>> Copiando Backend..." -ForegroundColor Cyan
# Copiar carpetas del backend (excluyendo vendor si existe para ahorrar espacio, aunque aquí es PHP plano mayormente)
$backendItems = "api", "app", "config", "core", "database", "devops", "nginx", "public", "scripts", "storage", "composer.json"
foreach ($item in $backendItems) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination "$distPath\backend" -Recurse -Force
    }
}

Write-Host ">>> Copiando Frontend (Build)..." -ForegroundColor Cyan
# Copiar solo lo necesario para producción del frontend
$frontendItems = "public", "package.json", "next.config.mjs", "next.config.ts", ".next"
foreach ($item in $frontendItems) {
    if (Test-Path "frontend\$item") {
        Copy-Item -Path "frontend\$item" -Destination "$distPath\frontend" -Recurse -Force
    }
}

# 2. Crear archivo de ayuda rápido en la raíz del dist
$helpContent = @"
# SICODI - Instrucciones de Instalación en el Servidor

1. Extrae este ZIP en la raíz de tu servidor o NAS.
2. Configura MySQL con los archivos en 'backend/database/migrations/'.
3. Inicia el Backend:
   cd backend
   php -S 0.0.0.0:8000 -t public
4. Inicia el Frontend:
   cd frontend
   npm install --production
   npm run start
"@
$helpContent | Out-File -FilePath "$distPath\LEEME_INSTALACION.txt" -Encoding utf8

Write-Host ">>> Comprimiendo el paquete..." -ForegroundColor Cyan
Compress-Archive -Path "$distPath\*" -DestinationPath $zipFile

Write-Host ">>> ¡LISTO! El archivo $zipFile se ha creado exitosamente." -ForegroundColor Green
Write-Host ">>> Ya puedes copiar este archivo al NAS o servidor final."
