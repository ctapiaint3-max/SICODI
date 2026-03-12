-- SICODI registro_documental schema (based on BASE CORREO 2026.xlsx)
-- Assumptions: MySQL 8+, InnoDB, utf8mb4

CREATE TABLE registro_documental (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registro VARCHAR(120) NULL,
  fecha_recepcion DATE NULL,
  numero_programa_incogmar VARCHAR(50) NULL,
  tipo_documento VARCHAR(120) NULL,
  clasificacion VARCHAR(120) NULL,
  numero_documento VARCHAR(120) NULL,
  fecha_documento DATE NULL,
  mando_que_gira VARCHAR(150) NULL,
  asunto TEXT NULL,
  tramite TEXT NULL,
  usuario_registro INT NULL,
  expediente_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_registro_expediente (expediente_id),
  KEY idx_registro_usuario (usuario_registro),
  CONSTRAINT fk_registro_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id),
  CONSTRAINT fk_registro_usuario FOREIGN KEY (usuario_registro) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
