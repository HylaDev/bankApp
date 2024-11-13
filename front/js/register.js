const API_URL = 'http://localhost:3000';

$(document).ready(function() {
    $('#signupForm').on('submit', function(e){
        e.preventDefault();
        const name = $('#name').val().trim();
        const email = $('#email').val().trim();
        const pass = $('#password').val().trim();
        const confirm  = $('#confirm-password').val().trim();

        $('.error-message').text('').hide();
        let hasError = false;

        if(name === '') {
            $('#name-error').text('Veuillez entrer votre nom complet').show();
            hasError = true;
        }
        if(!validateEmail(email)) {
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
                $('#signupForm').trigger('reset');
                $('#success-message').text('Votre inscription a bien été prise en compte! Vous allez être redirigé vers le tableau de bord.').show();
                console.log(response);
                localStorage.setItem('auth_token', response.userToken);
                localStorage.setItem('user_email', response.userEmail);
                localStorage.setItem('user_name', response.userName);
                
                // Redirect to dashboard after 5 seconds
                setTimeout(() => {
                    window.location.replace('dashbord.html');
                }, 5000);
            },
            error: function(error) {
                console.error(error);
                $('#error-message').text('Une erreur est survenue lors de l\'inscription. Veuillez réessayer.').show();
            }
        })
    })

    function validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
      }
});
