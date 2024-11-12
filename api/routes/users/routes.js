import userExists from '../../services/checkUser/index.js';
import express from 'express';

const router = express.Router();
router.get("/", (req, res) => {
    res.send({ message: "users" });
    });


router.post("register", async (req, res) => {
    
    const {nom, email, password} = req.body;
    console.log(req.body);
    
    /*try {
        if (userExists(email)) {
            console.log("Le user existe");
            res.status(400).json({ message: "L'utilisateur existe déjà" });
          } else {
            console.log("Le user n'existe pas");
            res.status(200).json({ message: "Utilisateur créé" });
          }
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Erreur de serveur" });
      }*/

}); 
 export default router;