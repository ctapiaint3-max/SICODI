# SICODI — Sistema de Control Documental Institucional

> **Versión:** 1.0.0 | **Stack:** PHP 8.5 + Next.js 16 + MySQL 8 | **Entorno:** Intranet Institucional

---

## ⚡ Requisitos

| Componente | Versión mínima |
|------------|---------------|
| PHP | 8.1+ |
| MySQL / MariaDB | 8.0+ |
| Node.js | 18+ |
| Nginx | 1.20+ (producción) |
| Composer | 2+ (opcional) |

---

## 🚀 Instalación Rápida (Desarrollo)

### 1. Clonar / copiar el proyecto

```bash
# El proyecto debe estar en:
C:\Users\<usuario>\Desktop\SICODI\
```

### 2. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

### 3. Configurar base de datos (MySQL / XAMPP)

```bash
# 1. Crear base de datos
CREATE DATABASE sigdi CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

# 2. Aplicar migraciones en orden:
mysql -u root -p sigdi < database/migrations/001_core_schema.sql
mysql -u root -p sigdi < database/migrations/002_firmas_schema.sql
mysql -u root -p sigdi < database/migrations/002_registro_documental.sql
mysql -u root -p sigdi < database/migrations/003_mail_messages_schema.sql
mysql -u root -p sigdi < database/migrations/004_registro_documental_schema.sql
mysql -u root -p sigdi < database/migrations/005_system_config_schema.sql
mysql -u root -p sigdi < database/migrations/006_notifications_sla_schema.sql

# 3. Cargar datos iniciales:
mysql -u root -p sigdi < database/seeds/001_initial_data.sql
```

### 4. Iniciar servidores

```bash
# Terminal 1 — Backend PHP (API)
cd C:\Users\<usuario>\Desktop\SICODI
php -S localhost:8000 -t public

# Terminal 2 — Frontend Next.js
cd C:\Users\<usuario>\Desktop\SICODI\frontend
npm run dev
```

### 5. Acceder al sistema

| URL | Descripción |
|-----|-------------|
| http://localhost:3000 | 🖥️ Interfaz del sistema (usuario) |
| http://localhost:8000 | ⚙️ API Backend PHP |
| http://localhost:8000/api/health | ✅ Health check de la API |

### 6. Credenciales por defecto

```
Usuario: admin
Contraseña: admin123
```

> ⚠️ Cambiar inmediatamente en producción.

---

## 🏗️ Estructura del Proyecto

```
SICODI/
├── app/
│   ├── controllers/      # 14 Controllers (Auth, Expediente, Documento, Workflow...)
│   ├── models/           # 6 Modelos PHP (User, Expediente, Documento, Tarea, Proceso, Firma)
│   ├── services/         # 9 Services (Auth, Expediente, Documento, Workflow, Mail, Firma, Report...)
│   ├── repositories/     # 13 Repositories (acceso a datos)
│   ├── middleware/        # 3 Middleware (Auth, CSRF, Permission, RateLimit)
│   ├── security/         # AuditService, SessionManager, PasswordPolicy
│   ├── workflows/        # ProcessEngine, TaskManager, StateMachine, WorkflowInterpreter, EventDispatcher
│   ├── mail/             # MailTemplate + templates HTML
│   └── core/             # Database, Router, Request, Response
├── api/v1/               # Punto de extensión para versionado de API
├── database/
│   ├── migrations/       # 006 migraciones SQL
│   └── seeds/            # Datos iniciales
├── frontend/             # Aplicación Next.js 16 + TypeScript + TailwindCSS
│   └── src/app/          # Páginas: dashboard, expedientes, documentos, correo, bandeja...
├── storage/              # Documentos, firmas, logs (filesystem NAS)
├── nginx/                # Configuración Nginx reverse proxy + SSL
├── scripts/              # backup.bat, import_registro.php
└── public/               # Entry point PHP (index.php con 45+ rutas)
```

---

