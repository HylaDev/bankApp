import express from 'express';
const app = express();

app.use(express.json());


app.get("/", (req, res) => {
res.send({ message: "Welcome to monitoring web app" });
});


const port = 3000;
const server = app.listen(port, () => console.log(`listening on port ${port}`));
