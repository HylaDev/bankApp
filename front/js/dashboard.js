const API_URL = 'http://localhost:3000';
let currentTransactions = [];
const token = localStorage.getItem('auth_token');
$(document).ready(function() {
    loadUserProfile(token);
    loadTotalBalance(token);
});
function loadUserProfile(token) {
    $.ajax({
        url: `${API_URL}/users/profile`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        success: function(response) {
            const user = response.user;

            $('#user-name').text(user.name);

            displayAccounts(user.accounts || []);

            displayTransactions(user.accounts || []);
            checkLowBalance(user.accounts || []);
        },
        error: function(error) {
            console.error("Erreur lors du chargement du profil :", error);
            alert("Erreur de chargement du profil. Veuillez vous reconnecter.");
            logout(); 
        }
    });
}

function loadTotalBalance(token) {
    $.ajax({
        url: `${API_URL}/users/totalBalance`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        success: function(response) {
            if (response.totalBalance !== undefined) {
                $('#total-balance').text(`${response.totalBalance}€`);
            } else {
                $('#total-balance').text("0€"); // Si aucun compte, affiche 0€
            }
        },
        error: function(error) {
            console.error("Erreur lors du chargement du solde total :", error);
            $('#total-balance').text("Erreur");
        }
    });
}


function displayAccounts(accounts) {
    let accountsHtml = '';

    if (!Array.isArray(accounts) || accounts.length === 0) {
        accountsHtml = `
            <div class="col-md-12">
                <div class="card mb-4 shadow-sm">
                    <div class="card-body text-center">
                        <h5 class="card-title">Vous n'avez pas de compte</h5>
                        <button class="btn btn-success" onclick="createAccount()">Créer un compte</button>
                    </div>
                </div>
            </div>
        `;
    } else {
        accounts.forEach(account => {
            // Si le solde est supérieur à zéro, le bouton de suppression sera désactivé
            const deleteButtonDisabled = account.balance > 0 ? 'disabled' : '';
            accountsHtml += `
                <div class="col-md-6">
                    <div class="card mb-4 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Compte ${account.accountType}</h5>
                            <p class="card-text">${account.balance}€</p>
                            <button class="btn btn-success" onclick="viewTransactions('${account.accountType}')">Voir les transactions</button>
                            <button class="btn btn-warning ml-2" onclick="defineThreshold('${account.accountType}', ${account.threshold || 0})">Définir le seuil</button>
                            <button class="btn btn-danger ml-2" onclick="deleteAccount('${account.accountNumber}')" ${deleteButtonDisabled}>Supprimer le compte</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    $('#accounts-section').html(accountsHtml);
}

function displayTransactions(accounts) {
    let transactionsHtml = '';
    let allTransactions = [];

    // toutes les transactions de tous les comptes
    if (Array.isArray(accounts)) {
        accounts.forEach(account => {
            if (account.transactions && account.transactions.length > 0) {
                allTransactions = allTransactions.concat(account.transactions.map(transaction => ({
                    ...transaction,
                    accountType: account.accountType 
                })));
            }
        });
    }

    // Trie les transactions par date
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3 dernières transactions
    const recentTransactions = allTransactions.slice(0, 3);

    // Génère le HTML pour chaque transaction
    if (recentTransactions.length > 0) {
        recentTransactions.forEach(transaction => {
            const formattedDate = new Date(transaction.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });
            transactionsHtml += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${transaction.transactionType === "Depot" ? '+' : '-'}${transaction.amount}€</td>
                    <td>${transaction.accountType}</td>
                </tr>
            `;
        });
    } else {
        transactionsHtml = '<tr><td colspan="4" class="text-center">Pas de transactions disponibles</td></tr>';
    }

    $('#transactions-table-body').html(transactionsHtml);
}


function createAccount() {
     window.location.replace('createAccount.html');
}

function viewTransactions(accountType) {
    $('#transactionAccountType').text(accountType);
    const email = localStorage.getItem('user_email');

    $.ajax({
        url: `${API_URL}/users/list/transactions`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        data: { email: email, accountType: accountType }, 
        success: function(response) {
            currentTransactions = response.transaction; 
            displayTransactionHistory(currentTransactions);
            $('#transactionHistoryModal').modal('show'); 
        },
        error: function(error) {
            console.error("Erreur lors du chargement de l'historique des transactions :", error);
            alert("Erreur lors du chargement de l'historique.");
        }
    });
}

