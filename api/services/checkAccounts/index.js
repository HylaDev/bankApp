import readData from "../readData/index.js";


async function checkAccountBalance(email, accountType, amount, transactionType) {
    const users = readData();

    const user = users.find((user) => user.email === email)
    for(i in user.accounts){
        if (user.accounts[i].accountType === accountType){
                if(transactionType === "Retrait"){
                    if(user.accounts[i].balance >= amount){
                        
                    }
                    return false
                }
                else if(transactionType === "Depot"){
                    
                }
        }
    }
    
    
    return 0
}

export {checkAccountBalance};