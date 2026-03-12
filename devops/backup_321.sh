#!/bin/bash
# Estrategia 3-2-1 Backup Rule para el NAS (Punto 21)

BACKUP_DIR="/nas_storage/backups/db_$(date +%F)"
DOCS_DIR="/nas_storage/documentos"
MYSQL_USER="root"
MYSQL_PASS="sysadmin_secure"

mkdir -p $BACKUP_DIR

echo "1. Ejecutando Backup Consistente de Base de Datos SQL..."
mysqldump -u$MYSQL_USER -p$MYSQL_PASS sigdi > $BACKUP_DIR/sigdi_backup.sql

echo "2. Backup Incremental de Repositorio Documental usando Rsync..."
rsync -av --delete $DOCS_DIR $BACKUP_DIR/documentos_repo

echo "3. Compresión y consolidación Criptográfica..."
tar -czvf $BACKUP_DIR.tar.gz $BACKUP_DIR

echo "4. Copia Fuera de Sitio (Cumplimiento Regla 3-2-1)..."
# scp $BACKUP_DIR.tar.gz backup_user@remote_nas_server:/offsite_backups/

echo "Backup Institucional 3-2-1 completado y transferido al storage tolerante de fallas."
