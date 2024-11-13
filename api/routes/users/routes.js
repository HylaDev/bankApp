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
  router.get("/", isAuthenticated, async (req, res) => {
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

    res.status(201).json({ message: 'User registered and login successfully.', user: newUser });
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
      res.cookie("auth_token", userToken, { httpOnly: true});
      return res.status(200).json({message:"user login"})
    }
    return res.status(409).json({message:"user doesn't login"})

  });

  // create bank account for user
  router.post('/create-account', isAuthenticated, async (req, res) => {
    const { email, accountType, initialBalance } = req.body;

    if (!email || !accountType || initialBalance === undefined) {
        return res.status(400).json({ message: 'email, account type, and initial balance are required.' });
    }

    const users = readData();
    const user = users.find((user) => user.email === email);

    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    if (!user.accounts) {
      user.accounts = [];
  }
    const newAccount = {
        accountNumber: `ACC-${Date.now()}`,
        accountType,
        balance: initialBalance
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


 export default router;