// Funciones de autenticación
const API_URL = window.API_URL || '/api';

// Función para registrar un nuevo usuario
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al registrar usuario');
        }

        // Guardar el token en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirigir al usuario
        window.location.href = '/';
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// Función para iniciar sesión
async function loginUser(credentials) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar sesión');
        }

        // Guardar el token en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirigir al usuario
        window.location.href = '/';
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Función para obtener el token
function getToken() {
    return localStorage.getItem('token');
}

// Función para obtener el usuario actual
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
} 