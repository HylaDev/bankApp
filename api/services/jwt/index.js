import jwt from "jsonwebtoken";
import fs from "fs";
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../../../private.key');
const privateKey = fs.readFileSync(filePath, 'utf-8');


function generateJwt(payload) {
    return new Promise((resolve, reject) => {
      jwt.sign(payload, privateKey, { algorithm: "RS256" }, (error, token) => {
        if (error) {
          reject(error);
        } else {
          resolve(token);
        }
      });
    });
  }

  export default generateJwt;