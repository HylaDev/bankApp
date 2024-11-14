function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');

    window.location.replace('login.html');
}

$(document).ready(function() {
    // Charger la navbar sur toutes les pages
    $('#navbar-container').load('navbar.html');
    const token = localStorage.getItem('auth_token');

    // Vérifier si l'utilisateur est authentifié
    if (!token) {
        alert("Vous devez être connecté pour accéder au tableau de bord.");
        window.location.replace('login.html');
        return;
    }
});