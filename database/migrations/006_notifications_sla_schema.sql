-- SICODI Migration 006: Notifications, SLA fields, Document Read Status
-- Run after 005_system_config_schema.sql

-- ─────────────────────────────────────────
-- Columnas SLA / Semáforo en tareas
-- ─────────────────────────────────────────
ALTER TABLE tareas
  ADD COLUMN fecha_vencimiento DATETIME NULL AFTER due_date,
  ADD COLUMN sla_horas INT NOT NULL DEFAULT 48 AFTER fecha_vencimiento,
  ADD COLUMN semaforo ENUM('VERDE','AMARILLO','ROJO') NOT NULL DEFAULT 'VERDE' AFTER sla_horas;

-- ─────────────────────────────────────────
-- Notificaciones in-app
-- ─────────────────────────────────────────
CREATE TABLE notifications (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  tipo        VARCHAR(60) NOT NULL DEFAULT 'INFO',   -- INFO | ALERTA | TAREA | SLA
  titulo      VARCHAR(200) NOT NULL,
  mensaje     TEXT NULL,
  leida       TINYINT(1) NOT NULL DEFAULT 0,
  url_accion  VARCHAR(500) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at     DATETIME NULL,
  KEY idx_notifications_user_leida (user_id, leida),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─────────────────────────────────────────
-- Confirmación de lectura de documentos
-- ─────────────────────────────────────────
CREATE TABLE document_read_status (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  documento_id  BIGINT NOT NULL,
  user_id       INT NOT NULL,
  estado        ENUM('ENVIADO','RECIBIDO','LEIDO','IN_PROGRESS','RESPONDED','CLOSED')
                NOT NULL DEFAULT 'ENVIADO',
  sent_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_at   DATETIME NULL,
  read_at       DATETIME NULL,
  responded_at  DATETIME NULL,
  UNIQUE KEY uq_doc_read_user (documento_id, user_id),
  KEY idx_doc_read_doc (documento_id),
  KEY idx_doc_read_user (user_id),
  CONSTRAINT fk_doc_read_doc  FOREIGN KEY (documento_id) REFERENCES documentos(id),
  CONSTRAINT fk_doc_read_user FOREIGN KEY (user_id)      REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─────────────────────────────────────────
-- Índices de rendimiento para escala
-- ─────────────────────────────────────────
CREATE INDEX idx_expedientes_estado       ON expedientes (estado);
CREATE INDEX idx_expedientes_prioridad    ON expedientes (prioridad);
CREATE INDEX idx_expedientes_fecha        ON expedientes (fecha_apertura);
CREATE INDEX idx_documentos_tipo_estado   ON documentos  (tipo, estado);
CREATE INDEX idx_documentos_created       ON documentos  (created_at);
CREATE INDEX idx_tareas_semaforo          ON tareas      (semaforo, estado);
CREATE INDEX idx_tareas_vencimiento       ON tareas      (fecha_vencimiento);
CREATE INDEX idx_audit_created            ON audit_log   (created_at);
CREATE INDEX idx_registro_fecha_recepcion ON registro_documental (fecha_recepcion);
