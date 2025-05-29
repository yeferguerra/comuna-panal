require('dotenv').config();

module.exports = {
    // Configuración del servidor
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },

    // Configuración de la base de datos
    database: {
        url: process.env.DATABASE_URL || 'mongodb://localhost:27017/comuna_panal',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },

    // Configuración de autenticación
    auth: {
        jwtSecret: process.env.JWT_SECRET || 'clave_secreta_temporal',
        jwtExpiration: '24h'
    },

    // Configuración de correo electrónico
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE || false,
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASS || ''
        }
    },

    // Configuración de archivos
    uploads: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        directory: 'uploads/'
    },

    // Configuración de caché
    cache: {
        enabled: true,
        ttl: 3600 // 1 hora en segundos
    },

    // Configuración de logs
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: 'logs/app.log'
    }
}; 