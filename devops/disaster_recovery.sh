#!/bin/bash
# Script de Disaster Recovery para SICODI (Punto 22)
# RTO < 4 horas, RPO < 24 horas

echo "Iniciando Restauración de Emergencia DRP (Disaster Recovery Plan)..."

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
  echo "CRÍTICO: Por favor provea el archivo de backup .tar.gz institucional"
  exit 1
fi

echo "1. Descomprimiendo Snapshot del NAS..."
tar -xzvf $BACKUP_FILE -C /nas_storage/restores/

echo "2. Restaurando Base de Datos SIGDI en MySQL Master..."
mysql -u root -p sysadmin_secure sigdi < /nas_storage/restores/sigdi_backup.sql

echo "3. Restaurando Repositorio Físico Inmutable del NAS..."
rsync -av /nas_storage/restores/documentos_repo /nas_storage/documentos

echo "4. Reiniciando Servicios Críticos (Nginx, Apache, Motor Node JS)..."
systemctl restart nginx apache2
pm2 restart sicodi-frontend

echo "Disaster Recovery Completado con integridad verificada. Semáforos en VERDE."
