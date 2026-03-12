# SICODI

Sistema de Control Documentacion interna

---

# 1. CONTEXTO DEL SISTEMA

Este documento describe la arquitectura para desarrollar un sistema de **gestión documental y gestión de expedientes electrónicos**, inspirado en plataformas como GESDOC.

(Inferencia basada en documentación pública)

Los sistemas de este tipo permiten:

- gestionar expedientes administrativos
- controlar documentos institucionales
- automatizar procesos administrativos
- asignar tareas a usuarios
- mantener trazabilidad completa
- registrar auditoría institucional

---

# 2. OBJETIVO DEL SISTEMA

Construir una aplicación web que permita:

1. Gestión de expedientes electrónicos
2. Gestión documental institucional
3. Automatización de procesos administrativos
4. Seguimiento de trámites
5. Control de usuarios y roles
6. Firma digital de documentos
7. Auditoría completa
8. Correo institucional interno

El sistema debe funcionar **exclusivamente dentro de una intranet institucional**.

---

# 3. PRINCIPIOS DE DISEÑO

La arquitectura debe seguir los siguientes principios:

- Arquitectura en capas
- Separación de responsabilidades
- APIs internas desacopladas
- Seguridad de nivel gubernamental
- Auditoría completa
- Escalabilidad modular

---

# 4. ARQUITECTURA GENERAL DEL SISTEMA

Usuarios Intranet
│
HTTPS
│
Nginx Reverse Proxy
│
Apache (XAMPP)
│
Aplicación Web PHP
│
Backend SIGDI
│
MySQL
│
Repositorio Documental (NAS)

---

# 5. BASE TECNOLÓGICA

## 5.1 Servidor

Servidor base:

XAMPP

Componentes:

- Apache
- PHP 8+
- MySQL
- phpMyAdmin

---

## 5.2 Reverse Proxy

Servidor frontal:

Nginx

Funciones:

- Redirección HTTP → HTTPS
- Gestión de certificados
- Control de acceso
- Proxy hacia Apache

---

## 5.3 Base de Datos

Motor:

MySQL 8+

Características:

- Transacciones ACID
- Integridad referencial
- Replicación opcional
- Backups automatizados

---

# 6. ARQUITECTURA EN CAPAS

El sistema se divide en seis capas.

1. Presentation Layer
2. Application Layer
3. Business Logic Layer
4. Service Layer
5. Persistence Layer
6. Infrastructure Layer

---

## 6.1 Presentation Layer

Responsable de la interfaz web.

Componentes:

- Dashboard
- Gestión de expedientes
- Gestión documental
- Bandeja de tareas
- Reportes
- Administración

Tecnologías:

- HTML5
- CSS
- JavaScript
- Bootstrap

---

## 6.2 Application Layer

Controladores principales del sistema.

Ejemplo:

AuthController
UserController
ExpedienteController
DocumentoController
WorkflowController
ReportController

Funciones:

- Recibir solicitudes
- Validar permisos
- Llamar servicios internos

---

## 6.3 Business Logic Layer

Implementa las reglas de negocio institucionales.

Ejemplos:

- Generar número de expediente
- Validar estado de expediente
- Validar permisos
- Activar workflow
- Registrar auditoría

---

## 6.4 Service Layer

Servicios reutilizables del sistema.

Ejemplo:

AuthService
UserService
ExpedienteService
DocumentoService
WorkflowService
AuditService
MailService
NotificationService

---

## 6.5 Persistence Layer

Capa de acceso a datos.

Componentes:

Repositories
ORM o Query Builder

Ejemplo:

UserRepository
ExpedienteRepository
DocumentoRepository
WorkflowRepository

---

## 6.6 Infrastructure Layer

Componentes técnicos:

- MySQL
- File system
- Servidor de correo
- Nginx
- Certificados SSL

---

# 7. MOTOR DE WORKFLOW

El sistema debe incluir un **motor de procesos administrativos**.

Flujo típico:

Recepción
│
Registro expediente
│
Clasificación
│
Asignación área
│
Análisis
│
Resolución
│
Firma digital
│
Archivo

Cada proceso genera:

- tareas
- actuaciones
- historial

---

# 8. SISTEMA DE CORREO INSTITUCIONAL

Protocolos:

