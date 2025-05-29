const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

// Middleware para verificar el token JWT
const auth = async (req, res, next) => {
    try {
        // Obtener el token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No hay token de autenticación' });
        }

        // Verificar el token
        const decoded = jwt.verify(token, config.auth.jwtSecret);
        const user = await User.findOne({ _id: decoded.id, activo: true });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        console.error('Error de autenticación:', error);
        res.status(401).json({ message: 'Token inválido' });
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