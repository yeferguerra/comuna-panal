const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const bcrypt = require('bcrypt');

// Generar token JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiration
    });
};

// Registrar nuevo usuario
const register = async (req, res) => {
    try {
        const { email, password, nombre, apellido, direccion, telefono } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        }

        // --- Lógica para asignar rol de superadmin al primer usuario ---
        const userCount = await User.countDocuments();
        const role = userCount === 0 ? 'superadmin' : 'usuario'; // Asigna 'superadmin' si no hay usuarios, de lo contrario 'usuario'
        // --------------------------------------------------------

        // Crear nuevo usuario
        const user = new User({
            email,
            password,
            nombre,
            apellido,
            direccion,
            telefono,
            rol: role // Asigna el rol determinado por la lógica
        });

        await user.save();

        // Generar token
        const token = generateToken(user._id);

        res.status(201).json({
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                rol: user.rol // Devuelve el rol asignado
            },
            token
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar usuario.' });
    }
};

// Iniciar sesión
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user._id, role: user.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Obtener perfil del usuario
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('familiares');

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener perfil.' });
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

const getUser = async (req, res) => {
    try {
        // El usuario autenticado está disponible en req.user gracias al middleware de autenticación
        const user = await User.findById(req.user.id).select('-password'); // Excluir la contraseña
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    logout,
    getUser
}; 