const jwt = require('jsonwebtoken');
const config = require('../config/config');
// const User = require('../models/User'); // No necesitamos el modelo Mongoose aquí si usamos MySQL
const db = require('../config/db'); // Importar la conexión a MySQL

// Middleware para verificar el token JWT
const auth = async (req, res, next) => {
    try {
        // Obtener el token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No hay token de autenticación' });
        }

        // Verificar el token
        console.log('Auth Middleware: Secreto JWT usado para verificar:', config.auth.jwtSecret);
        const decoded = jwt.verify(token, config.auth.jwtSecret);
        console.log('Middleware auth: Token decodificado:', decoded); // Log

        // Modificar para buscar el usuario en MySQL usando el ID numérico del token
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE id = ? AND activo = 1', [decoded.id]);
        const user = rows[0]; // Obtener el primer resultado

        if (!user) {
            // Si no se encuentra usuario activo con ese ID
            console.error('Auth Middleware: Usuario no encontrado o inactivo con ID del token:', decoded.id);
            throw new Error('Usuario no encontrado o inactivo'); // Lanzar un error específico
        }

        // Adjuntar el usuario a la solicitud
        req.token = token;
        req.user = user; // req.user ahora contiene los datos del usuario de MySQL
        console.log('Auth Middleware: Usuario autenticado y adjuntado a req.user:', user.id); // Log éxito
        next();
    } catch (error) {
        console.error('Error de autenticación en Auth Middleware:', error.message || error);
        res.status(401).json({ message: 'Token inválido' }); // Mantener mensaje genérico por seguridad
    }
};

// Middleware para verificar roles
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ 
                error: 'No tiene permiso para realizar esta acción.' 
            });
        }
        next();
    };
};

// Middleware para verificar si es el propietario del recurso
const checkOwnership = (model) => {
    return async (req, res, next) => {
        try {
            const resource = await model.findById(req.params.id);
            
            if (!resource) {
                return res.status(404).json({ error: 'Recurso no encontrado.' });
            }

            if (resource.autor.toString() !== req.user._id.toString() && 
                req.user.rol !== 'admin' && 
                req.user.rol !== 'vocero') {
                return res.status(403).json({ 
                    error: 'No tiene permiso para realizar esta acción.' 
                });
            }

            req.resource = resource;
            next();
        } catch (error) {
            res.status(500).json({ error: 'Error al verificar propiedad.' });
        }
    };
};

module.exports = {
    auth,
    checkRole,
    checkOwnership
}; 