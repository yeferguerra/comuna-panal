document.addEventListener('DOMContentLoaded', function() {
    const frases = [
        "¡La Comuna es Familia, Trabajo y Producción!",
        "El Panal 2021: Construyendo Juntos el Futuro Comunal.",
        "Tu participación fortalece nuestra Comuna.",
        "Unidos por un mismo ideal, la Venezuela Comunal.",
        "Desde el 23 de Enero, ejemplo de Autogobierno."
    ];

    const fraseActualElement = document.getElementById('fraseActual');
    let currentFraseIndex = 0;

    function mostrarFraseAleatoria() {
        if (fraseActualElement) {
            // Ocultar la frase actual suavemente
            fraseActualElement.classList.remove('opacity-100');
            fraseActualElement.classList.add('opacity-0');

            setTimeout(() => {
                // Seleccionar una nueva frase (evitando repetir la última si es posible)
                let nextFraseIndex = Math.floor(Math.random() * frases.length);
                while (nextFraseIndex === currentFraseIndex) {
                    nextFraseIndex = Math.floor(Math.random() * frases.length);
                }
                currentFraseIndex = nextFraseIndex;

                // Mostrar la nueva frase
                fraseActualElement.textContent = frases[currentFraseIndex];

                // Mostrar la nueva frase suavemente
                fraseActualElement.classList.remove('opacity-0');
                fraseActualElement.classList.add('opacity-100');

            }, 700); // Esperar el tiempo de la transición de opacidad
        }
    }

    // Mostrar la primera frase al cargar y luego cambiar cada cierto tiempo
    if (fraseActualElement) {
         fraseActualElement.textContent = frases[currentFraseIndex];
         setInterval(mostrarFraseAleatoria, 5000); // Cambiar frase cada 5 segundos
    }
}); 