- SMTP (envío)
- IMAP (recepción)

(Inferencia)

Se implementará un servicio de correo interno responsable de:

- enviar notificaciones
- enviar tareas asignadas
- enviar alertas institucionales

---

# 9. SEGURIDAD GUBERNAMENTAL

El sistema debe incluir:

- autenticación segura
- autorización por roles
- registro de auditoría
- cifrado de contraseñas
- control de sesiones

---

## 9.1 Autenticación

Métodos:

- Usuario + contraseña
- Tokens de sesión
- Opcional: 2FA

---

## 9.2 Autorización

Modelo:

RBAC — Role Based Access Control

Estructura:

Usuario
Rol
Permiso
Área

---

## 9.3 Auditoría

Tabla principal:

audit_log

Campos:

- usuario
- acción
- entidad
- fecha
- IP
- datos anteriores
- datos nuevos

---

# 10. ESTRUCTURA DE CARPETAS ENTERPRISE

root/
│
app/
controllers/
models/
services/
repositories/
middleware/
workflows/
security/
mail/
core/
│
api/
v1/
│
config/
│
database/
migrations/
seeds/
│
storage/
expedientes/
documentos/
firmas/
logs/
│
public/
assets/
│
nginx/
ssl/
│
docs/

---

# 11. MODELO DE BASE DE DATOS

Base de datos:

sigdi

Tablas principales:

users
roles
permissions
areas

expedientes
expediente_historial

documentos
documento_version

procesos
tareas

firmas

audit_log

mail_messages

---

# 12. REPOSITORIO DOCUMENTAL

Los archivos deben almacenarse en filesystem.

/storage/expedientes
/storage/documentos
/storage/firmas

La base de datos solo almacena:

- ruta
- hash
- metadata
- versión

---

# 13. APIs INTERNAS

Todas las funciones del sistema deben exponerse mediante **APIs REST**.

Formato:

JSON

Endpoints mínimos:

/api/auth
/api/users
/api/expedientes
/api/documentos
/api/workflow
/api/tasks

---

# 14. CONFIGURACIÓN NGINX

Funciones:

- redirigir HTTP → HTTPS
- manejar certificados SSL
- proxy hacia Apache

Arquitectura:

Cliente
│
HTTPS
│
Nginx
│
Apache
│
Aplicación PHP

Certificados:

- certificados internos
- CA institucional

---

# 15. SEGURIDAD DE APLICACIÓN

La aplicación debe implementar:

- protección CSRF
- protección XSS
- protección SQL Injection
- validación de entrada
- hashing bcrypt
- control de sesiones
- registro de IP

---

# 16. MÓDULOS DEL SISTEMA

El sistema se construirá como **plataforma modular**.

core
usuarios
expedientes
documentos
workflow
firmas
reportes
auditoría
correo
integraciones

---

# 17. ESCALABILIDAD

(Inferencia)

El sistema debe soportar:

- 1000+ usuarios internos
- cientos de expedientes diarios
- millones de documentos

---

# 18. MÓDULO DE REGISTRO DOCUMENTAL (CORRESPONDENCIA)

Tabla principal:

registro_documental

