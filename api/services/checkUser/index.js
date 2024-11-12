import fs from 'fs';

function userExists(username) {
  try {
    
    const data = fs.readFileSync('../../../data/data.json', 'utf8');
    const users = JSON.parse(data).users;

    const user = users.find(user => user.email === email);
    return user ? true : false;
  } catch (error) {
    console.error("Erreur de lecture du fichier:", error);
    return false;
  }
}

export default userExists;
