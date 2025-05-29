const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Generar token JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiration
    });
};

// Registrar nuevo usuario
const register = async (req, res) => {
    try {
        const { nombre, apellido, email, password, direccion, telefono } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }

        // Crear nuevo usuario
        const user = new User({
            nombre,
            apellido,
            email,
            password,
            direccion,
            telefono
        });

        await user.save();

        // Generar token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                rol: user.rol
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
};

// Iniciar sesión
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Actualizar último acceso
        user.ultimoAcceso = new Date();
        await user.save();

        // Generar token
        const token = generateToken(user._id);

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                rol: user.rol
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
};

// Obtener perfil del usuario
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
};

// Actualizar perfil
const updateProfile = async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['nombre', 'apellido', 'telefono', 'direccion', 'password'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ error: 'Actualizaciones inválidas.' });
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();

        res.json({
            user: {
                id: req.user._id,
                nombre: req.user.nombre,
                apellido: req.user.apellido,
                email: req.user.email,
                rol: req.user.rol
            }
        });
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar perfil.' });
    }
};

// Cerrar sesión
const logout = async (req, res) => {
    try {
        // En una implementación real, podrías invalidar el token
        res.json({ message: 'Sesión cerrada exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al cerrar sesión.' });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    logout
}; 