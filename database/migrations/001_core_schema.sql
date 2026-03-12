-- SICODI core schema v1
-- Assumptions: MySQL 8+, InnoDB, utf8mb4, app stores UTC timestamps

CREATE TABLE areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(50) NOT NULL,
  parent_id INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_areas_code (code),
  CONSTRAINT fk_areas_parent FOREIGN KEY (parent_id) REFERENCES areas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  area_id INT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_area (area_id),
  CONSTRAINT fk_users_area FOREIGN KEY (area_id) REFERENCES areas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  KEY idx_role_permissions_perm (permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_role_permissions_perm FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sessions (
  id CHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id VARCHAR(120) NULL,
  ip_address VARCHAR(45) NOT NULL,
  old_data JSON NULL,
  new_data JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_user (user_id),
  KEY idx_audit_entity (entity_type, entity_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE expedientes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL,
  area_id INT NOT NULL,
  estado VARCHAR(40) NOT NULL,
  asunto VARCHAR(200) NOT NULL,
  descripcion TEXT NULL,
  prioridad VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  fecha_apertura DATE NOT NULL,
  fecha_cierre DATE NULL,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_expedientes_codigo (codigo),
  KEY idx_expedientes_area_estado (area_id, estado),
  CONSTRAINT fk_expedientes_area FOREIGN KEY (area_id) REFERENCES areas(id),
  CONSTRAINT fk_expedientes_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE expediente_historial (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  expediente_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  estado_anterior VARCHAR(40) NULL,
  estado_nuevo VARCHAR(40) NOT NULL,
  accion VARCHAR(120) NOT NULL,
  observaciones TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_historial_expediente (expediente_id),
  CONSTRAINT fk_historial_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id),
  CONSTRAINT fk_historial_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE documentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  expediente_id BIGINT NULL,
  titulo VARCHAR(200) NOT NULL,
  tipo VARCHAR(120) NOT NULL,
  clasificacion VARCHAR(120) NOT NULL,
  estado VARCHAR(40) NOT NULL,
  current_version_id BIGINT NULL,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_documentos_expediente (expediente_id),
  CONSTRAINT fk_documentos_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id),
  CONSTRAINT fk_documentos_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE documento_version (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  documento_id BIGINT NOT NULL,
  version_num INT NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  storage_hash VARCHAR(128) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_documento_version (documento_id, version_num),
  KEY idx_documento_version_doc (documento_id),
  CONSTRAINT fk_documento_version_doc FOREIGN KEY (documento_id) REFERENCES documentos(id),
  CONSTRAINT fk_documento_version_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE documentos
  ADD CONSTRAINT fk_documentos_current_version
  FOREIGN KEY (current_version_id) REFERENCES documento_version(id);

CREATE TABLE procesos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  expediente_id BIGINT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  definition_key VARCHAR(100) NOT NULL,
  estado VARCHAR(40) NOT NULL,
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_procesos_expediente (expediente_id),
  CONSTRAINT fk_procesos_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id),
  CONSTRAINT fk_procesos_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tareas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  proceso_id BIGINT NOT NULL,
  expediente_id BIGINT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT NULL,
  estado VARCHAR(40) NOT NULL,
  prioridad VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  assigned_to INT NULL,
  due_date DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tareas_proceso (proceso_id),
  KEY idx_tareas_expediente (expediente_id),
  KEY idx_tareas_assigned (assigned_to, estado),
  CONSTRAINT fk_tareas_proceso FOREIGN KEY (proceso_id) REFERENCES procesos(id),
  CONSTRAINT fk_tareas_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id),
  CONSTRAINT fk_tareas_user FOREIGN KEY (assigned_to) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
