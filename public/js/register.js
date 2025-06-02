document.addEventListener('DOMContentLoaded', function() {
    console.log('Script register.js cargado y DOM listo.');
    const fechaNacimientoInput = document.getElementById('fechaNacimiento');
    const cedulaContainer = document.getElementById('cedulaContainer');
    const tipoRegistroSelect = document.getElementById('tipoRegistro');
    const identificadorFamiliarContainer = document.getElementById('identificadorFamiliarContainer');
    const registerForm = document.getElementById('registerForm');
    const passwordContainer = document.getElementById('passwordContainer');
    const confirmPasswordContainer = document.getElementById('confirmPasswordContainer');

    // Verificar si hay datos de Google en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const googleData = urlParams.get('google_data');

    if (googleData) {
        try {
            const userData = JSON.parse(decodeURIComponent(googleData));
            console.log('Datos de Google recibidos:', userData);
            
            // Rellenar los campos con los datos de Google
            document.getElementById('nombre').value = userData.nombre || '';
            document.getElementById('apellido').value = userData.apellido || '';
            document.getElementById('email').value = userData.email || '';
            
            // Deshabilitar el campo de email
            document.getElementById('email').readOnly = true;
            
            // Ocultar campos de contraseña si viene de Google
            if (userData.google_id) {
                passwordContainer.style.display = 'none';
                confirmPasswordContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Error al procesar datos de Google:', error);
        }
    }

    // Establecer la fecha máxima como hoy
    const today = new Date();
    fechaNacimientoInput.max = today.toISOString().split('T')[0];

    // Función para calcular la edad
    function calcularEdad(fechaNacimiento) {
        const hoy = new Date();
        const fechaNac = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
        }
        
        return edad;
    }

    // Función para validar la fecha de nacimiento
    function validarFechaNacimiento(fecha) {
        const edad = calcularEdad(fecha);
        console.log('Edad calculada:', edad);
        
        if (edad >= 10) {
            cedulaContainer.style.display = 'block';
        } else {
            cedulaContainer.style.display = 'none';
        }
    }

    // Evento para cuando cambia la fecha de nacimiento
    fechaNacimientoInput.addEventListener('change', function() {
        if (this.value) {
            validarFechaNacimiento(this.value);
        }
    });

    // Evento para cuando cambia el tipo de registro
    tipoRegistroSelect.addEventListener('change', function() {
        if (this.value === 'existente') {
            identificadorFamiliarContainer.classList.remove('hidden');
        } else {
            identificadorFamiliarContainer.classList.add('hidden');
        }
    });

    // Validación del formulario
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar fecha de nacimiento
        if (!fechaNacimientoInput.value) {
            alert('Por favor, ingresa tu fecha de nacimiento');
            return;
        }

        const edad = calcularEdad(fechaNacimientoInput.value);
        
        // Validar edad mínima
        if (edad < 5) {
            alert('Debes tener al menos 5 años para registrarte');
            return;
        }

        // Validar edad para jefe de familia
        if (tipoRegistroSelect.value === 'nueva' && edad < 18) {
            alert('Debes tener al menos 18 años para registrar una nueva familia');
            return;
        }

        // Validar cédula si es mayor de 10 años
        if (edad >= 10) {
            const tipoCedula = document.getElementById('tipoCedula').value;
            const numeroCedula = document.getElementById('numeroCedula').value;
            
            if (!tipoCedula || !numeroCedula) {
                alert('Por favor, completa los datos de la cédula');
                return;
            }
        }

        // Validar identificador familiar si es necesario
        if (tipoRegistroSelect.value === 'existente') {
            const identificador = document.getElementById('identificadorFamiliar').value;
            if (!identificador) {
                alert('Por favor, ingresa el identificador familiar');
                return;
            }
        }

        // Validar contraseña solo si no viene de Google
        if (!googleData) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!password || !confirmPassword) {
                alert('Por favor, completa los campos de contraseña');
                return;
            }

            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }
        }

        // Validar dirección y teléfono
        const direccion = document.getElementById('direccion').value;
        const prefijoTelefono = document.getElementById('prefijoTelefono').value;
        const numeroTelefono = document.getElementById('numeroTelefono').value;

        if (!direccion) {
            alert('Por favor, ingresa tu dirección');
            return;
        }

        if (!prefijoTelefono || !numeroTelefono) {
            alert('Por favor, ingresa tu número de teléfono');
            return;
        }

        // Validar formato del número de teléfono
        const telefonoRegex = /^\d{7}$/;
        if (!telefonoRegex.test(numeroTelefono)) {
            alert('El número de teléfono debe tener 7 dígitos.');
            return;
        }

        // Unir prefijo y número
        const telefono = `${prefijoTelefono}-${numeroTelefono}`;

        // Si todo está bien, enviar el formulario
        try {
            const formData = new FormData(this);
            const data = {
                nombre: formData.get('nombre'),
                apellido: formData.get('apellido'),
                email: formData.get('email'),
                fechaNacimiento: formData.get('fechaNacimiento'),
                tipoRegistro: formData.get('tipoRegistro'),
                identificadorFamiliar: formData.get('identificadorFamiliar'),
                direccion: formData.get('direccion'),
                telefono: telefono,
                google_id: googleData ? JSON.parse(decodeURIComponent(googleData)).google_id : null
            };

            // Agregar cédula solo si es mayor de 10 años
            if (edad >= 10) {
                data.cedula = `${formData.get('tipoCedula')}-${formData.get('numeroCedula')}`;
            }

            // Agregar contraseña solo si no viene de Google
            if (!googleData) {
                data.password = formData.get('password');
            }

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en el registro');
            }

            const result = await response.json();
            
            // Modificar para manejar la respuesta JSON del backend
            console.log('Registro exitoso (respuesta JSON):', result);

            // Redirigir en el frontend después de recibir la respuesta JSON
            // Si el registro es de una nueva familia, redirigir a la página de éxito con el identificador
            if (result.user && result.user.identificadorFamiliar) {
                 window.location.href = `/registration-success.html?identificador=${result.user.identificadorFamiliar}`;
            } else if (result.user && result.token) {
                 // Si se devuelve un token (login automático después de registro, no implementado actualmente pero posible)
                 // localStorage.setItem('authToken', result.token);
                 // window.location.href = '/user-home.html'; // Redirigir a user-home
                 
                 // Para registros sin identificador (ej. miembro existente), simplemente redirigir a login
                 window.location.href = '/login.html'; 
            } else {
                // Si la respuesta JSON es inesperada pero indica éxito
                 alert(result.message || 'Registro completado. Por favor, inicia sesión.');
                 window.location.href = '/login.html'; // Redirigir a login como fallback
            }
            
        } catch (error) {
            console.error('Error:', error);
            // Mostrar el mensaje de error del backend si está disponible
            alert(error.message || 'Error al registrar. Por favor, intenta nuevamente.');
        }
    });
}); 