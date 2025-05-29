const db = require('../config/db'); // Importamos el pool de conexiones a MySQL

// Añadir un nuevo familiar (usuario) a la familia del usuario autenticado
const addFamiliar = async (req, res) => {
    let connection; // Declaramos la variable de conexión aquí
    try {
        // Obtener una conexión del pool
        connection = await db.getConnection();

        // El usuario autenticado está disponible en req.user gracias al middleware de autenticación
        // Suponemos que req.user ahora contiene los datos del usuario obtenidos de MySQL, incluyendo familia_id
        const jefeFamiliaId = req.user.id; // El ID del usuario loggeado

        // Obtener el ID de la familia del usuario autenticado
        const [jefeFamilia] = await connection.execute(
            'SELECT familia_id FROM usuarios WHERE id = ?',
            [jefeFamiliaId]
        );

        if (!jefeFamilia || !jefeFamilia[0] || !jefeFamilia[0].familia_id) {
            connection.release(); // Liberar conexión antes de retornar
            return res.status(400).json({ error: 'El usuario autenticado no pertenece a ninguna familia.' });
        }

        const familiaId = jefeFamilia[0].familia_id;

        // Obtener los datos del nuevo familiar (que será un nuevo usuario)
        const { nombre, apellido, cedula, email, password, rolNombre } = req.body; // Asumimos que se envían estos datos

        // TODO: Aquí deberías hashear la contraseña antes de guardarla
        const hashedPassword = password; // Placeholder: Usar bcrypt aquí

        // Insertar el nuevo usuario en la tabla usuarios
        const [result] = await connection.execute(
            'INSERT INTO usuarios (nombre, apellido, cedula, email, password, familia_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellido, cedula, email, hashedPassword, familiaId]
        );

        const nuevoUsuarioId = result.insertId;

        // Opcional: Asignar un rol al nuevo miembro en la tabla usuario_rol_familia
        if (rolNombre) {
            // Obtener el ID del rol
            const [rol] = await connection.execute(
                'SELECT id FROM roles_familia WHERE nombre = ?',
                [rolNombre]
            );

            if (rol && rol[0]) {
                const rolId = rol[0].id;
                await connection.execute(
                    'INSERT INTO usuario_rol_familia (usuario_id, familia_id, rol_id) VALUES (?, ?, ?)',
                    [nuevoUsuarioId, familiaId, rolId]
                );
            } else {
                console.warn(`Rol '${rolNombre}' no encontrado.`); // O manejar como error si el rol es obligatorio
            }
        }

        // Confirmar la transacción si usas transacciones (no implementado aquí para simplicidad inicial)
        // await connection.commit();

        // Obtener los datos del nuevo usuario/familiar para la respuesta
        const [nuevoUsuario] = await connection.execute(
            'SELECT id, nombre, apellido, cedula, email, familia_id FROM usuarios WHERE id = ?',
            [nuevoUsuarioId]
        );

        connection.release(); // Liberar la conexión

        res.status(201).json({ message: 'Familiar añadido exitosamente', familiar: nuevoUsuario[0] });
    } catch (error) {
        // Revertir la transacción si usas transacciones
        // if (connection) await connection.rollback();

        if (connection) connection.release(); // Liberar la conexión en caso de error
        console.error('Error al añadir familiar:', error);
        res.status(500).json({ error: 'Error al añadir familiar.' });
    }
};

// Obtener todos los familiares de la familia del usuario autenticado
const getFamiliares = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const userId = req.user.id; // ID del usuario loggeado

        // Obtener el ID de la familia del usuario autenticado
        const [jefeFamilia] = await connection.execute(
            'SELECT familia_id FROM usuarios WHERE id = ?',
            [userId]
        );

        if (!jefeFamilia || !jefeFamilia[0] || !jefeFamilia[0].familia_id) {
            connection.release();
            return res.status(400).json({ error: 'El usuario autenticado no pertenece a ninguna familia.' });
        }

        const familiaId = jefeFamilia[0].familia_id;

        // Buscar todos los usuarios (familiares) con el mismo familia_id, excluyendo al usuario actual si deseas
        const [familiares] = await connection.execute(
            'SELECT id, nombre, apellido, cedula, email FROM usuarios WHERE familia_id = ?',
            [familiaId]
        );

        connection.release();

        res.json(familiares);
    } catch (error) {
        if (connection) connection.release();
        console.error('Error al obtener familiares:', error);
        res.status(500).json({ error: 'Error al obtener familiares.' });
    }
};

