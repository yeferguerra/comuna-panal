// Script para el menú hamburguesa en móviles
const toggler = document.getElementById('navbar-toggler');
const menu = document.getElementById('navbar-default');

if (toggler && menu) {
    toggler.addEventListener('click', () => {
        menu.classList.toggle('hidden');
        const isExpanded = toggler.getAttribute('aria-expanded') === 'true' || false;
        toggler.setAttribute('aria-expanded', !isExpanded);
    });
}

// Animación del logo al hacer scroll
(function() {
    const logo = document.getElementById('logoAnim');
    const fondo = document.querySelector('.navbar-bg');
    if (!logo || !fondo) return;
    function updateLogoAnim() {
        const fondoRect = fondo.getBoundingClientRect();
        const fondoHeight = fondo.offsetHeight;
        const windowHeight = window.innerHeight;
        // Solo animar si la zona de fondo es visible en pantalla
        if (fondoRect.bottom > 0 && fondoRect.top < windowHeight) {
            // Qué porcentaje del fondo ha sido scrolleado
            const visible = Math.max(0, Math.min(fondoRect.bottom, fondoHeight));
            const progress = 1 - (visible / fondoHeight);
            // Mover el logo hacia abajo y hacerlo más pequeño
            logo.style.transform = `translateY(${progress * (fondoHeight * 0.45)}px) scale(${1 - 0.7 * progress})`;
            logo.style.opacity = `${1 - progress}`;
            logo.style.visibility = 'visible';
        } else {
            // Si ya no se ve la zona, ocultar el logo
            logo.style.visibility = 'hidden';
        }
    }
    window.addEventListener('scroll', updateLogoAnim);
    window.addEventListener('resize', updateLogoAnim);
    updateLogoAnim();
})();

// Carrusel de frases sobre comunidad
(function() {
    const frases = [
        { texto: 'La unión hace la fuerza.', autor: 'Esopo' },
        { texto: 'Nadie puede silbar una sinfonía. Se necesita una orquesta entera para tocarla.', autor: 'H.E. Luccock' },
        { texto: 'La comunidad no es solo vivir cerca, sino cuidar unos de otros.', autor: 'Jane Howard' },
        { texto: 'Juntos llegamos más lejos.', autor: 'Proverbio africano' },
        { texto: 'El bienestar de la comunidad es el bienestar de todos.', autor: 'Thomas Jefferson' },
        { texto: 'La verdadera riqueza de una comunidad está en su gente.', autor: 'William James' },
        { texto: 'Solo se progresa cuando se piensa en grande, solo se avanza cuando se camina en comunidad.', autor: 'Simón Rodríguez' },
        { texto: 'La solidaridad es la ternura de los pueblos.', autor: 'Gioconda Belli' },
    ];
    let idx = 1;
    const fraseDiv = document.getElementById('fraseActual');
    function mostrarFrase() {
        fraseDiv.style.opacity = 0;
        setTimeout(() => {
            fraseDiv.innerHTML = `<span class='frase-cita'>"${frases[idx].texto}"</span><span class='frase-autor'>— ${frases[idx].autor}</span>`;
            fraseDiv.style.opacity = 1;
            idx = (idx + 1) % frases.length;
        }, 700);
    }
    setInterval(mostrarFrase, 4000);
    // Mostrar la primera frase al cargar
    fraseDiv.innerHTML = `<span class='frase-cita'>"${frases[0].texto}"</span><span class='frase-autor'>— ${frases[0].autor}</span>`;
})(); 