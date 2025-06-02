USE comunapanal;

-- Primero agregamos la columna google_id
ALTER TABLE usuarios 
ADD COLUMN google_id VARCHAR(100) NULL AFTER password;

-- Luego agregamos las columnas direccion y telefono
ALTER TABLE usuarios 
ADD COLUMN direccion VARCHAR(255) NULL AFTER google_id,
ADD COLUMN telefono VARCHAR(20) NULL AFTER direccion; 