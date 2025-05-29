const jwt = require('jsonwebtoken');
// const User = require('../models/User'); // Eliminar importación de Mongoose
const config = require('../config/config');
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Importar el pool de conexiones a MySQL

// Generar token JWT
const generateToken = (userId) => {
    // Asegurarse de que el payload solo contenga información necesaria y no sensible
    return jwt.sign({ id: userId }, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiration
    });
};

// Función auxiliar para generar identificador familiar (si no lo manejamos en el frontend)
function generarIdentificadorFamiliar() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let identificador = '';
    for (let i = 0; i < 8; i++) {
        identificador += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return identificador;
}

// Registrar nuevo usuario
const register = async (req, res) => {
    let connection; // Declarar variable de conexión
    try {
        connection = await db.getConnection(); // Obtener conexión del pool
        await connection.beginTransaction(); // Iniciar transacción

        const { email, password, nombre, apellido, cedula, tipoRegistro, identificadorFamiliar, direccion, telefono, fechaNacimiento } = req.body;

        // Validar Fecha de Nacimiento y edad en el backend (validación de seguridad)
        const fechaNacimientoDate = new Date(fechaNacimiento);
        const today = new Date();
        const age = today.getFullYear() - fechaNacimientoDate.getFullYear();
        const monthDiff = today.getMonth() - fechaNacimientoDate.getMonth();
        
        // Ajuste por si aún no ha cumplido años en el mes actual
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < fechaNacimientoDate.getDate())) {
            age--;
        }

        if (!fechaNacimiento) {
             await connection.rollback();
             connection.release();
             return res.status(400).json({ error: 'La fecha de nacimiento es obligatoria.' });
        } else if (age < 5) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Debes tener al menos 5 años para registrarte.' });
        } else if (tipoRegistro === 'nueva' && age < 18) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Debes tener al menos 18 años para registrar una nueva familia.' });
        }

        // Validar si el usuario ya existe por email o cédula (solo si tiene 10 años o más)
        let existingUserQuery = 'SELECT id FROM usuarios WHERE email = ?';
        let queryParams = [email];

        if (age >= 10 && cedula) {
            existingUserQuery += ' OR cedula = ?';
            queryParams.push(cedula);
        }

        const [existingUser] = await connection.execute(existingUserQuery, queryParams);

        if (existingUser.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'El correo electrónico o la cédula ya están registrados.' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        let familiaId = null;
        let esJefeFamilia = false;
        let nuevoUsuarioId = null;
        let generadoIdentificador = null;

        if (tipoRegistro === 'nueva') {
            // --- Registro como jefe de nueva familia ---
            esJefeFamilia = true;
            generadoIdentificador = generarIdentificadorFamiliar();

            // Insertar nueva familia
            const [familiaResult] = await connection.execute(
                'INSERT INTO familias (identificador, nombre_familia) VALUES (?, ?)',
                [generadoIdentificador, `Familia ${apellido}`]
            );
            familiaId = familiaResult.insertId;

            // Insertar el nuevo usuario (ahora incluyendo fecha_nacimiento)
            const [usuarioResult] = await connection.execute(
                'INSERT INTO usuarios (nombre, apellido, cedula, email, password, fecha_nacimiento, familia_id, es_jefe_familia, direccion, telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [nombre, apellido, age >= 10 ? cedula : null, email, hashedPassword, fechaNacimiento, familiaId, esJefeFamilia, direccion, telefono]
            );
            nuevoUsuarioId = usuarioResult.insertId;

            // Asignar rol de JEFE_FAMILIA
            const [rolJefe] = await connection.execute(
                'SELECT id FROM roles_familia WHERE nombre = ?',
                ['JEFE_FAMILIA']
            );

            if (rolJefe.length > 0) {
                await connection.execute(
                    'INSERT INTO usuario_rol_familia (usuario_id, familia_id, rol_id) VALUES (?, ?, ?)',
                    [nuevoUsuarioId, familiaId, rolJefe[0].id]
                );
            } else {
                console.warn("Rol 'JEFE_FAMILIA' no encontrado.");
            }

        } else if (tipoRegistro === 'existente') {
            // --- Registro como miembro de familia existente ---
            if (!identificadorFamiliar) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: 'Se requiere el identificador familiar para unirse a una familia existente.' });
            }

            // Buscar la familia por identificador
            const [familiaExistente] = await connection.execute(
                'SELECT id FROM familias WHERE identificador = ? AND activa = TRUE',
                [identificadorFamiliar]
            );

            if (familiaExistente.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ error: 'Familia no encontrada o inactiva.' });
            }

            familiaId = familiaExistente[0].id;

            // Insertar el nuevo usuario (sin familia_id ni es_jefe_familia por ahora, pero con fecha_nacimiento)
            const [usuarioResult] = await connection.execute(
                'INSERT INTO usuarios (nombre, apellido, cedula, email, password, fecha_nacimiento, direccion, telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [nombre, apellido, age >= 10 ? cedula : null, email, hashedPassword, fechaNacimiento, direccion, telefono]
            );
            nuevoUsuarioId = usuarioResult.insertId;

            // Crear solicitud pendiente
            await connection.execute(
                'INSERT INTO pending_family_requests (usuario_id, familia_id) VALUES (?, ?)',
                [nuevoUsuarioId, familiaId]
            );
        } else {
            // Tipo de registro inválido
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Tipo de registro inválido.' });
        }

        await connection.commit(); // Confirmar transacción

        // Generar token para el nuevo usuario
        const token = generateToken(nuevoUsuarioId);

        // Obtener los datos del usuario recién creado para la respuesta
        const [newUser] = await connection.execute(
            'SELECT id, nombre, apellido, cedula, email, familia_id, es_jefe_familia, fecha_nacimiento FROM usuarios WHERE id = ?',
            [nuevoUsuarioId]
        );

        connection.release(); // Liberar conexión

        const userResponse = newUser[0];

        // Incluir identificador familiar en la respuesta si se creó una nueva familia
        if (tipoRegistro === 'nueva') {
            userResponse.identificadorFamiliar = generadoIdentificador;
            res.status(201).json({ message: 'Registro exitoso. ¡Nueva familia creada!', user: userResponse, token });
        } else {
            res.status(201).json({ message: 'Solicitud de unión a familia enviada. Esperando aprobación del jefe de familia.', user: userResponse, token });
        }

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Revertir transacción en caso de error
            connection.release(); // Liberar conexión
        }
        console.error('Error en el registro:', error);
        res.status(500).json({ error: 'Error en el registro de usuario.' });
    }
};

