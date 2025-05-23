import express from "express";
import cors from "cors";
// charger les variables d'environnement
import dotenv from "dotenv/config";
import cookieParser from "cookie-parser";
import runDatabase from "./config/db.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { checkUser, requireAuth } from "./middlewares/authMiddleware.js";

const app = express();
const port = process.env.PORT
//démarrer la connexion MONGO DB
await runDatabase()

//middlewares
app.use(express.json());//pour lire req.body
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());//pour lire req.cookies
app.use(cors(
    {
        origin : process.env.FRONTEND_URL,
        credentials : true//important pour les cookies
    }
));

//1ere route
app.get("/", (req, res) => {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.send(`API is running`);
})

//jwt
app.use(checkUser);
// app.use(requireAuth)
// app.use(checkOrder);

//routes
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/client", orderRoutes);


// console.log(app._router.stack.map(r => r.route && r.route.path).filter(Boolean))
//listen
app.listen(port, () => {
    console.log(`serveur démarré sur le port ${port}`)
})
