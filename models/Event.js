const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        required: true
    },
    fechaInicio: {
        type: Date,
        required: true
    },
    fechaFin: {
        type: Date,
        required: true
    },
    lugar: {
        type: String,
        required: true
    },
    organizador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tipo: {
        type: String,
        enum: ['asamblea', 'taller', 'jornada', 'celebracion', 'otro'],
        default: 'otro'
    },
    imagen: {
        type: String,
        default: null
    },
    capacidad: {
        type: Number,
        default: null
    },
    inscritos: [{
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        fechaInscripcion: {
            type: Date,
            default: Date.now
        }
    }],
    estado: {
        type: String,
        enum: ['programado', 'en_curso', 'finalizado', 'cancelado'],
        default: 'programado'
    },
    requisitos: [{
        type: String,
        trim: true
    }],
    materiales: [{
        nombre: String,
        cantidad: Number,
        unidad: String
    }]
}, {
    timestamps: true
});

// Índices para búsqueda
eventSchema.index({ fechaInicio: 1, estado: 1 });
eventSchema.index({ tipo: 1, estado: 1 });
eventSchema.index({ titulo: 'text', descripcion: 'text' });

// Método para verificar si un evento está activo
eventSchema.methods.isActive = function() {
    const now = new Date();
    return this.fechaInicio <= now && this.fechaFin >= now;
};

// Método para verificar si un usuario está inscrito
eventSchema.methods.isUserRegistered = function(userId) {
    return this.inscritos.some(inscripcion => 
        inscripcion.usuario.toString() === userId.toString()
    );
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event; 