const API_URL = 'http://localhost:3000'
const MAX_ATTEMPTS = 5; // Nombre maximum de tentatives de connexion
const BLOCK_TIME = 30000; // Durée de blocage (30 secondes)
let attempts = 0;
let isBlocked = false;

function displayLoginMessage(message,success = false){
    const loginMessage = document.getElementById('loginMessage');
    loginMessage.textContent=message;
    loginMessage.style.color = success ? 'green' : 'red';
}

function blockUser() {
    const loginButton = document.querySelector('button[type="submit"]');
    loginButton.disabled = true; // Désactiver le bouton de connexion
    isBlocked = true;
    displayLoginMessage(`Trop de tentatives. Veuillez réessayer dans ${BLOCK_TIME / 1000} secondes.`);
    setTimeout(() => {
        attempts = 0;
        isBlocked = false;
        loginButton.disabled = false; // Réactiver le bouton de connexion
        displayLoginMessage('');
    }, BLOCK_TIME);
}

function loginUser(event){
    event.preventDefault();
    if (isBlocked) {
        displayLoginMessage("Veuillez patienter avant de réessayer.");
        return;
    }

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

     if (password.length < 8) {
         displayLoginMessage("Le mot de passe doit contenir au moins 8 caractères.");
         return;
     }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/users/login`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
        if ( xhr.readyState === 4) {

            const response = JSON.parse(xhr.responseText);
            if(xhr.status === 200){
                displayLoginMessage(response.message,true);

                localStorage.setItem('auth_token', response.userToken);
                localStorage.setItem('user_email', response.userEmail);
                localStorage.setItem('user_name', response.userName);

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);

            }else{
                displayLoginMessage(response.message);
                attempts++;

                // Bloque l'utilisateur si le nombre maximum de tentatives est atteint
                if (attempts >= MAX_ATTEMPTS) {
                    // Vider les champs de saisie après une tentative échouée
                    document.getElementById('email').value = '';
                    document.getElementById('password').value = '';
                    blockUser();
                }
            }
        }

    };
    const data = JSON.stringify({email, password});

     xhr.send(data);
}
document.getElementById('loginForm').addEventListener('submit', loginUser);
