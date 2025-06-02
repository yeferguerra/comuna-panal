const express = require('express');
const router = express.Router();
const familiaresController = require('../controllers/familiaresController');
const { auth } = require('../middleware/auth');

// Todas las rutas de familiares requieren autenticación
router.use(auth);

// Rutas para familiares
// router.post('/', familiarController.addFamiliar); // Comentar o eliminar si estas funciones no están en el controlador plural
// router.get('/', familiarController.getFamiliares); // Comentar o eliminar si estas funciones no están en el controlador plural
// router.get('/:id', familiarController.getFamiliarById); // Comentar o eliminar si estas funciones no están en el controlador plural
// router.patch('/:id', familiarController.updateFamiliar); // Comentar o eliminar si estas funciones no están en el controlador plural
// router.delete('/:id', familiarController.deleteFamiliar); // Comentar o eliminar si estas funciones no están en el controlador plural

// Ruta para obtener el identificador familiar del usuario autenticado
router.get('/identificador', familiaresController.getIdentificadorFamiliar);

module.exports = router; 