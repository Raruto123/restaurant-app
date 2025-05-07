import express from "express";
import cors from "cors";
// charger les variables d'environnement
import dotenv from "dotenv/config";
import runDatabase from "./config/db.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();
const port = process.env.PORT
//démarrer la connexion MONGO DB
await runDatabase()

//middlewares
app.use(cors(
    {
        origin : true,
        credentials : true
    }
));
app.use(express.json());

//routes
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/client", orderRoutes);
app.get("/", (req, res) => {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.send(`API is running`);
})


//jwt

//listen
app.listen(port, () => {
    console.log(`serveur démarré sur le port ${port}`)
})