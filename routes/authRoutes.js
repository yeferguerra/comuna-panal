const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas
router.get('/profile', auth, authController.getProfile);
router.patch('/profile', auth, authController.updateProfile);
router.post('/logout', auth, authController.logout);

// @route   GET api/auth/me
// @desc    Get user data by token
// @access  Private
router.get('/me', auth, authController.getUser);

module.exports = router; 