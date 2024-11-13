import readData from '../../services/readData/index.js';
import {hashPassword, checkPass} from '../../services/hashPassWord/index.js';
import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import generateJwt from '../../services/jwt/index.js';
import isAuthenticated from '../../../middlewares/isAuth/index.js';
import {checkAccountBalance} from '../../services/checkAccounts/index.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../../../data/data.json');


const saveData = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const router = express.Router();

router.get("/profile", isAuthenticated, async (req, res) => {
  const email = req.user.email;

  const users = readData();
  const user = users.find((user) => user.email === email);

  if (!user) {
      return res.status(404).json({ message: "User not found" });
  }
  
  res.status(200).json({ user: user });
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
        return res.status(409).json({ message: 'User already exists.' });
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
    res.cookie("auth_token", userToken, { httpOnly: true});

    res.status(201).json({ message: 'User registered and login successfully.', user: newUser, userToken: userToken});
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
    
    const checkPassword = await checkPass(email, password);
    if(checkPassword){
      const payload = {
        name: user.name,
        email: user.email,
        pass: user.password,
      };
      const userToken = await generateJwt(payload);
      res.cookie("auth_token", userToken, {  httpOnly: true, secure: true, maxAge: 3600000});
      return res.status(200).json({message:"user login", userToken:userToken, user:user})
    }
    return res.status(409).json({message:"user doesn't login"})

  });

  // Logout user
  router.post("/logout", isAuthenticated, (req, res) => {
    // Effacez le cookie contenant le jeton JWT
    res.clearCookie("auth_token", { httpOnly: true, secure: true });
    
    res.status(200).json({ message: "Logout successful" });
  });


  // create bank account for user
  router.post('/create-account', isAuthenticated, async (req, res) => {
    const { email, accountType, initialBalance } = req.body;

    if (!email || !accountType || initialBalance === undefined) {
        return res.status(400).json({ message: 'email, account type, and initial balance are required.' });
    }
    
    const parsedInitialB = parseFloat(initialBalance);
    if (isNaN(parsedInitialB) || parsedInitialB <= 0) {
        return res.status(400).json({ message: "Invalid amount. Amount must be a positive number." });
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
      return res.status(404).json({ message: 'This account type already exist.' });
    }
    const newAccount = {
        accountNumber: `YEJ-${Date.now()}`,
        accountType,
        balance: parsedInitialB,
        threshold: 50,
    };

    user.accounts.push(newAccount);
    saveData(users);

    res.status(201).json({ message: 'Bank account created successfully.', account: newAccount });
  });

  // list user accounts
  router.get('/accounts', isAuthenticated, async (req, res) => {
    const { email } = req.body;

    const users = readData();
    const user = users.find((user) => user.email === email);

    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user.accounts);
  });

  // add transaction to user
  router.post("/add/transaction", isAuthenticated, async (req, res) =>{
    const {email, accountType, transactionType, amount, date} = req.body;


    if (!email || !transactionType || !amount || !date){
      res.status(400).json({message: "email, transactionType, amount and date are required"});
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount. Amount must be a positive number." });
    }

    const users = readData();
    const user = users.find((user) => user.email === email);
    if(!user){
      return res.status(404).json({message:"user not found"});
    }
    if (!user.accounts){
      res.status(404).json({message:"user doesn't have account"})
    }

    const account = user.accounts.find((acc) => acc.accountType == accountType);
    console.log(account)
    if(!account){
      res.status(404).json({message:"user doesn't have this account type"})
    }

    if (!account.transactions) {
      account.transactions = [];
    }

    if (transactionType === "Retrait") {
        if (account.balance < parsedAmount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }
        account.balance -= parsedAmount;
    } else if (transactionType === "Depot") {
        account.balance += parsedAmount;
    } else {
        return res.status(400).json({ message: "Invalid transaction type" });
    }
    
    
    const userTransaction = {
      transactionType, 
      amount: parsedAmount,
      date
    }
    account.transactions.push(userTransaction);

    saveData(users);
    if(account.balance < account.threshold){
      res.status(200).json({message:"transaction added", transaction: userTransaction, notification: "Alerte : Le solde est en dessous du seuil défini!" })

    }
    res.status(200).json({message:"transaction added", transaction: userTransaction })

  })

  // transactions historisque

  router.get("/list/transactions", isAuthenticated, async (req, res) =>{
      const {email, accountType} = req.body;
      const users = readData();
      const user = users.find((user) => user.email === email);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const account = user.accounts.find((acc) => acc.accountType == accountType)
      if(!account){
        res.status(404).json({message:"user doesn't have this account type"})
      }
  
      if (!account.transactions) {
        account.transactions = []; 
      }

      if (!account.transactions || !Array.isArray(account.transactions)) {
          return res.status(404).json({ message: "User doesn't have any transactions" });
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
      res.status(404).json({message:"user doesn't have this account type"})
    }
  
    account.threshold = threshold;
    saveData(users);
  
    res.status(200).json({
      message: 'threshold updated successfuly',
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

    if (!user.accounts || !Array.isArray(user.accounts)) {
        return res.status(404).json({ message: "User doesn't have any accounts" });
    }

    const totalBalance = user.accounts.reduce((sum, account) => sum + account.balance, 0);

    res.status(200).json({ totalBalance });
  });


 export default router;