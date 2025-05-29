const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    contenido: {
        type: String,
        required: true
    },
    imagen: {
        type: String,
        default: null
    },
    autor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    categoria: {
        type: String,
        enum: ['general', 'eventos', 'anuncios', 'logros'],
        default: 'general'
    },
    etiquetas: [{
        type: String,
        trim: true
    }],
    destacada: {
        type: Boolean,
        default: false
    },
    estado: {
        type: String,
        enum: ['borrador', 'publicada', 'archivada'],
        default: 'borrador'
    },
    fechaPublicacion: {
        type: Date,
        default: Date.now
    },
    comentarios: [{
        autor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        contenido: String,
        fecha: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Índices para búsqueda
newsSchema.index({ titulo: 'text', contenido: 'text' });
newsSchema.index({ categoria: 1, estado: 1 });
newsSchema.index({ fechaPublicacion: -1 });

const News = mongoose.model('News', newsSchema);

module.exports = News; 