/**
 * Configuración y conexión a la base de datos MySQL
 * @module config/db
 */

const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('./logger');

// Crear pool de conexiones
const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Verifica la conexión a la base de datos
 * @async
 * @function testConnection
 * @returns {Promise<void>}
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        logger.info('Conexión a la base de datos MySQL exitosa');
        connection.release();
    } catch (err) {
        logger.error('Error al conectar con la base de datos MySQL:', err.message);
        throw err;
    }
}

// Probar la conexión al iniciar
testConnection().catch(err => {
    logger.error('No se pudo establecer la conexión inicial con la base de datos');
    process.exit(1);
});

module.exports = pool; 