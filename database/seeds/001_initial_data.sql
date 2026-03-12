-- ============================================================
-- SICODI - Seed Data Inicial
-- Ejecutar DESPUÉS de 001_core_schema.sql
-- ============================================================

-- 1. Áreas Institucionales base
INSERT IGNORE INTO areas (id, name, code, is_active) VALUES
(1, 'Dirección General',            'DIR_GEN',  1),
(2, 'Tecnología Informática',       'TIC',       1),
(3, 'Departamento Jurídico',        'JURIDICO',  1),
(4, 'Recursos Humanos',             'RRHH',      1),
(5, 'Finanzas y Presupuesto',       'FINANZAS',  1),
(6, 'Secretaría General',           'SEC_GEN',   1);

-- 2. Roles del sistema (RBAC)
INSERT IGNORE INTO roles (id, name, code, description) VALUES
(1, 'Super Administrador', 'SUPERADMIN',  'Control total del sistema'),
(2, 'Director',            'DIRECTOR',    'Aprobación y firma de documentos'),
(3, 'Operador',            'OPERADOR',    'Gestión de expedientes y documentos'),
(4, 'Lector',              'LECTOR',      'Solo lectura de expedientes asignados'),
(5, 'Auditor',             'AUDITOR',     'Acceso a bitácoras y reportes de auditoría');

-- 3. Permisos base del sistema
INSERT IGNORE INTO permissions (name, code, description) VALUES
('Ver Expedientes',         'exp.read',        'Listar y ver expedientes'),
('Crear Expedientes',       'exp.create',      'Crear nuevos expedientes'),
('Editar Expedientes',      'exp.update',      'Modificar expedientes existentes'),
('Archivar Expedientes',    'exp.delete',      'Archivar/cerrar expedientes'),
('Ver Documentos',          'doc.read',        'Listar documentos'),
('Subir Documentos',        'doc.upload',      'Subir archivos al repositorio'),
('Descargar Documentos',    'doc.download',    'Descargar archivos del NAS'),
('Firmar Documentos',       'doc.sign',        'Estampar firma digital'),
('Gestionar Usuarios',      'usr.manage',      'CRUD de usuarios'),
('Ver Auditoría',           'audit.read',      'Acceso a audit_log'),
('Ver Reportes',            'report.read',     'Generar y exportar reportes'),
('Configurar Sistema',      'sys.config',      'Cambiar parámetros del sistema');

-- 4. Asignación de permisos a roles
-- SuperAdmin: todos los permisos
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Director: expedientes + documentos + firma + reportes
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE code IN ('exp.read','exp.create','exp.update','doc.read','doc.upload','doc.download','doc.sign','report.read');

-- Operador: expedientes + documentos básicos
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE code IN ('exp.read','exp.create','exp.update','doc.read','doc.upload','doc.download');

-- Lector: solo lectura
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE code IN ('exp.read','doc.read');

-- Auditor: audit + reportes
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE code IN ('exp.read','doc.read','audit.read','report.read');

-- 5. Usuario administrador por defecto
-- password: admin123 (hash BCrypt)
INSERT IGNORE INTO users (id, username, email, password_hash, full_name, area_id, status) VALUES
(1, 'admin', 'admin@sicodi.intranet',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Administrador del Sistema', 2, 'ACTIVE');

-- 6. Asignar rol SuperAdmin al admin
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1);

-- 7. Expediente de prueba
INSERT IGNORE INTO expedientes (id, codigo, area_id, estado, asunto, prioridad, fecha_apertura, created_by) VALUES
(1, 'EXP-2026-00001', 1, 'EN_PROCESO', 'Revisión de presupuesto institucional primer trimestre', 'ALTA', CURDATE(), 1),
(2, 'EXP-2026-00002', 3, 'INGRESADO',  'Consulta jurídica sobre convenio interinstitucional', 'NORMAL', CURDATE(), 1),
(3, 'EXP-2026-00003', 4, 'RESUELTO',   'Solicitud de vacaciones colectivas - Diciembre 2025', 'BAJA', '2026-01-15', 1);
