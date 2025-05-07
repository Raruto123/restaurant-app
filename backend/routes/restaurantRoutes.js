import { Router } from "express";
const router = Router();
import { createRestaurant, getAllRestaurants } from "../controllers/restaurantControllers.js";

//créer restaurant (seul moi peut le faire)
router.post('/create-restaurant', createRestaurant)
//voir les restaurants (seul moi peut le faire)
router.get('/get-all-restaurants', getAllRestaurants)

// //se connecter
// router.post("/login", () => {
//     console.log("lel2")
// })
// //creer une commande/codeqr
// router.post("/create-order", () => {
//     console.log("lel3")
// })
// //voir la liste des commandes dans le dashboard
// router.get("/dashboard-orders", () => {
//     console.log("lel4")
// })
export default router;