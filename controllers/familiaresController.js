const db = require('../config/db');

// Obtener identificador familiar de un usuario
const getIdentificadorFamiliar = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        
        // El ID del usuario viene del middleware de autenticación (req.user.id)
        const userId = req.user.id;

        // Buscar el usuario y obtener su familia_id y si es jefe
        const [users] = await connection.execute(
            'SELECT familia_id, es_jefe_familia FROM usuarios WHERE id = ? LIMIT 1',
            [userId]
        );

        const user = users[0];

        if (!user) {
            connection.release();
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        let identificador = null;

        if (user.familia_id) {
            // Si el usuario pertenece a una familia, obtener el identificador de la familia
            const [familias] = await connection.execute(
                'SELECT identificador FROM familias WHERE id = ? LIMIT 1',
                [user.familia_id]
            );
            if (familias.length > 0) {
                identificador = familias[0].identificador;
            }
        } else if (user.es_jefe_familia) {
             // Si es jefe pero no tiene familia_id (caso borde o inicial)
             // En teoría, si es jefe, debería tener familia_id después del registro
             // Si no lo tiene, podría ser un error de lógica previa o un jefe sin familia aún (aunque el flujo de registro crea la familia)
             // Podríamos buscar la familia por el id del jefe si fuera necesario, pero idealmente familia_id ya está en usuarios.
             console.warn('Jefe de familia sin familia_id en usuarios. Esto no debería pasar.');
             // Podríamos intentar buscar la familia donde este usuario es jefe si la lógica lo permite.
             // Por ahora, si no tiene familia_id pero es jefe, no devolvemos identificador a menos que lo busquemos de otra forma.
        }

        connection.release();

        if (identificador) {
            res.json({ identificador });
        } else {
            res.status(404).json({ message: 'Identificador familiar no encontrado para este usuario.' });
        }

    } catch (error) {
        if (connection) connection.release();
        console.error('Error al obtener identificador familiar:', error);
        res.status(500).json({ message: 'Error del servidor al obtener identificador familiar.' });
    }
};

module.exports = {
    getIdentificadorFamiliar
}; 