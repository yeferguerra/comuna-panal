# Comuna Socialista El Panal - Documentación Técnica

## Descripción Técnica
Sistema web full-stack para la gestión comunal, construido con Node.js, Express y MySQL. Implementa autenticación OAuth2 con Google y sistema de roles basado en familias.

## Stack Tecnológico
- **Backend**: Node.js v18+, Express.js
- **Base de Datos**: MySQL 8.0+
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Autenticación**: OAuth2 (Google), JWT
- **Middleware**: Express-session, Passport.js

## Estructura del Proyecto
```
comuna-panal/
├── config/                 # Configuraciones
│   ├── database.js        # Configuración MySQL
│   └── passport.js        # Configuración OAuth
├── controllers/           # Controladores
│   ├── authController.js  # Lógica de autenticación
│   └── userController.js  # Lógica de usuarios
├── middleware/            # Middleware
│   └── auth.js           # Verificación de autenticación
├── models/               # Modelos de datos
│   ├── User.js          # Modelo de usuario
│   └── Family.js        # Modelo de familia
├── public/              # Archivos estáticos
│   ├── css/            # Estilos
│   ├── js/             # Scripts del cliente
│   └── assets/         # Recursos estáticos
├── routes/             # Rutas de la API
│   ├── auth.js         # Rutas de autenticación
│   └── users.js        # Rutas de usuarios
├── .env               # Variables de entorno
├── .gitignore        # Archivos ignorados por git
├── package.json      # Dependencias y scripts
└── server.js         # Punto de entrada
```

## Dependencias Principales
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "passport": "^0.6.0",
    "passport-google-oauth20": "^2.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.0.3"
  }
}
```

## Configuración del Entorno
1. Variables de entorno requeridas (.env):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=comunapanal
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

2. Configuración de la base de datos:
```sql
CREATE DATABASE comunapanal;
USE comunapanal;

CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE familias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario_rol_familia (
    usuario_id INT,
    familia_id INT,
    rol ENUM('jefe', 'miembro') DEFAULT 'miembro',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (familia_id) REFERENCES familias(id),
    PRIMARY KEY (usuario_id, familia_id)
);
```

## Endpoints de la API
### Autenticación
- `POST /api/auth/google` - Inicio de sesión con Google
- `GET /api/auth/google/callback` - Callback de Google OAuth
- `POST /api/auth/logout` - Cierre de sesión

### Usuarios
- `GET /api/users/me` - Obtener datos del usuario actual
- `PUT /api/users/me` - Actualizar datos del usuario
- `GET /api/users/:id/families` - Obtener familias del usuario

### Familias
- `GET /api/families` - Listar familias
- `POST /api/families` - Crear familia
- `PUT /api/families/:id` - Actualizar familia
- `DELETE /api/families/:id` - Eliminar familia

## Seguridad
- Autenticación OAuth2 con Google
- Tokens JWT para sesiones
- Protección contra CSRF
- Sanitización de inputs
- Validación de datos
- Encriptación de contraseñas con bcrypt

## Scripts Disponibles
```bash
npm start        # Inicia el servidor en producción
npm run dev      # Inicia el servidor en desarrollo con nodemon
npm run test     # Ejecuta las pruebas
npm run lint     # Ejecuta el linter
```

## Notas para Desarrolladores
- Usar ESLint con la configuración proporcionada
- Seguir el patrón MVC
- Documentar cambios en el código
- Mantener las migraciones de la base de datos actualizadas
- Usar async/await para operaciones asíncronas
- Implementar manejo de errores consistente

## Estado del Proyecto
- [x] Autenticación con Google
- [x] Sistema de roles
- [x] Gestión de familias
- [ ] Panel de administración
- [ ] Gestión de noticias
- [ ] Gestión de eventos 

## Próximos Pasos (Lista de Tareas)

Aquí hay una lista de tareas pendientes para continuar desarrollando el proyecto. Puedes ir marcando las casillas \[[x]] a medida que se completen:

*   **Backend:**
    *   \[ ] Implementar completamente la lógica CRUD en `familiarController.js` para interactuar con la base de datos.
    *   \[ ] Implementar validación de datos rigurosa en los endpoints (ej. con `express-validator`), comenzando por `POST /api/auth/register`.
    *   \[ ] Implementar manejo de errores más robusto en el backend con códigos y mensajes específicos.
    *   \[ ] Agregar lógica para la gestión de Noticias y Eventos (modelos, controladores, rutas).
    *   \[ ] Considerar roles y permisos más detallados (por ejemplo, ¿quién puede gestionar familiares, noticias, eventos?).
    *   \[ ] Implementar funcionalidad de "Olvidaste tu contraseña?".
    *   \[ ] Implementar cierre de sesión en el backend (invalidación de token si se implementa así).
*   **Frontend:**
    *   \[ ] Desarrollar la interfaz completa y la lógica en `public/familiares.html` y `public/js/familiares.js` para mostrar, agregar, editar y eliminar familiares, interactuando con el backend.
    *   \[ ] Implementar la visualización de Noticias en `index.html` (posiblemente obteniéndolas del backend).
    *   \[ ] Implementar la visualización de Eventos en `index.html` (posiblemente obteniéndolos del backend).
    *   \[ ] Agregar formularios frontend para agregar/editar Noticias y Eventos (probablemente en páginas de administración separadas).
    *   \[ ] Mejorar la interfaz de usuario y la experiencia del usuario en general.
    *   \[ ] Implementar validación en los formularios frontend.
    *   \[ ] Mostrar mensajes de éxito/error más amigables al usuario.
*   **General:**
    *   \[ ] Agregar pruebas automatizadas (unitarias, de integración, e2e) para el backend y/o frontend.
    *   \[ ] Agregar documentación de API técnica con Swagger/OpenAPI.
    *   \[ ] Implementar un sistema de caché para reducir la carga en la base de datos.
    *   \[ ] Implementar rate limiting en la API para proteger contra abusos.
    *   \[ ] Implementar un sistema de monitoreo (ej. con Prometheus) para supervisar el rendimiento y errores.
    *   \[ ] Considerar la implementación de un sistema de colas para tareas pesadas o de fondo.
    *   \[ ] Agregar compresión (ej. Gzip) para respuestas HTTP para mejorar el rendimiento.
    *   \[ ] Implementar un sistema de backup automático para la base de datos.
    *   \[ ] Implementar logging más detallado si es necesario (ya se hizo en parte al centralizar, pero refinar). 