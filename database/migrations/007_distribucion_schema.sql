CREATE TABLE IF NOT EXISTS distribuciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expediente_id INT NULL,
    documento_id INT NULL,
    area_origen_id INT NOT NULL,
    area_destino_id INT NOT NULL,
    usuario_envia_id INT NOT NULL,
    usuario_recibe_id INT NULL,
    estado VARCHAR(50) DEFAULT 'EN_TRANSITO', -- EN_TRANSITO, RECIBIDO, RECHAZADO
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_recepcion TIMESTAMP NULL,
    notas TEXT,
    FOREIGN KEY (area_origen_id) REFERENCES areas(id) ON DELETE CASCADE,
    FOREIGN KEY (area_destino_id) REFERENCES areas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_envia_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_recibe_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE,
    FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE
);

-- Indices para busqueda rapida de distribuciones pendientes
CREATE INDEX idx_distribucion_estado ON distribuciones(estado);
CREATE INDEX idx_distribucion_destino ON distribuciones(area_destino_id, estado);
