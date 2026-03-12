-- Migración para la tabla de Correspondencia Oficial / Registro Documental

CREATE TABLE registro_documental (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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
    expediente_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_regdoc_usuario (usuario_registro),
    KEY idx_regdoc_exp (expediente_id),
    CONSTRAINT fk_regdoc_usuario FOREIGN KEY (usuario_registro) REFERENCES users(id),
    CONSTRAINT fk_regdoc_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
