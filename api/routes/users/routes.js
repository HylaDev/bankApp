import readData from '../../services/readData/index.js';
import {hashPassword, checkPass} from '../../services/hashPassWord/index.js';
import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import generateJwt from '../../services/jwt/index.js';
import isAuthenticated from '../../../middlewares/isAuth/index.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../../../data/data.json');


const saveData = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const router = express.Router();

  // list users
  router.get("/", (req, res) => {
    const users = readData();
    res.status(200).json(users);
    });
  
    // create users
  router.post('/register', async (req, res) => {
      const {name, email, pass} = req.body;
      if (!name || !email || !pass) {
        return res.status(400).json({ message: 'name, email, and pass are required.' });
    }

    const users = readData();

    const userExists = users.some((user) => user.email === email);

    if (userExists) {
        return res.status(409).json({ message: 'Cet utilisateur existe déjà.' });
    }
    const password = await hashPassword(pass);

    const newUser = { name, email, password };
    users.push(newUser);
    saveData(users);

    const payload = {
      name: newUser.name,
      email: newUser.email,
      pass: newUser.password,
    };
    const userToken = await generateJwt(payload);
    //sameSite pour empêcher les attaques CSRF
    res.cookie("auth_token", userToken, { httpOnly: true, secure: true, sameSite: 'strict' });

    res.status(201).json({ message: 'Inscription avec succès .', user: newUser.email, userToken: userToken});
});

router.get("/profile", isAuthenticated, async (req, res) => {
  const email = req.user.email;

  const users = readData();
  const user = users.find((user) => user.email === email);

  if (!user) {
      return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ user: user });
});


  // login user
  router.post("/login", async (req, res) =>{
    const {email, password} = req.body;

    if(!email || !password){
      return res.status(400).json({message: 'email and password are required to login'})
    }

    const users = readData();
    const userExists = users.some((user) => user.email === email);
    if(!userExists){
      return res.status(404).json({message: "user not exist"});
    }
    const user = users.find((user) => user.email === email );
    console.log(user);
    const checkPassword = await checkPass(email, password);
    if(checkPassword){
      const payload = {
        name: user.name,
        email: user.email,
        pass: user.password,
      };
      const userToken = await generateJwt(payload);
      res.cookie("auth_token", userToken, { httpOnly: true, secure: true, sameSite: 'strict' });
      return res.status(200).json({message:"Vous êtes bien connecté", userToken:userToken, userEmail:user.email, userName:user.name})
    }
    return res.status(409).json({message:"connexion echouée"})

  });

  // logout user
  router.post("/logout", isAuthenticated, (req, res) => {
    res.clearCookie("auth_token", { httpOnly: true, secure: true });
    
    res.status(200).json({ message: "Déconnexion avec succès" });
  });

  // update profil
  router.put("/profile", (req, res) => {
    const { email, name } = req.body;
  
    if (!email || !name) {
      return res.status(400).json({ message: "Email and name are required" });
    }
  
    let users = readData();
    const userIndex = users.findIndex((u) => u.email === email);
  
    if (userIndex === -1) {
      return res.status(404).json({ message: "L'utilisateur n'existe pas" });
    }
    
    users[userIndex].name = name;
  
    saveData(users);
  
    return res.status(200).json({
      message: "Information mis à jour avec succès",
      updatedName: users[userIndex].name
    });
  });

  // create bank account for user
  router.post('/create-account', (req, res) => {
    const { email, accountType, initialBalance } = req.body;

    if (!email || !accountType || initialBalance === undefined) {
        return res.status(400).json({ message: 'email, account type, and initial balance are required.' });
    }
    
    const parsedInitialB = parseFloat(initialBalance);
    if (isNaN(parsedInitialB) || parsedInitialB <= 0) {
        return res.status(400).json({ message: "Montant invalide, il doit être supérieur à zéro." });
    }

    const users = readData();
    const user = users.find((user) => user.email === email);

    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    if (!user.accounts) {
      user.accounts = [];
    }
    const account = user.accounts.find((acc) => acc.accountType == accountType);
    if(account){
      return res.status(404).json({ message: 'Ce compte type existe déjà.' });
    }
    const newAccount = {
        accountNumber: `ACC-${Date.now()}`,
        accountType,
        balance: initialBalance
    };

    user.accounts.push(newAccount);
    saveData(users);

    res.status(201).json({ message: 'Compte bancaire créé avec succès.', account: newAccount });
  });

  // list user accounts
  router.get('/:email/accounts', (req, res) => {
    const { email } = req.params;

    const users = readData();
    const user = users.find((user) => user.email === email);

    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user.accounts);
  });

