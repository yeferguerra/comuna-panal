-- Agregar columnas de dirección y teléfono a la tabla usuarios
ALTER TABLE usuarios
ADD COLUMN direccion VARCHAR(255) NULL AFTER google_id,
ADD COLUMN telefono VARCHAR(20) NULL AFTER direccion; 