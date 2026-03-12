# Registro documental import

This project includes a minimal CLI importer for XLSX and CSV files.
It is designed for the file structure in BASE CORREO 2026.xlsx.

## Files
- DB table: registro_documental (see database/migrations/002_registro_documental.sql)
- Mapping config: config/registro_import_map.php
- Importer: scripts/import_registro.php

## Assumed column mapping (A-J)
A -> mando_que_gira
B -> fecha_recepcion (Excel date)
C -> numero_programa_incogmar
D -> tipo_documento
E -> clasificacion
F -> numero_documento
G -> fecha_documento (Excel date)
H -> registro
I -> asunto
J -> tramite

If the source file changes, edit config/registro_import_map.php.

## Usage
php scripts/import_registro.php --file "C:\\data\\BASE CORREO 2026.xlsx" --dsn "mysql:host=localhost;dbname=sigdi;charset=utf8mb4" --user root --pass secret

Dry run:
php scripts/import_registro.php --file "C:\\data\\registro.csv" --dsn "mysql:host=localhost;dbname=sigdi;charset=utf8mb4" --user root --pass secret --dry-run

Optional:
--map <path> to use a different column map
--usuario <id> and --expediente <id> to tag imported rows

## Notes
- XLSX parsing is minimal (shared strings + inline strings only).
- Formula cells are not evaluated.
- CSV delimiter is auto-detected (comma, semicolon, tab).