// Obtener un familiar (usuario) por su ID y que pertenezca a la familia del usuario autenticado
const getFamiliarById = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const familiarId = req.params.id; // ID del familiar a buscar
        const userId = req.user.id; // ID del usuario loggeado

        // Obtener el ID de la familia del usuario autenticado
        const [jefeFamilia] = await connection.execute(
            'SELECT familia_id FROM usuarios WHERE id = ?',
            [userId]
        );

        if (!jefeFamilia || !jefeFamilia[0] || !jefeFamilia[0].familia_id) {
            connection.release();
            return res.status(400).json({ error: 'El usuario autenticado no pertenece a ninguna familia.' });
        }

        const familiaId = jefeFamilia[0].familia_id;

        // Buscar el usuario/familiar por su ID y asegurarse de que pertenezca a la misma familia
        const [familiar] = await connection.execute(
            'SELECT id, nombre, apellido, cedula, email FROM usuarios WHERE id = ? AND familia_id = ?',
            [familiarId, familiaId]
        );

        if (!familiar || familiar.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Familiar no encontrado o no pertenece a tu familia.' });
        }

        connection.release();

        res.json(familiar[0]);
    } catch (error) {
        if (connection) connection.release();
        console.error('Error al obtener familiar por ID:', error);
        res.status(500).json({ error: 'Error al obtener familiar.' });
    }
};

// Actualizar un familiar (usuario) por su ID y que pertenezca a la familia del usuario autenticado
const updateFamiliar = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const familiarId = req.params.id; // ID del familiar a actualizar
        const userId = req.user.id; // ID del usuario loggeado
        const updates = req.body; // Datos a actualizar
        const allowedUpdates = ['nombre', 'apellido', 'cedula', 'email', 'password']; // Campos permitidos para actualizar

        // Construir la parte de la consulta SQL para actualizar
        const updateKeys = Object.keys(updates).filter(key => allowedUpdates.includes(key));
        if (updateKeys.length === 0) {
            connection.release();
            return res.status(400).json({ error: 'No se proporcionaron campos válidos para actualizar.' });
        }

        // TODO: Si se actualiza la contraseña, ¡debe ser hasheada!
        if (updates.password) {
            updates.password = updates.password; // Placeholder: Usar bcrypt aquí
        }

        const setClauses = updateKeys.map(key => `\`${key}\` = ?`).join(', ');
        const updateValues = updateKeys.map(key => updates[key]);

        // Obtener el ID de la familia del usuario autenticado
        const [jefeFamilia] = await connection.execute(
            'SELECT familia_id FROM usuarios WHERE id = ?',
            [userId]
        );

        if (!jefeFamilia || !jefeFamilia[0] || !jefeFamilia[0].familia_id) {
            connection.release();
            return res.status(400).json({ error: 'El usuario autenticado no pertenece a ninguna familia.' });
        }

        const familiaId = jefeFamilia[0].familia_id;

        // Ejecutar la consulta UPDATE, asegurándose de que el usuario a actualizar pertenezca a la misma familia
        const [result] = await connection.execute(
            `UPDATE usuarios SET ${setClauses} WHERE id = ? AND familia_id = ?`,
            [...updateValues, familiarId, familiaId]
        );

        if (result.affectedRows === 0) {
            connection.release();
            return res.status(404).json({ error: 'Familiar no encontrado o no pertenece a tu familia.' });
        }

        connection.release();

        res.json({ message: 'Familiar actualizado exitosamente.' });
    } catch (error) {
        if (connection) connection.release();
        console.error('Error al actualizar familiar:', error);
        res.status(500).json({ error: 'Error al actualizar familiar.' });
    }
};

// Eliminar un familiar (usuario) por su ID y que pertenezca a la familia del usuario autenticado
const deleteFamiliar = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const familiarId = req.params.id; // ID del familiar a eliminar
        const userId = req.user.id; // ID del usuario loggeado

        // Obtener el ID de la familia del usuario autenticado
        const [jefeFamilia] = await connection.execute(
            'SELECT familia_id FROM usuarios WHERE id = ?',
            [userId]
        );

        if (!jefeFamilia || !jefeFamilia[0] || !jefeFamilia[0].familia_id) {
            connection.release();
            return res.status(400).json({ error: 'El usuario autenticado no pertenece a ninguna familia.' });
        }

        const familiaId = jefeFamilia[0].familia_id;

        // Ejecutar la consulta DELETE, asegurándose de que el usuario a eliminar pertenezca a la misma familia
        const [result] = await connection.execute(
            'DELETE FROM usuarios WHERE id = ? AND familia_id = ?',
            [familiarId, familiaId]
        );

        if (result.affectedRows === 0) {
            connection.release();
            return res.status(404).json({ error: 'Familiar no encontrado o no pertenece a tu familia.' });
        }

        connection.release();

        res.json({ message: 'Familiar eliminado exitosamente.' });
    } catch (error) {
        if (connection) connection.release();
        console.error('Error al eliminar familiar:', error);
        res.status(500).json({ error: 'Error al eliminar familiar.' });
    }
};

module.exports = {
    addFamiliar,
    getFamiliares,
    getFamiliarById,
    updateFamiliar,
    deleteFamiliar
}; 