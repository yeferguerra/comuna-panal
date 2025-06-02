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
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";
    console.log('URL de callback configurada para enviar a Google:', callbackURL);
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account',
        callbackURL: callbackURL
    })(req, res, next);
});

router.get('/google/callback',
    (req, res, next) => {
        console.log('Callback de Google recibido...');
        console.log('URL de callback configurada:', process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback");
        passport.authenticate('google', { 
            failureRedirect: '/login.html?error=google_auth_failed', 
            session: true
        })(req, res, next);
    },
    async (req, res) => {
        try {
            console.log('Callback de Google: Manejador de éxito iniciado.');
            console.log('Callback de Google: req.user después de passport.authenticate:', req.user);
            console.log('Callback de Google: Origen de la solicitud (req.headers.origin):', req.headers.origin);
            console.log('Callback de Google: Referer de la solicitud (req.headers.referer):', req.headers.referer);
            
            let baseUrl = '/'; // Default a raíz si no hay variable de entorno
            if (process.env.GOOGLE_CALLBACK_URL) {
                try {
                    const callbackUrlObj = new URL(process.env.GOOGLE_CALLBACK_URL);
                    baseUrl = `${callbackUrlObj.protocol}//${callbackUrlObj.host}`; // Construir base URL (e.g., https://tu-ngrok.app)
                } catch (error) {
                    console.error('Error al parsear GOOGLE_CALLBACK_URL para base URL:', error);
                    // Fallback a localhost si la variable de entorno es inválida
                    baseUrl = 'http://localhost:3000';
                }
            } else {
                // Fallback a localhost si la variable de entorno no está definida
                baseUrl = 'http://localhost:3000';
            }

            console.log('Callback de Google: Base URL determinada para redirección:', baseUrl);

            if (!req.user) {
                console.error('Callback de Google: No se recibió el usuario en req.user (post-auth).');
                return res.redirect('/login.html?error=no_user_data');
            }

            // En este punto, req.user contiene los datos del perfil de Google o del usuario de la BD
            // según lo que devuelva done() en config/passport.js

            // Si el usuario viene de la BD (ya registrado):
            if (req.user.id) {
                console.log('Callback de Google: Usuario de Google ya registrado detectado (ID:', req.user.id, ').');
                if (!req.user.email) {
                    console.error('Callback de Google: Usuario registrado sin email en req.user.', req.user);
                    return res.redirect('/login.html?error=user_data_missing');
                }

                console.log('Callback de Google: Generando token para usuario registrado...');
                console.log('Callback de Google: Secreto JWT usado para firmar:', process.env.JWT_SECRET || 'comuna_el_panal_2021_super_secreta_123');
                const token = jwt.sign(
                    { id: req.user.id, email: req.user.email },
                    process.env.JWT_SECRET || 'comuna_el_panal_2021_super_secreta_123',
                    { expiresIn: '24h' }
                );
                console.log('Callback de Google: Token generado. Redirigiendo a user-home...');
                const redirectUrl = baseUrl ? `${baseUrl}/user-home?token=${token}` : `/user-home?token=${token}`;
                console.log('Callback de Google: Redirigiendo a URL:', redirectUrl);
                return res.redirect(redirectUrl);
            }

            // Si el usuario NO viene de la BD (nuevo registro con Google):
            if (req.user.google_id && req.user.email && req.user.nombre) {
                 console.log('Callback de Google: Usuario de Google NO registrado detectado.');
                 console.log('Callback de Google (Nuevo Usuario): Origen de la solicitud (req.headers.origin):', req.headers.origin);
                 console.log('Callback de Google (Nuevo Usuario): Referer de la solicitud (req.headers.referer):', req.headers.referer);
                 
                 const userData = {
                    nombre: req.user.nombre,
                    apellido: req.user.apellido,
                    email: req.user.email,
                    google_id: req.user.google_id
                };
                const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
                console.log('Callback de Google: Redirigiendo a registro con datos de Google...');
                const redirectUrl = baseUrl ? `${baseUrl}/register.html?google_data=${userDataEncoded}` : `/register.html?google_data=${userDataEncoded}`;
                console.log('Callback de Google (Nuevo Usuario): Base URL determinada para redirección:', baseUrl);
                console.log('Callback de Google (Nuevo Usuario): Redirigiendo a URL final:', redirectUrl);
                return res.redirect(redirectUrl);
            }

            // Si no se pudo manejar el usuario autenticado por alguna razón inesperada
            console.error('Callback de Google: Usuario autenticado por Google con datos insuficientes para registro o login.', req.user);
            res.redirect('/login.html?error=google_auth_failed');

        } catch (error) {
            console.error('Callback de Google: Error en el manejador de éxito:', error);
            res.redirect('/login.html?error=server_error');
        }
    }
);

module.exports = router; 