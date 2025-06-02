const express = require('express');
const router = express.Router();
const familiaresController = require('../controllers/familiaresController');
const { auth } = require('../middleware/auth'); // Asegúrate de que el middleware de autenticación esté importado

// Ruta para obtener el identificador familiar del usuario autenticado
router.get('/identificador', auth, familiaresController.getIdentificadorFamiliar);

// Puedes agregar más rutas relacionadas con familiares aquí en el futuro

module.exports = router; 