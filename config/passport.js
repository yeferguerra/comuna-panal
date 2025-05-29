const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');

passport.serializeUser((user, done) => {
    console.log('Serializando usuario:', user);
    // Si el usuario es temporal (viene de Google y no está en la BD)
    if (!user.id) {
        return done(null, { 
            isTemporary: true,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            google_id: user.google_id
        });
    }
    // Si el usuario existe en la BD
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log('Deserializando usuario con ID:', id);
        
        // Si es un usuario temporal
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
            console.log('Usuario encontrado:', users[0]);
            done(null, users[0]);
        } else {
            console.log('Usuario no encontrado');
            done(null, false);
        }
    } catch (error) {
        console.error('Error al deserializar usuario:', error);
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/api/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Perfil de Google recibido:', profile);
        console.log('Email:', profile.emails[0].value);
        
        const connection = await db.getConnection();
        
        // Buscar usuario existente
        const [existingUsers] = await connection.execute(
            'SELECT * FROM usuarios WHERE email = ?',
            [profile.emails[0].value]
        );

        if (existingUsers.length > 0) {
            console.log('Usuario existente encontrado:', existingUsers[0]);
            connection.release();
            return done(null, existingUsers[0]);
        }

        // Si no existe, devolver los datos del perfil de Google
        console.log('Usuario no encontrado, devolviendo datos de Google');
        connection.release();
        return done(null, {
            nombre: profile.name.givenName || profile.displayName,
            apellido: profile.name.familyName || '',
            email: profile.emails[0].value,
            google_id: profile.id
        });
    } catch (error) {
        console.error('Error en estrategia de Google:', error);
        return done(error, null);
    }
}));

module.exports = passport; 