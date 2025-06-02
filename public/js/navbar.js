document.addEventListener('DOMContentLoaded', function() {
    const navbarToggler = document.getElementById('navbar-toggler');
    const navbarDefault = document.getElementById('navbar-default');

    if (navbarToggler && navbarDefault) {
        navbarToggler.addEventListener('click', function() {
            navbarDefault.classList.toggle('hidden');
        });
    }
}); 