// add transaction to user
router.post("/add/transaction", isAuthenticated, async (req, res) => {
  const { email, accountType, transactionType, amount } = req.body;

  if (!email || !transactionType || !amount) {
      return res.status(400).json({ message: "email, transactionType, and amount are required" });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Montant invalide, il doit être supérieur à zéro." });
  }

  const users = readData();
  const user = users.find((user) => user.email === email);
  if (!user) {
      return res.status(404).json({ message: "user not found" });
  }
  if (!user.accounts) {
      return res.status(404).json({ message: "Vous n'avez pas de compte" });
  }

  const account = user.accounts.find((acc) => acc.accountType == accountType);
  if (!account) {
      return res.status(404).json({ message: "Vous n'avez pas ce type de compte" });
  }

  if (!account.transactions) {
      account.transactions = [];
  }

  // Convertir `account.balance` en nombre
  let newBalance = parseFloat(account.balance);
  if (isNaN(newBalance)) {
      return res.status(500).json({ message: "Erreur : Le solde actuel est invalide." });
  }

  // Calculer le nouveau solde
  if (transactionType === "Retrait") {
      if (newBalance < parsedAmount) {
          return res.status(400).json({ message: "Votre solde est insuffisant" });
      }
      newBalance -= parsedAmount;
  } else if (transactionType === "Depot") {
      newBalance += parsedAmount;
  } else {
      return res.status(400).json({ message: "Ce type de transaction n'existe pas" });
  }

  // Créer l'objet transaction
  const userTransaction = {
      transactionType,
      amount: parsedAmount,
      date: new Date(),
      newBalance: newBalance 
  };

  account.transactions.push(userTransaction);
  account.balance = newBalance; 

  // Sauvegarder les données
  saveData(users);

  // Vérification du seuil et notification si nécessaire
  if (newBalance < account.threshold) {
      return res.status(200).json({ message: "Transaction effectuée", transaction: userTransaction, notification: "Alerte : Le solde est en dessous du seuil défini!" });
  }

  // Retourner la réponse de succès
  res.status(200).json({ message: "Transaction effectuée", transaction: userTransaction });
});


  // transactions historisque

  router.get("/list/transactions", isAuthenticated, async (req, res) =>{
      const {email, accountType} = req.query;
      const users = readData();
      const user = users.find((user) => user.email === email);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const account = user.accounts.find((acc) => acc.accountType == accountType)
      if(!account){
        res.status(404).json({message:"Vous n'avez pas ce type de compte"})
      }
  
      if (!account.transactions) {
        account.transactions = []; 
      }

      if (!account.transactions || !Array.isArray(account.transactions)) {
          return res.status(404).json({ message: "Vous n'avez aucune transaction" });
      }
      res.status(200).json({transaction: account.transactions})

  })

  // define threshold 
  router.post('/define/threshold', (req, res) => {
    const { email, accountType, threshold } = req.body;
  
    const users = readData();
    const user = users.find(user => user.email === email);
  
    const account = user.accounts.find((acc) => acc.accountType == accountType)
    if(!account){
      res.status(404).json({message:"Vous n'avez pas ce type de compte"})
    }
  
    account.threshold = threshold;
    saveData(users);
  
    res.status(200).json({
      message: 'Seuil mis à jour avec succès',
      threshold: threshold
    });
  });

  
  router.get("/totalBalance", isAuthenticated, async (req, res) => {
    const email = req.user.email;

    const users = readData();
    const user = users.find((user) => user.email === email);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!user.accounts || !Array.isArray(user.accounts) || user.accounts.length === 0) {
      return res.status(200).json({ totalBalance: "0.00" });
  }

    //  parseFloat pour convertir chaque balance en nombre
    const totalBalance = user.accounts.reduce((sum, account) => parseFloat(sum) + parseFloat(account.balance), 0);

    console.log(totalBalance);
    res.status(200).json({ totalBalance });
});


  router.delete("/delete/account", async (req, res) => {
    const { email, accountNumber } = req.body;
  
    if (!email || !accountNumber) {
      return res.status(400).json({ message: "Tous les champs sont obligatoire" });
    }
  
    let users = readData();
    const user = users.find((u) => u.email === email);
  
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  
    const account = user.accounts.findIndex((acc) => acc.accountNumber === accountNumber);
  
    if (account === -1) {
      return res.status(404).json({ message: "Ce compte n'existe pas" });
    }
  
    const accountToDelete = user.accounts[account];
  
    
    if (accountToDelete.balance > 0) {
      return res.status(400).json({
        message: "Impossible de supprimer ce compte car le solde est supérieur à 0.",
        balance: accountToDelete.balance
      });
    }
  
    user.accounts.splice(account, 1);
    saveData(users);
  
    return res.status(200).json({
      message: "Compte supprimé avec succès",
      deletedAccountNumber: accountNumber,
      updatedTotalBalance: user.accounts.reduce((total, acc) => total + acc.balance, 0)
    });
  });



 export default router;