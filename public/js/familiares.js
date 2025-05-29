document.addEventListener('DOMContentLoaded', () => {
    const familiarForm = document.getElementById('familiarForm');
    const familiaresTableBody = document.querySelector('#familiaresTable tbody');
    const familiarIdInput = document.getElementById('familiarId');
    const cancelEditButton = document.getElementById('cancelEdit');

    // Función para obtener y mostrar familiares
    async function fetchFamiliares() {
        try {
            // Obtener el token del almacenamiento local (asumiendo que lo guardamos ahí al iniciar sesión)
            const token = localStorage.getItem('token'); 
            if (!token) {
                // Redirigir al login si no hay token
                window.location.href = '/login.html'; // Ajusta la ruta si es necesario
                return;
            }

            const response = await fetch('/api/familiares', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                 // Si la respuesta no es OK, puede ser un error de autenticación u otro
                 if (response.status === 401 || response.status === 403) {
                    alert('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.');
                    localStorage.removeItem('token'); // Eliminar token inválido
                    window.location.href = '/login.html'; // Redirigir al login
                 } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                 }
            }

            const familiares = await response.json();

            // Limpiar la tabla antes de añadir los nuevos datos
            familiaresTableBody.innerHTML = '';

            // Llenar la tabla con los familiares
            familiares.forEach(familiar => {
                const row = `
                    <tr data-id="${familiar._id}">
                        <td class="py-2 px-4 border-b">${familiar.nombre}</td>
                        <td class="py-2 px-4 border-b">${familiar.apellido}</td>
                        <td class="py-2 px-4 border-b">${familiar.parentesco}</td>
                        <td class="py-2 px-4 border-b">${familiar.edad}</td>
                        <td class="py-2 px-4 border-b">
                            <button class="edit-btn bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600"><i class="fas fa-edit"></i> Editar</button>
                            <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"><i class="fas fa-trash-alt"></i> Eliminar</button>
                        </td>
                    </tr>
                `;
                familiaresTableBody.innerHTML += row;
            });
        } catch (error) {
            console.error('Error al obtener familiares:', error);
            alert('Ocurrió un error al cargar los familiares.');
        }
    }

    // Función para añadir o actualizar un familiar
    familiarForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const parentesco = document.getElementById('parentesco').value;
        const edad = document.getElementById('edad').value;
        const familiarId = familiarIdInput.value;

        const url = familiarId ? `/api/familiares/${familiarId}` : '/api/familiares';
        const method = familiarId ? 'PATCH' : 'POST';

        // Obtener el token
        const token = localStorage.getItem('token');
         if (!token) {
             window.location.href = '/login.html'; // Redirigir si no hay token
             return;
         }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nombre, apellido, parentesco, edad })
            });

             if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                    alert('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.');
                    localStorage.removeItem('token');
                    window.location.href = '/login.html';
                 } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                 }
             }

            // Recargar la lista de familiares y resetear el formulario
            fetchFamiliares();
            resetForm();

        } catch (error) {
            console.error('Error al guardar familiar:', error);
            alert('Ocurrió un error al guardar el familiar.');
        }
    });

    // Función para cargar datos de familiar en el formulario para editar
    familiaresTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-btn') || e.target.parentElement.classList.contains('edit-btn')) {
            const row = e.target.closest('tr');
            const familiarId = row.dataset.id;

             // Obtener el token
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html'; // Redirigir si no hay token
                return;
            }

            try {
                const response = await fetch(`/api/familiares/${familiarId}`, {
                     headers: {
                        'Authorization': `Bearer ${token}`
                     }
                });
                 if (!response.ok) {
                     if (response.status === 401 || response.status === 403) {
                        alert('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.');
                        localStorage.removeItem('token');
                        window.location.href = '/login.html';
                     } else {
                        throw new Error(`HTTP error! status: ${response.status}`);
                     }
                 }

                const familiar = await response.json();
                
                document.getElementById('nombre').value = familiar.nombre;
                document.getElementById('apellido').value = familiar.apellido;
                document.getElementById('parentesco').value = familiar.parentesco;
                document.getElementById('edad').value = familiar.edad;
                familiarIdInput.value = familiar._id;

                document.querySelector('button[type="submit"]').textContent = 'Actualizar Familiar';
                cancelEditButton.classList.remove('hidden');

            } catch (error) {
                console.error('Error al obtener familiar para editar:', error);
                alert('Ocurrió un error al cargar los datos del familiar para editar.');
            }
        }

        // Función para eliminar un familiar
        if (e.target.classList.contains('delete-btn') || e.target.parentElement.classList.contains('delete-btn')) {
            const row = e.target.closest('tr');
            const familiarId = row.dataset.id;

            if (confirm('¿Estás seguro de que quieres eliminar este familiar?')) {
                 // Obtener el token
                const token = localStorage.getItem('token');
                if (!token) {
                    window.location.href = '/login.html'; // Redirigir si no hay token
                    return;
                }

                try {
                    const response = await fetch(`/api/familiares/${familiarId}`, {
                        method: 'DELETE',
                         headers: {
                            'Authorization': `Bearer ${token}`
                         }
                    });

                     if (!response.ok) {
                         if (response.status === 401 || response.status === 403) {
                            alert('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.');
                            localStorage.removeItem('token');
                            window.location.href = '/login.html';
                         } else {
                            throw new Error(`HTTP error! status: ${response.status}`);
                         }
                     }

                    // Eliminar la fila de la tabla
                    row.remove();

                } catch (error) {
                    console.error('Error al eliminar familiar:', error);
                    alert('Ocurrió un error al eliminar el familiar.');
                }
            }
        }
    });

    // Función para cancelar la edición y resetear el formulario
    cancelEditButton.addEventListener('click', resetForm);

    function resetForm() {
        familiarForm.reset();
        familiarIdInput.value = '';
        document.querySelector('button[type="submit"]').textContent = 'Añadir Familiar';
        cancelEditButton.classList.add('hidden');
    }

    // Cargar familiares al cargar la página
    fetchFamiliares();
}); 