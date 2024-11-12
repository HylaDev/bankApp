import express from 'express';
import usersRoutes from './api/routes/users/routes.js'
const app = express();

app.use(express.json());


app.get("/", (req, res) => {
res.send({ message: "Welcome to your bank account management app" });
});

app.use("users", usersRoutes);


const port = 3000;
const server = app.listen(port, () => console.log(`listening on port ${port}`));
