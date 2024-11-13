const API_URL = 'http://localhost:3000'
function displayLoginMessage(message,success = false){
    const loginMessage = document.getElementById('loginMessage');
    loginMessage.textContent=message;
    loginMessage.style.color = success ? 'green' : 'red';
}

function loginUser(event){
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/users/login`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
        if ( xhr.readyState === 4) {
            console.log("Réponse du serveur : ", xhr.responseText);
            const response = JSON.parse(xhr.responseText);
            if(xhr.status === 200){
                displayLoginMessage(response.message,true);
            }else{
                displayLoginMessage(response.message);
            }
        }

    };
    const data = JSON.stringify({email, password});
    console.log("requete  envoyee", API_URL + "/users");
    console.log(data)

     xhr.send(data);
}
document.getElementById('loginForm').addEventListener('submit', loginUser);
