const API_URL = 'http://localhost:3000';

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');

    window.location.replace('login.html');
}

$(document).ready(function() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        alert("Vous devez être connecté pour accéder au profil.");
        window.location.replace('login.html');
        return;
    }

    // Charger le profil utilisateur
    loadUserProfile(token);

    // Mettre à jour le profil lorsque le formulaire est soumis
    $('#profileForm').on('submit', function(e) {
        e.preventDefault();
        updateUserProfile(token);
    });
});

function loadUserProfile(token) {
    $.ajax({
        url: `${API_URL}/users/profile`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        success: function(response) {
            const user = response.user;
            $('#profileName').val(user.name);
            $('#profileEmail').val(user.email);
        },
        error: function(error) {
            console.error("Erreur lors du chargement du profil :", error);
            alert("Erreur de chargement du profil. Veuillez vous reconnecter.");
        }
    });
}

function updateUserProfile(token) {
    const updatedName = $('#profileName').val();

    $.ajax({
        url: `${API_URL}/users/profile`,
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({ name: updatedName }),
        success: function(response) {
            $('#updateMessage').show();
            setTimeout(() => $('#updateMessage').hide(), 3000);
        },
        error: function(error) {
            console.error("Erreur lors de la mise à jour du profil :", error);
            alert("Erreur lors de la mise à jour du profil.");
        }
    });
}