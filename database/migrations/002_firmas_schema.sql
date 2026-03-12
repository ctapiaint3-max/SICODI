-- Migración para la tabla Firmas (Digital Signature)

CREATE TABLE firmas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  documento_version_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  hash_firma VARCHAR(256) NOT NULL,
  hash_documento VARCHAR(256) NOT NULL,
  certificado_serial VARCHAR(120) NULL,
  fecha_firma DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NOT NULL,
  valido TINYINT(1) NOT NULL DEFAULT 1,
  
  KEY idx_firmas_documento (documento_version_id),
  KEY idx_firmas_user (user_id),
  CONSTRAINT fk_firmas_doc_version FOREIGN KEY (documento_version_id) REFERENCES documento_version(id),
  CONSTRAINT fk_firmas_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
