const API_URL = 'http://localhost:3000';

function displayTransactionMessage(message, success = false){
    const outputDiv = document.getElementById('transactionMessage');
    outputDiv.textContent = message;
    outputDiv.style.color = success ? 'green' : 'red';   
}

function addTransaction(event) {
    event.preventDefault();
const transactionType = document.getElementById('transactionType').value;
const amount = document.getElementById('amount').value;
const accountType = document.getElementById('accountType').value;

const token =  localStorage.getItem('auth_token');
const email = localStorage.getItem('user_email');

if (!token) {
    displayTransactionMessage("Utilisateur non authentifie. Veuillee vous connecter.", false);
    return;
}

const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/users/add/transaction`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`); 

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log("Réponse du serveur : ", xhr.responseText);
            const response = JSON.parse(xhr.responseText);

            if (xhr.status === 200) {
                displayTransactionMessage(response.message, true);
                window.location.href = 'dashboard.html';
                // setTimeout(() => {
                //     window.location.href = 'dashboard.html';
                // }, 2000);
    
            } else {
                displayTransactionMessage(response.message || 'Erreur lors de l\'ajout de la transaction', false);
            }
        }
    };

    
    const data = JSON.stringify({
        email,
        accountType,
        transactionType,
        amount
        
    });

    xhr.send(data);
}
document.getElementById('transactionForm').addEventListener('submit', addTransaction);
