-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS comunapanal;
USE comunapanal;

-- Tabla de Familias
CREATE TABLE IF NOT EXISTS familias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identificador VARCHAR(8) UNIQUE NOT NULL,
    nombre_familia VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT TRUE,
    INDEX idx_identificador (identificador)
);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(25) NOT NULL,
    apellido VARCHAR(25) NOT NULL,
    cedula VARCHAR(20) NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    familia_id INT,
    es_jefe_familia BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (familia_id) REFERENCES familias(id),
    INDEX idx_cedula (cedula),
    INDEX idx_email (email)
);

-- Tabla de Roles de Usuario en la Familia
CREATE TABLE IF NOT EXISTS roles_familia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    UNIQUE KEY unique_nombre (nombre)
);

-- Tabla de Relación Usuario-Rol en Familia
CREATE TABLE IF NOT EXISTS usuario_rol_familia (
    usuario_id INT,
    familia_id INT,
    rol_id INT,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, familia_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (familia_id) REFERENCES familias(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES roles_familia(id)
);

-- Tabla de Solicitudes Pendientes de Unión a Familia
CREATE TABLE IF NOT EXISTS pending_family_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL, -- El usuario que solicita unirse
    familia_id INT NOT NULL, -- La familia a la que solicita unirse
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'aceptada', 'rechazada') DEFAULT 'pendiente',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (familia_id) REFERENCES familias(id) ON DELETE CASCADE,
    UNIQUE KEY unique_pending_request (usuario_id, familia_id) -- Un usuario solo puede tener una solicitud pendiente por familia
);

-- Insertar roles básicos
INSERT INTO roles_familia (nombre, descripcion) VALUES
('JEFE_FAMILIA', 'Jefe de la familia, tiene control total sobre la familia'),
('ADULTO', 'Miembro adulto de la familia'),
('JOVEN', 'Miembro joven de la familia (entre 12 y 17 años)'),
('NINO', 'Miembro niño de la familia (menor de 12 años)');

-- Procedimiento almacenado para crear una nueva familia
DELIMITER //
CREATE PROCEDURE crear_nueva_familia(
    IN p_identificador VARCHAR(8),
    IN p_nombre_familia VARCHAR(100),
    IN p_jefe_id INT
)
BEGIN
    DECLARE v_familia_id INT;
    
    -- Insertar nueva familia
    INSERT INTO familias (identificador, nombre_familia)
    VALUES (p_identificador, p_nombre_familia);
    
    -- Obtener el ID de la familia creada
    SET v_familia_id = LAST_INSERT_ID();
    
    -- Actualizar el usuario como jefe de familia
    UPDATE usuarios 
    SET familia_id = v_familia_id,
        es_jefe_familia = TRUE
    WHERE id = p_jefe_id;
    
    -- Asignar rol de jefe de familia
    INSERT INTO usuario_rol_familia (usuario_id, familia_id, rol_id)
    SELECT p_jefe_id, v_familia_id, id
    FROM roles_familia
    WHERE nombre = 'JEFE_FAMILIA';
END //
DELIMITER ;

-- Procedimiento almacenado para agregar miembro a familia existente
DELIMITER //
CREATE PROCEDURE agregar_miembro_familia(
    IN p_usuario_id INT,
    IN p_identificador_familia VARCHAR(8),
    IN p_rol_nombre VARCHAR(50)
)
BEGIN
    DECLARE v_familia_id INT;
    DECLARE v_rol_id INT;
    
    -- Obtener ID de la familia
    SELECT id INTO v_familia_id
    FROM familias
    WHERE identificador = p_identificador_familia
    AND activa = TRUE;
    
    -- Obtener ID del rol
    SELECT id INTO v_rol_id
    FROM roles_familia
    WHERE nombre = p_rol_nombre;
    
    -- Actualizar usuario con la familia
    UPDATE usuarios 
    SET familia_id = v_familia_id
    WHERE id = p_usuario_id;
    
    -- Asignar rol en la familia
    INSERT INTO usuario_rol_familia (usuario_id, familia_id, rol_id)
    VALUES (p_usuario_id, v_familia_id, v_rol_id);
END //
DELIMITER ;

-- Agregar columna fecha_nacimiento a la tabla usuarios
-- Modificado para permitir valores NULL en filas existentes
ALTER TABLE usuarios
ADD COLUMN fecha_nacimiento DATE NULL AFTER password; 