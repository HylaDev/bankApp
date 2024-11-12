import express from 'express';
import usersRoutes from './api/routes/users/routes.js';
import bodyParser from 'body-parser';
const app = express();

app.use(express.json());
app.use(bodyParser.json());


app.get("/", (req, res) => {
res.send({ message: "Welcome to your bank account management app" });
});

app.use("/users", usersRoutes);



const port = 3000;
app.listen(port, () => console.log(`listening on port ${port}`));