## 🔗 Endpoints API Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Autenticación |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/expedientes` | Listar expedientes |
| POST | `/api/expedientes` | Crear expediente |
| GET | `/api/expedientes/{id}` | Detalle expediente |
| GET | `/api/documentos` | Listar documentos |
| POST | `/api/documentos/upload` | Subir documento |
| POST | `/api/workflow/avanzar/{id}` | Avanzar estado BPMN |
| GET | `/api/workflow/transitions/{estado}` | Transiciones disponibles |
| GET | `/api/notifications` | Notificaciones del usuario |
| GET | `/api/reportes/kpis` | KPIs del dashboard |
| GET | `/api/reportes/cumplimiento` | Cumplimiento por área |
| GET | `/api/auditoria` | Log de auditoría |
| GET | `/api/dashboard/kpis` | KPIs dashboard |

---

## 🔐 Seguridad

- Autenticación: tokens de sesión en BD (tabla `sessions`)
- Contraseñas: bcrypt cost=12
- RBAC: roles + permisos granulares en BD
- Auditoría completa: tabla `audit_log`
- Cabeceras HTTP: CSP, X-Frame-Options, X-Content-Type-Options
- CSRF: middleware para formularios web

---

---

## 🚀 Despliegue en la Nube (GitHub) — ¡LEE ESTO!

Para que el sistema funcione en internet, **no puedes subir todo a Vercel**. Debes usar dos servicios diferentes:

### ⚙️ PARTE 1: Backend (PHP + MySQL) -> Usa [Railway](https://railway.app/) o [Render](https://render.com/)
Vercel **no soporta PHP**. Si lo subes ahí, se descargará el código en lugar de ejecutarse.
1. Crea una cuenta en Railway o Render.
2. Conecta tu repositorio de GitHub.
3. El servicio detectará el archivo `Dockerfile` que ya creé y configurará el servidor PHP automáticamente.
4. **Base de Datos:** Crea una base de datos MySQL en el mismo servicio y obtén las credenciales.
5. **Variables de Entorno:** En el panel del Backend, configura esto:
   - `DB_HOST`: (Ej: `mysql.railway.internal`)
   - `DB_NAME`: `sigdi`
   - `DB_USER`: `root`
   - `DB_PASS`: (Tu contraseña)

### 💻 PARTE 2: Frontend (Next.js) -> Usa [Vercel](https://vercel.com/)
1. Conecta tu repo a Vercel.
2. **IMPORTANTE:** En "Root Directory", selecciona la carpeta `frontend`.
3. **Variable de Entorno:** Configura `NEXT_PUBLIC_API_URL` con la URL que te dio Railway/Render (ej: `https://api-sicodi.up.railway.app/api/v1`).

---

## ☁️ Despliegue en NAS (Producción)

1. Copiar proyecto al NAS
2. Configurar Nginx: ver `nginx/sicodi.conf`
3. Instalar certificado SSL en `nginx/ssl/`  
4. Configurar SMTP en `MailService.php` (reemplazar `mail()` por PHPMailer)
5. Programar backup: ejecutar `scripts/backup.bat` vía Task Scheduler
6. Apuntar PHP a la BD MySQL del NAS

---

## 🗂️ Módulos del Sistema

| Módulo | Estado |
|--------|--------|
| Autenticación y sesiones | ✅ Implementado |
| Gestión de expedientes | ✅ Implementado |
| Gestión documental con versiones | ✅ Implementado |
| Registro documental / Correspondencia | ✅ Implementado |
| Motor BPMN (workflow) | ✅ Implementado |
| Firma electrónica | ✅ Implementado |
| Sistema SLA + Semáforos | ✅ Implementado |
| Notificaciones in-app | ✅ Implementado |
| Correo institucional interno | ✅ Implementado (modo simulado) |
| Reportes y KPIs | ✅ Implementado |
| RBAC + Auditoría | ✅ Implementado |
| Panel de administración | ✅ Implementado |
