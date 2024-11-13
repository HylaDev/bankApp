import fs from "fs";
import { fileURLToPath } from 'url';
import path from 'path';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../../private.key');
const privateKey = fs.readFileSync(filePath, 'utf-8');

function isAuthenticated(req, res, next) {
    // get cookie 
    const token = req.cookies.auth_token || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized, token not found' });
    }
    
    try {
      const decoded = jwt.verify(token, privateKey);
      req.user = decoded;
      res.user = decoded;
      next();
  } catch (error) {
      res.status(400).json({ message: "Invalid token" });
  }
  }

  export default isAuthenticated;