function deleteAccount(accountNumber) {
    console.log(accountNumber)
    const email = localStorage.getItem('user_email');

    if (confirm("Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.")) {
        $.ajax({
            url: `${API_URL}/users/delete/account`,
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
            contentType: 'application/json',
            data: JSON.stringify({ email, accountNumber }),
            success: function(response) {
                alert("Compte supprimé avec succès.");
                loadUserProfile(localStorage.getItem('auth_token')); 
            },
            error: function(error) {
                console.error("Erreur lors de la suppression du compte :", error);
                alert("Erreur lors de la suppression du compte.");
            }
        });
    }
}

let selectedAccountType = '';

function defineThreshold(accountType, threshold) {
    selectedAccountType = accountType;
    $('#thresholdAccountType').text(accountType); 
    $('#thresholdInput').val(threshold); 
    
    $('#thresholdModal').modal('show');
}
function saveThreshold() {
    const email = localStorage.getItem('user_email');
    const threshold = parseFloat($('#thresholdInput').val()); 

    if (isNaN(threshold) || threshold <= 0) {
        alert("Veuillez entrer un seuil valide.");
        return;
    }

    $.ajax({
        url: `${API_URL}/users/define/threshold`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        data: JSON.stringify({ email: email, accountType: selectedAccountType, threshold: threshold }),
        contentType: 'application/json',
        success: function(response) {
            alert(response.message);
            $('#thresholdModal').modal('hide'); 
        },
        error: function(error) {
            console.error("Erreur lors de la définition du seuil :", error);
            if (error.responseJSON && error.responseJSON.message) {
                alert("Erreur : " + error.responseJSON.message);
            } else {
                alert("Erreur lors de la définition du seuil. Veuillez réessayer.");
            }
        }
    });
}


function checkLowBalance(accounts) {
    let lowBalanceDetected = false;
    let lowBalanceAccountType = '';

    accounts.forEach(account => {
        if (account.threshold && account.balance < account.threshold) {
            lowBalanceDetected = true;
            lowBalanceAccountType = account.accountType;
        }
    });

    if (lowBalanceDetected) {
        $('#low-balance-alert').show();
        $('#low-balance-account-type').text(lowBalanceAccountType);
    } else {
        $('#low-balance-alert').hide();
    }
}
function displayTransactionHistory(transactions) {
    const transactionHistoryTable = $('#transactionHistoryTable');
    transactionHistoryTable.empty();
    
    if (transactions.length === 0) {
        $('#noTransactionsMessage').show();
    } else {
        $('#noTransactionsMessage').hide();
        transactions.forEach(transaction => {
            // Convertit la date ISO en une date lisible en français
            const formattedDate = new Date(transaction.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });
            transactionHistoryTable.append(`
                <tr>
                    <td>${formattedDate}</td>
                    <td>${transaction.transactionType}</td>
                    <td>${transaction.transactionType === 'Depot' ? '+' : '-'}${transaction.amount}€</td>
                    <td>${transaction.newBalance || 'N/A'}€</td>
                </tr>
            `);
        });
    }
}

function applyFilters() {
    const filterType = $('#filterType').val();
    const filterPeriod = $('#filterPeriod').val();
    const now = new Date();

    let filteredTransactions = currentTransactions; 

    if (filterType) {
        filteredTransactions = filteredTransactions.filter(transaction => transaction.transactionType === filterType);
    }

    if (filterPeriod) {
        const daysAgo = new Date();
        daysAgo.setDate(now.getDate() - parseInt(filterPeriod));
        filteredTransactions = filteredTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= daysAgo && transactionDate <= now;
        });
    }

    displayTransactionHistory(filteredTransactions);

    if (filteredTransactions.length === 0) {
        $('#noTransactionsMessage').show();
    } else {
        $('#noTransactionsMessage').hide();
    }
}

function downloadCSV() {
    const csvContent = generateCSV(currentTransactions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'historique_transactions.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Téléchargement réussi !');
}

function generateCSV(transactions) {
    let csv = 'Date,Type,Montant,Solde du compte';
    transactions.forEach(transaction => {
        csv += `${transaction.date},${transaction.transactionType},${transaction.amount},${transaction.newBalance || 'N/A'}\n`;
    });
    return csv;
}