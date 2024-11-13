import bcrypt from "bcrypt";
import readData from "../readData/index.js";


function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (error, salt) => {
      if (error) {
        reject(error);
      } else {
        bcrypt.hash(password, salt, (error, hash) => {
          if (error) {
            reject(error);
          } else {
            resolve(hash);
          }
        });
      }
    });
  });
}

async function checkPass(email, password) {

  const users = readData();
  const user = users.find((user) => user.email === email)
  const match = await bcrypt.compare(password, user.password);
  if(match){
    return true;
  }
  return false;
  
}


export {hashPassword, checkPass} ;