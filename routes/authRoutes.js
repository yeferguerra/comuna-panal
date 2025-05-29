const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas (Comentadas temporalmente)
// router.get('/profile', auth, authController.getProfile);
// router.patch('/profile', auth, authController.updateProfile);
// router.post('/logout', auth, authController.logout);

// @route   GET api/auth/me
// @desc    Get user data by token
// @access  Private
router.get('/me', auth, authController.getUser);

// Rutas de Google
router.get('/google', (req, res, next) => {
    console.log('Iniciando autenticación con Google...');
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })(req, res, next);
});

router.get('/google/callback',
    (req, res, next) => {
        console.log('Callback de Google recibido...');
        passport.authenticate('google', { 
            failureRedirect: '/login.html?error=google_auth_failed',
            failureMessage: true,
            session: true
        })(req, res, next);
    },
    async (req, res) => {
        try {
            console.log('Usuario autenticado:', req.user);
            
            if (!req.user) {
                console.error('No se recibió el usuario en el callback');
                return res.redirect('/login.html?error=no_user_data');
            }

            // Verificar si el usuario existe en la base de datos
            const connection = await db.getConnection();
            const [users] = await connection.execute(
                'SELECT * FROM usuarios WHERE email = ?',
                [req.user.email]
            );
            connection.release();

            console.log('Búsqueda de usuario:', users);

            if (users.length === 0) {
                console.log('Usuario no encontrado, redirigiendo a registro...');
                // Si el usuario no existe, redirigir a registro con los datos de Google
                const userData = {
                    nombre: req.user.nombre,
                    apellido: req.user.apellido,
                    email: req.user.email,
                    google_id: req.user.google_id
                };
                // Codificar los datos del usuario para pasarlos como parámetros de URL
                const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
                return res.redirect(`/register.html?google_data=${userDataEncoded}`);
            }

            console.log('Usuario encontrado, generando token...');
            // Si el usuario existe, generar token y redirigir a la página principal
            const token = jwt.sign(
                { id: users[0].id, email: users[0].email },
                process.env.JWT_SECRET || 'comuna_el_panal_2021_super_secreta_123',
                { expiresIn: '24h' }
            );

            res.redirect(`/?token=${token}`);
        } catch (error) {
            console.error('Error en callback de Google:', error);
            res.redirect('/login.html?error=server_error');
        }
    }
);

module.exports = router; 