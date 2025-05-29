const express = require('express');
const router = express.Router();
const familiarController = require('../controllers/familiarController');
const { auth } = require('../middleware/auth');

// Todas las rutas de familiares requieren autenticación
router.use(auth);

// Rutas para familiares
router.post('/', familiarController.addFamiliar); // Añadir un nuevo familiar
router.get('/', familiarController.getFamiliares); // Obtener todos los familiares del usuario
router.get('/:id', familiarController.getFamiliarById); // Obtener un familiar específico por ID
router.patch('/:id', familiarController.updateFamiliar); // Actualizar un familiar por ID
router.delete('/:id', familiarController.deleteFamiliar); // Eliminar un familiar por ID

module.exports = router; 