-- Migración para la tabla Mail Messages (Registro de Envíos Institucionales)

CREATE TABLE mail_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  to_email VARCHAR(150) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, FAILED
  error_log TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
