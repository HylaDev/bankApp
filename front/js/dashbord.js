const API_URL = 'http://localhost:3000';
let currentTransactions = [];
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');

    window.location.replace('login.html');
}

$(document).ready(function() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        alert("Vous devez être connecté pour accéder au tableau de bord.");
        window.location.replace('login.html');
        return;
    }

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
            $('#total-balance').text(`${response.totalBalance.toFixed(2)}€`);
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
            accountsHtml += `
                <div class="col-md-4">
                    <div class="card mb-4 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Compte ${account.accountType}</h5>
                            <p class="card-text">${account.balance.toFixed(2)}€</p>
                            <button class="btn btn-success" onclick="viewTransactions('${account.accountType}')">Voir les transactions</button>
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
    let hasTransactions = false;

    if (Array.isArray(accounts)) {
        accounts.forEach(account => {
            if (account.transactions && account.transactions.length > 0) {
                hasTransactions = true;
                account.transactions.forEach(transaction => {
                    transactionsHtml += `
                        <tr>
                            <td>${transaction.date}</td>
                            <td>${transaction.transactionType === "Depot" ? '+' : '-'}${transaction.amount}€</td>
                            <td>${transaction.transactionType}</td>
                        </tr>
                    `;
                });
            }
        });
    }

    if (hasTransactions) {
        $('#transactions-table-body').html(transactionsHtml);
    } else {
        $('#transactions-table-body').html('<tr><td colspan="4" class="text-center">Pas de transactions disponibles</td></tr>');
    }
}

function createAccount() {
    alert("Redirection vers la page de création de compte");
    // window.location.replace('login.html');
}

function viewTransactions(accountType) {
    const email = localStorage.getItem('user_email'); // On suppose que l'email est stocké dans le localStorage

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

function displayTransactionHistory(transactions) {
    const transactionHistoryTable = $('#transactionHistoryTable');
    transactionHistoryTable.empty();
    
    if (transactions.length === 0) {
        $('#noTransactionsMessage').show();
    } else {
        $('#noTransactionsMessage').hide();
        transactions.forEach(transaction => {
            transactionHistoryTable.append(`
                <tr>
                    <td>${transaction.date}</td>
                    <td>${transaction.transactionType}</td>
                    <td>${transaction.transactionType === 'Depot' ? '+' : '-'}${transaction.amount}€</td>
                    <td>${transaction.balanceAfterTransaction || 'N/A'}€</td>
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
    let csv = 'Date,Type,Montant,Solde après transaction\n';
    transactions.forEach(transaction => {
        csv += `${transaction.date},${transaction.transactionType},${transaction.amount},${transaction.balanceAfterTransaction || 'N/A'}\n`;
    });
    return csv;
}