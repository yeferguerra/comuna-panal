/**
 * Servidor principal de la Comuna Socialista El Panal
 * @module server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

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

// Configuración de CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || process.env.NGROK_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        sameSite: 'lax',
        domain: process.env.COOKIE_DOMAIN || undefined
    }
}));

// Middleware para logging de sesiones
app.use((req, res, next) => {
    console.log('Sesión ID:', req.sessionID);
    next();
});

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/familiares', familiarRoutes);

// Rutas estáticas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/register.html'));
});

app.get('/registration-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/registration-success.html'));
});

app.get('/user-home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/user-home.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    logger.error('Error en la aplicación:', err);
    console.error('Error detallado:', err);
    res.status(500).json({ error: '¡Algo salió mal!' });
});

// Puerto
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Iniciar servidor
app.listen(PORT, HOST, () => {
    logger.info(`Servidor corriendo en http://${HOST}:${PORT}`);
}); 