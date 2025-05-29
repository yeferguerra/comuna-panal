const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const config = require('./config/config');
const winston = require('winston');
const authRoutes = require('./routes/authRoutes');
const familiarRoutes = require('./routes/familiarRoutes');
const db = require('./config/db');
const passport = require('passport');
const session = require('express-session');
require('./config/passport'); // Importar la configuración de Passport

// Cargar variables de entorno
dotenv.config();

// Configuración del logger
const logger = winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: config.logging.file }),
        new winston.transports.Console()
    ]
});

// Inicialización de la aplicación
const app = express();

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'comuna_el_panal_2021_super_secreta_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Cambiar a true en producción con HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Middleware para logging de sesiones
app.use((req, res, next) => {
    console.log('Sesión actual:', req.session);
    next();
});

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/familiares', familiarRoutes);

// Rutas estáticas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    logger.error('Error en la aplicación:', err);
    console.error('Error detallado:', err);
    res.status(500).json({ error: '¡Algo salió mal!' });
});

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, () => {
    logger.info(`Servidor corriendo en http://localhost:${PORT}`);
}); 