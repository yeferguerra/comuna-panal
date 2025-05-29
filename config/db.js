const mysql = require('mysql2/promise');
const config = require('../config/config');

const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probar la conexión
pool.getConnection()
    .then(connection => {
        console.log('Conexión a la base de datos MySQL exitosa!');
        connection.release(); // Liberar la conexión
    })
    .catch(err => {
        console.error('Error al conectar con la base de datos MySQL:', err.message);
        // Puedes decidir si quieres cerrar la aplicación si la conexión falla
        // process.exit(1);
    });

module.exports = pool; 