const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const config = require('./config/config');
const mongoose = require('mongoose');
const winston = require('winston');
const authRoutes = require('./routes/authRoutes');
const familiarRoutes = require('./routes/familiarRoutes');

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a la base de datos
mongoose.connect(config.database.url, config.database.options)
    .then(() => logger.info('Conexión a MongoDB establecida'))
    .catch(err => logger.error('Error al conectar con MongoDB:', err));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/familiares', familiarRoutes);

// Rutas estáticas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: '¡Algo salió mal!' });
});

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, () => {
    logger.info(`Servidor corriendo en http://localhost:${PORT}`);
}); 