-- Agregar columna google_id a la tabla usuarios
ALTER TABLE usuarios
ADD COLUMN google_id VARCHAR(100) NULL AFTER password,
ADD INDEX idx_google_id (google_id);

-- Modificar la columna password para permitir NULL (para usuarios de Google)
ALTER TABLE usuarios
MODIFY COLUMN password VARCHAR(255) NULL; 