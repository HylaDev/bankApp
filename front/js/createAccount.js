const API_URL = 'http://localhost:3000';  
function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_name');

  window.location.replace('login.html');
}
function displayAccountMessage(message, success = false) {
  const outputDiv = document.getElementById('accountMessage');
  outputDiv.textContent = message;
  outputDiv.style.color = success ? 'green' : 'red';
}

function addAccount(event) {
  event.preventDefault();
  
  const accountName = document.getElementById('accountName').value;
  const accountType = document.getElementById('accountType').value;
  const initialBalance = document.getElementById('initialBalance').value;
  const email = localStorage.getItem('user_email');

  const token = localStorage.getItem('auth_token');  

  if (!token) {
    displayAccountMessage("Utilisateur non authentifié. Veuillez vous connecter.", false);
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_URL}/users/create-account`, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      console.log("Réponse du serveur : ", xhr.responseText);
      const response = JSON.parse(xhr.responseText);
      console.log(xhr.status);
      if (xhr.status === 201) {
        console.log("check me");
        displayAccountMessage(response.message, true);
      setTimeout(() => {
        window.location.href = 'dashbord.html'; 
      }, 2000); 
      } else {
        displayAccountMessage(response.message || 'Erreur de création de compte', false);
      }
    }
  };

  const data = JSON.stringify({
    accountName,
    accountType,
    email,
    initialBalance
  });

  console.log("Requête envoyée : ", data);
  xhr.send(data);
}

document.getElementById('createAccountForm').addEventListener('submit', addAccount);
