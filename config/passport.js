/**
 * Configuración de Passport.js para autenticación
 * @module config/passport
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');
const config = require('./config');
const logger = require('./logger');

/**
 * Serializa el usuario para la sesión
 * @param {Object} user - Usuario a serializar
 * @param {Function} done - Callback de Passport
 */
passport.serializeUser((user, done) => {
    if (!user.id) {
        return done(null, { 
            isTemporary: true,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            google_id: user.google_id
        });
    }
    done(null, user.id);
});

/**
 * Deserializa el usuario de la sesión
 * @param {number|Object} id - ID del usuario o objeto temporal
 * @param {Function} done - Callback de Passport
 */
passport.deserializeUser(async (id, done) => {
    try {
        if (typeof id === 'object' && id.isTemporary) {
            return done(null, id);
        }

        const connection = await db.getConnection();
        const [users] = await connection.execute(
            'SELECT id, nombre, apellido, email FROM usuarios WHERE id = ?',
            [id]
        );
        connection.release();
        
        if (users.length > 0) {
            done(null, users[0]);
        } else {
            done(null, false);
        }
    } catch (error) {
        logger.error('Error al deserializar usuario:', error);
        done(error, null);
    }
});

/**
 * Estrategia de autenticación con Google
 */
passport.use(new GoogleStrategy({
    clientID: config.auth.google.clientID,
    clientSecret: config.auth.google.clientSecret,
    callbackURL: config.auth.google.callbackURL
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const connection = await db.getConnection();
        
        // Buscar usuario existente
        const [existingUsers] = await connection.execute(
            'SELECT * FROM usuarios WHERE email = ?',
            [profile.emails[0].value]
        );

        if (existingUsers.length > 0) {
            connection.release();
            return done(null, existingUsers[0]);
        }

        // Si no existe, devolver los datos del perfil de Google
        connection.release();
        return done(null, {
            nombre: profile.name.givenName || profile.displayName,
            apellido: profile.name.familyName || '',
            email: profile.emails[0].value,
            google_id: profile.id
        });
    } catch (error) {
        logger.error('Error en estrategia de Google:', error);
        return done(error, null);
    }
}));

module.exports = passport; 