```sql
CREATE TABLE registro_documental (

    id INT AUTO_INCREMENT PRIMARY KEY,

    registro VARCHAR(120),
    fecha_recepcion DATE,
    numero_programa_incogmar VARCHAR(50),
    tipo_documento VARCHAR(120),
    clasificacion VARCHAR(120),
    numero_documento VARCHAR(120),
    fecha_documento DATE,
    mando_que_gira VARCHAR(150),
    asunto TEXT,
    tramite TEXT,

    usuario_registro INT,
    expediente_id INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

Relaciones:


registro_documental
│
├ expediente_id → expedientes.id
└ usuario_registro → users.id


Flujo:

Recepción del documento

Registro en sistema

Creación automática de expediente

Clasificación

Asignación a área

Generación de trámite

Seguimiento

19. INFRAESTRUCTURA NAS

El sistema debe desplegarse en un NAS institucional.

Funciones:

servidor de aplicación

almacenamiento documental

base de datos

servidor de correo

19.1 Arquitectura Física

Usuarios Intranet
│
HTTPS
│
Firewall institucional
│
NAS institucional
│
├ Nginx Reverse Proxy
├ Apache (XAMPP)
├ Aplicación SIGDI
├ MySQL
├ Repositorio documental
└ Servidor SMTP / IMAP

20. SEGURIDAD BASADA EN ISO/IEC 27001

Principios:

Confidencialidad

Integridad

Disponibilidad

Controles:

control de acceso

auditoría institucional

integridad de documentos

protección de aplicación

21. BACKUPS

Estrategia:

3-2-1 Backup Rule

3 copias de datos

2 medios diferentes

1 copia fuera del sitio

Tipos:

diarios incrementales

semanales completos

mensuales archivados

22. DISASTER RECOVERY

(Inferencia)

Objetivos:

RPO

máxima pérdida de datos:

24 horas

RTO

tiempo máximo de recuperación:

4 horas

Escenario de recuperación:

1 restaurar NAS
2 reinstalar servidor web
3 restaurar base de datos
4 restaurar documentos
5 verificar integridad

23. MODELO DE BASE DE DATOS EMPRESARIAL

El sistema utilizará una base de datos relacional modular.

Dominios principales:

1 Seguridad
2 Organización
3 Expedientes
4 Documentos
5 Correspondencia
6 Workflow
7 Auditoría
8 Notificaciones
9 Correo
10 Configuración

Total aproximado:

150 – 300 tablas.

24. MOTOR DE WORKFLOW TIPO BPMN

Componentes:

Process Engine

Task Manager

State Machine

Workflow Interpreter

Event Dispatcher

Tipos de nodos BPMN:


START_EVENT
TASK
USER_TASK
SERVICE_TASK
EXCLUSIVE_GATEWAY
PARALLEL_GATEWAY
END_EVENT

25. ARQUITECTURA DEL BACKEND

Modelo recomendado:

MONOLITO MODULAR

Motivo:

simplifica despliegue en entornos institucionales.

26. MODELO DE APIs

El sistema expone APIs REST internas.

Formato de respuesta:

{
"status": "success",
"data": {}
}

Total estimado:

100 – 140 endpoints.

27. INTERFAZ WEB

Layout principal:


HEADER
SIDEBAR
CONTENT
FOOTER


Secciones:

Dashboard

Expedientes

Documentos

Procesos

Registro documental

Correo institucional

Reportes

Administración

Auditoría

Configuración

28. SISTEMA DE SEGUIMIENTO CON CONFIRMACIÓN DE LECTURA

Estados del documento:


ENVIADO
RECIBIDO
LEÍDO
IN_PROGRESS
RESPONDED
CLOSED


Esto permite:

control de tiempos administrativos

trazabilidad

cumplimiento institucional

29. SISTEMA DE SEMÁFOROS INSTITUCIONALES

Estados:

VERDE
AMARILLO
ROJO

Lógica:


VERDE → <70% tiempo límite
AMARILLO → 70–100%
ROJO → >100%

30. MODELO DE PERMISOS GUBERNAMENTAL

Se implementa combinación de:

RBAC
ABAC

RBAC:


Usuarios → Roles → Permisos


ABAC:

basado en atributos:

área del usuario

jerarquía

clasificación documental

estado del expediente

31. ALMACENAMIENTO NAS

Estructura:


/nas_storage
│
├ expedientes
├ documentos
├ adjuntos
└ backups


Cada archivo debe usar:

UUID

Ejemplo:


8d72fa34-1123-4bc3-8a12-acde345fa9c2.pdf

32. DIAGRAMA DE INTEGRACIÓN DEL SISTEMA

Usuarios
│
Navegador
│
HTTPS
│
Nginx
│
Backend SIGDI
│
MySQL
│
NAS Storage
│
Backups

33. CONFIRMACIÓN DE ENTREGA TIPO MENSAJERÍA

Estados:

ENVIADO
RECIBIDO
LEÍDO

Esto permite trazabilidad completa.

34. DASHBOARD INSTITUCIONAL

Indicadores:

cumplimiento por área

cumplimiento por funcionario

tiempos promedio de respuesta

semáforo institucional

Objetivo:

mejorar la transparencia y control administrativo.

35. CAPACIDAD DEL SISTEMA

El sistema debe soportar al menos:

100 usuarios simultáneos en intranet

millones de documentos

múltiples procesos administrativos concurrentes
```
