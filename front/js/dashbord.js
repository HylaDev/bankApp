$(document).ready(function() {
    const token = localStorage.getItem('auth_token');
    const userName = localStorage.getItem('user_name');
    const userEmail = localStorage.getItem('user_email');

    if (!token) {
        alert("Vous devez être connecté pour accéder au tableau de bord.");
        window.location.replace('login.html');
        return;
    }

    $('#user-name').text(userName);
});