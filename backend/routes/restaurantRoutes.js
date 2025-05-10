import { Router } from "express";
const router = Router();
import { createOrder, createRestaurant, getAllRestaurants, login } from "../controllers/restaurantControllers.js";
import { checkUser } from "../middlewares/authMiddleware.js";

//créer restaurant (seul moi peut le faire)
router.post('/create-restaurant', createRestaurant)
//voir les restaurants (seul moi peut le faire)
router.get('/get-all-restaurants', getAllRestaurants)

//se connecter
router.post("/login", login);


//creer une commande requiert d'être connecté
router.post("/create-order", checkUser, createOrder);
// //voir la liste des commandes dans le dashboard
// router.get("/dashboard-orders", () => {
//     console.log("lel4")
// })
//marquer une commande comme payée
// router.patch("/:id/pay", payOrder);

//générer ou récupérer un code qr
// router.get("/:id/qr", getCodeQr)
export default router;