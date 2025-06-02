const jwt = require('jsonwebtoken');
// const User = require('../models/User'); // Eliminar importación de Mongoose
const config = require('../config/config');
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Importar el pool de conexiones a MySQL
const passport = require('passport');

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

// Función auxiliar para calcular la edad
function calcularEdad(fechaNacimiento) {
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }
    
    return edad;
}

// Registrar nuevo usuario
const register = async (req, res) => {
    let connection; // Declarar variable de conexión
    try {
        connection = await db.getConnection(); // Obtener conexión del pool
        await connection.beginTransaction(); // Iniciar transacción

        const { email, password, nombre, apellido, cedula, tipoRegistro, identificadorFamiliar, direccion, telefono, fechaNacimiento } = req.body;

        // Validar Fecha de Nacimiento y edad en el backend (validación de seguridad)
        if (!fechaNacimiento) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'La fecha de nacimiento es obligatoria.' });
        }

        const age = calcularEdad(fechaNacimiento);
        
        if (age < 5) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Debes tener al menos 5 años para registrarte.' });
        } else if (tipoRegistro === 'nueva' && age < 18) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Debes tener al menos 18 años para registrar una nueva familia.' });
        }

        // Validar si el usuario ya existe por email o cédula (solo si tiene 10 años o más)
        let existingUserQuery = 'SELECT id, email, cedula FROM usuarios WHERE email = ?';
        let queryParams = [email];

        if (age >= 10 && cedula) {
            existingUserQuery += ' OR cedula = ?';
            queryParams.push(cedula);
        }

        const [existingUser] = await connection.execute(existingUserQuery, queryParams);

        if (existingUser.length > 0) {
            await connection.rollback();
            connection.release();
            
            // Verificar específicamente qué campo está duplicado
            const emailExists = existingUser.some(user => user.email === email);
            const cedulaExists = age >= 10 && cedula && existingUser.some(user => user.cedula === cedula);
            
            if (emailExists && cedulaExists) {
                return res.status(400).json({ error: 'El correo electrónico y la cédula ya están registrados.' });
            } else if (emailExists) {
                return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
            } else if (cedulaExists) {
                return res.status(400).json({ error: 'La cédula ya está registrada.' });
            }
        }

        // Hashear la contraseña solo si no viene de Google
        let hashedPassword = null;
        if (!req.body.google_id) {
            if (!password) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: 'La contraseña es obligatoria para registro normal.' });
            }
            hashedPassword = await bcrypt.hash(password, 10);
        }

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

            // Insertar el nuevo usuario (ahora incluyendo fecha_nacimiento y google_id)
            const [usuarioResult] = await connection.execute(
                'INSERT INTO usuarios (nombre, apellido, cedula, email, password, fecha_nacimiento, familia_id, es_jefe_familia, direccion, telefono, google_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [nombre, apellido, age >= 10 ? cedula : null, email, hashedPassword, fechaNacimiento, familiaId, esJefeFamilia, direccion, telefono, req.body.google_id || null]
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

            // Insertar el nuevo usuario (sin familia_id ni es_jefe_familia por ahora, pero con fecha_nacimiento y google_id)
            const [usuarioResult] = await connection.execute(
                'INSERT INTO usuarios (nombre, apellido, cedula, email, password, fecha_nacimiento, direccion, telefono, google_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [nombre, apellido, age >= 10 ? cedula : null, email, hashedPassword, fechaNacimiento, direccion, telefono, req.body.google_id || null]
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
        const userResponse = { id: nuevoUsuarioId, email: email, nombre: nombre, apellido: apellido };

        // Incluir identificador familiar en la respuesta/redirección si se creó una nueva familia
        if (tipoRegistro === 'nueva' && generadoIdentificador) {
            userResponse.identificadorFamiliar = generadoIdentificador;
            console.log('Nuevo registro con familia, identificador:', generadoIdentificador); // Log para verificar
        }

        connection.release(); // Liberar conexión antes de enviar respuesta/redirigir

        // Modificar para enviar respuesta JSON en lugar de redirigir
        console.log('Registro completado, enviando respuesta JSON...'); // Log para verificar
        res.status(201).json({ 
            message: 'Registro exitoso',
            user: userResponse, // Incluir datos básicos del usuario y el identificador si aplica
            // Puedes incluir el token aquí si quieres loguearlo automáticamente después del registro
            // token: token // <-- Descomentar si quieres login automático después de registro
        });

        // Las redirecciones se manejarán ahora en el frontend después de recibir este JSON

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Revertir transacción en caso de error
            connection.release(); // Liberar conexión
        }
        console.error('Error en el registro:', error);
        // Mejorar el mensaje de error para el frontend si es posible
        const errorMessage = error.sqlMessage || error.message || 'Error en el registro de usuario.';
        res.status(500).json({ error: errorMessage });
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

        // Redirigir a la página de home del usuario con el token
        res.redirect(`/user-home?token=${token}`);

    } catch (error) {
        if (connection) connection.release();
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// @desc    Get user data by token
// @route   GET /api/auth/me
// @access  Private
const getUser = async (req, res) => {
    console.log('authController.getUser: Iniciado.'); // Log
    console.log('authController.getUser: req.user (del middleware auth):', req.user); // Log
    try {
        // El middleware auth ya ha adjuntado el usuario autenticado a req.user
        // Si req.user contiene solo el ID (serialización), necesitamos obtener los datos completos
        // Si req.user ya contiene los datos completos (deserialización/Google), usar esos

        let userData = req.user;

        // Si req.user es solo el ID, buscar en la BD
        if (userData && typeof userData.id === 'number') {
             console.log('authController.getUser: req.user es un ID numérico, buscando en BD...', userData.id); // Log
            const connection = await db.getConnection();
            const [users] = await connection.execute(
                'SELECT id, nombre, apellido, email, cedula, familia_id, es_jefe_familia FROM usuarios WHERE id = ?',
                [userData.id]
            );
            connection.release();

            if (users.length === 0) {
                 console.log('authController.getUser: Usuario no encontrado en BD para ID:', userData.id); // Log
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            userData = users[0];
             console.log('authController.getUser: Datos de usuario obtenidos de BD:', userData); // Log
        } else if (userData && userData.email && userData.google_id) {
             // Si req.user ya parece ser un objeto de datos de Google (nuevo usuario)
             console.log('authController.getUser: req.user parece ser un objeto de datos de Google (nuevo usuario):', userData); // Log
             // No buscamos en BD aquí, ya tenemos los datos temporales.
             // Nota: Un usuario de Google registrado *existente* debería tener req.user.id
        } else {
             console.log('authController.getUser: req.user no tiene el formato esperado:', userData); // Log
            return res.status(401).json({ error: 'Usuario no autenticado o datos inválidos' });
        }
        
        // Aquí, userData debería contener los datos del usuario a enviar al frontend
        console.log('authController.getUser: Enviando datos de usuario al frontend:', userData); // Log final antes de enviar respuesta
        res.json(userData);

    } catch (error) {
        console.error('authController.getUser: Error en el controlador:', error);
        res.status(500).json({ error: 'Error al obtener datos del usuario' });
    }
};

// Las funciones getProfile, updateProfile y logout pueden necesitar ajustes dependiendo de su uso exacto y los datos requeridos
// getProfile y updateProfile probablemente ya no necesitan .populate('familiares') si esa relación se maneja de forma diferente en MySQL
// updateProfile necesitará lógica para actualizar en la tabla usuarios y posiblemente hashear la nueva contraseña

// La función logout en general no interactúa con la base de datos en este enfoque (solo manejo de token en frontend)

// Rutas de autenticación con Google
const googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email']
});

const googleCallback = passport.authenticate('google', {
    failureRedirect: '/login',
    successRedirect: '/dashboard'
});

module.exports = {
    register,
    login,
    // getProfile, // Comentadas por ahora, requerirán revisión
    // updateProfile, // Comentadas por ahora, requerirán revisión
    // logout, // Comentada por ahora, requerirá revisión
    getUser,
    googleAuth,
    googleCallback
};