// Modificar la función login para obtener datos del usuario de MySQL
const login = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();

        const { email, password } = req.body;

        // Buscar usuario por email
        const [users] = await connection.execute(
            'SELECT id, email, password, nombre, apellido, cedula, familia_id, es_jefe_familia FROM usuarios WHERE email = ? LIMIT 1',
            [email]
        );
        const user = users[0];

        if (!user) {
            connection.release();
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Comparar la contraseña hasheada
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            connection.release();
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Generar token con ID de usuario (de MySQL) y rol (si lo recuperamos o calculamos)
        // Aquí podrías añadir más datos al payload si los necesitas en el frontend
        const token = generateToken(user.id); // Usar user.id de MySQL

        // TODO: Actualizar ultimo_acceso en la tabla usuarios

        connection.release();

        res.json({ token });
    } catch (error) {
        if (connection) connection.release();
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Modificar la función getUser para obtener datos del usuario de MySQL
const getUser = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        // req.user.id debe venir del middleware de autenticación que usa el token JWT
        const userId = req.user.id;

        // Buscar usuario por ID, excluyendo la contraseña
        const [users] = await connection.execute(
            'SELECT id, nombre, apellido, cedula, email, familia_id, es_jefe_familia FROM usuarios WHERE id = ? LIMIT 1',
            [userId]
        );

        const user = users[0];

        if (!user) {
            connection.release();
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // TODO: Opcional: Obtener familiares asociados a esta familia si es necesario en el perfil
        // Esto podría ser otra consulta a la tabla usuarios con el mismo familia_id

        connection.release();

        res.json(user); // Devolver los datos del usuario

    } catch (error) {
        if (connection) connection.release();
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Las funciones getProfile, updateProfile y logout pueden necesitar ajustes dependiendo de su uso exacto y los datos requeridos
// getProfile y updateProfile probablemente ya no necesiten .populate('familiares') si esa relación se maneja de forma diferente en MySQL
// updateProfile necesitará lógica para actualizar en la tabla usuarios y posiblemente hashear la nueva contraseña

// La función logout en general no interactúa con la base de datos en este enfoque (solo manejo de token en frontend)

module.exports = {
    register,
    login,
    // getProfile, // Comentadas por ahora, requerirán revisión
    // updateProfile, // Comentadas por ahora, requerirán revisión
    // logout, // Comentada por ahora, requerirá revisión
    getUser
};