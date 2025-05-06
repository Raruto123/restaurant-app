import express from "express";
// charger les variables d'environnement
import dotenv from "dotenv/config";

const app = express();
const port = process.env.PORT


//middlewares

//routes

//jwt

//listen
app.listen(port, () => {
    console.log(`serveur démarré sur le port ${port}`)
})