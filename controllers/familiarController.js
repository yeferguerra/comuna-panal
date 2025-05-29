const Familiar = require('../models/Familiar');
const User = require('../models/User'); // Necesitamos el modelo de usuario

// Añadir un nuevo familiar a un usuario
const addFamiliar = async (req, res) => {
    try {
        // El usuario autenticado está disponible en req.user gracias al middleware de autenticación
        const userId = req.user._id;
        const { nombre, apellido, parentesco, edad } = req.body;

        const familiar = new Familiar({
            nombre,
            apellido,
            parentesco,
            edad,
            usuario: userId // Asociamos el familiar al usuario autenticado
        });

        await familiar.save();

        // Opcional: Añadir la referencia del familiar al usuario si no se hace automáticamente por Mongoose (depende de la configuración)
        // const user = await User.findById(userId);
        // user.familiares.push(familiar._id);
        // await user.save();

        res.status(201).json(familiar);
    } catch (error) {
        res.status(500).json({ error: 'Error al añadir familiar.' });
    }
};

// Obtener todos los familiares de un usuario
const getFamiliares = async (req, res) => {
    try {
        const userId = req.user._id;

        // Buscar todos los familiares asociados al usuario autenticado
        const familiares = await Familiar.find({ usuario: userId });

        res.json(familiares);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener familiares.' });
    }
};

// Obtener un familiar por su ID
const getFamiliarById = async (req, res) => {
    try {
        const familiarId = req.params.id;
        const userId = req.user._id;

        // Buscar el familiar y asegurarse de que pertenezca al usuario autenticado
        const familiar = await Familiar.findOne({ _id: familiarId, usuario: userId });

        if (!familiar) {
            return res.status(404).json({ error: 'Familiar no encontrado.' });
        }

        res.json(familiar);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener familiar.' });
    }
};

// Actualizar un familiar por su ID
const updateFamiliar = async (req, res) => {
    try {
        const familiarId = req.params.id;
        const userId = req.user._id;
        const updates = req.body;
        const allowedUpdates = ['nombre', 'apellido', 'parentesco', 'edad'];
        const isValidOperation = Object.keys(updates).every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Actualizaciones inválidas.' });
        }

        // Buscar y actualizar el familiar, asegurándose de que pertenezca al usuario
        const familiar = await Familiar.findOneAndUpdate(
            { _id: familiarId, usuario: userId },
            updates,
            { new: true, runValidators: true }
        );

        if (!familiar) {
            return res.status(404).json({ error: 'Familiar no encontrado.' });
        }

        res.json(familiar);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar familiar.' });
    }
};

// Eliminar un familiar por su ID
const deleteFamiliar = async (req, res) => {
    try {
        const familiarId = req.params.id;
        const userId = req.user._id;

        // Buscar y eliminar el familiar, asegurándose de que pertenezca al usuario
        const familiar = await Familiar.findOneAndDelete({ _id: familiarId, usuario: userId });

        if (!familiar) {
            return res.status(404).json({ error: 'Familiar no encontrado.' });
        }

        res.json({ message: 'Familiar eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar familiar.' });
    }
};

module.exports = {
    addFamiliar,
    getFamiliares,
    getFamiliarById,
    updateFamiliar,
    deleteFamiliar
}; 