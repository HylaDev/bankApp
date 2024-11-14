const API_URL = 'http://localhost:3000';

$(document).ready(function() {
    $('#signupForm').on('submit', function(e) {
        e.preventDefault();

        const name = $('#name').val().trim();
        const email = $('#email').val().trim();
        const pass = $('#password').val().trim();
        const confirm = $('#confirm-password').val().trim();

        // Réinitialiser les messages d'erreur et de succès
        $('.error-message').text('').hide();
        $('#success-message').hide();
        $('#error-message').hide();
        
        let hasError = false;

        if (name === '') {
            $('#name-error').text('Veuillez entrer votre nom complet').show();
            hasError = true;
        }

        if (!validateEmail(email)) {
            $('#email-error').text('Veuillez entrer une adresse email valide').show();
            hasError = true;
        }

        if (pass.length < 8) {
            $('#pass-error').text("Le mot de passe doit contenir au moins 8 caractères.").show();
            hasError = true;
        }

        if (pass !== confirm) {
            $('#confirm-error').text("Les mots de passe ne correspondent pas.").show();
            hasError = true;
        }

        if (hasError) return;

        // Désactiver le bouton pour éviter les clics multiples
        const submitButton = $('button[type="submit"]');
        submitButton.prop('disabled', true);

        $.ajax({
            url: `${API_URL}/users/register`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name: name,
                email: email,
                pass: pass
            }),
            success: function(response) {
                console.log("Réponse du serveur : ", response); 
                $('#signupForm').trigger('reset'); // Réinitialise le formulaire
                $('#success-message').text('Votre inscription a bien été prise en compte! Vous allez être redirigé vers le tableau de bord.').show();
                
                // Stocker les informations utilisateur
                localStorage.setItem('auth_token', response.userToken);
                localStorage.setItem('user_email', response.userEmail);
                localStorage.setItem('user_name', response.userName);
                
                window.location.href = 'dashboard.html';
            },
            error: function(error) {
                console.error(error);
                
                // Afficher le message d'erreur spécifique
                const errorMessage = error.responseJSON && error.responseJSON.message ? error.responseJSON.message : 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
                $('#error-message').text(errorMessage).show();
            },
            complete: function() {
                submitButton.prop('disabled', false); // Réactiver le bouton
            }
        });
    });

    function validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }
});
