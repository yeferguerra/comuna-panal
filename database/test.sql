-- Verificar que la base de datos existe
SHOW DATABASES;

-- Usar la base de datos
USE comunapanal;

-- Verificar que las tablas se crearon
SHOW TABLES;

-- Verificar los roles creados
SELECT * FROM roles_familia;

-- Insertar un usuario de prueba
INSERT INTO usuarios (nombre, apellido, cedula, email, password)
VALUES ('Test', 'User', 'V-12345678', 'test@example.com', 'password123');

-- Obtener el ID del usuario creado
SET @usuario_id = LAST_INSERT_ID();

-- Crear una familia de prueba
CALL crear_nueva_familia('TEST1234', 'Familia de Prueba', @usuario_id);

-- Verificar que la familia se creó
SELECT * FROM familias;

-- Verificar que el usuario se actualizó como jefe de familia
SELECT * FROM usuarios WHERE id = @usuario_id;

-- Verificar que se asignó el rol correcto
SELECT u.nombre, u.apellido, f.nombre_familia, r.nombre as rol
FROM usuarios u
JOIN familias f ON u.familia_id = f.id
JOIN usuario_rol_familia urf ON u.id = urf.usuario_id
JOIN roles_familia r ON urf.rol_id = r.id
WHERE u.id = @usuario_id; 