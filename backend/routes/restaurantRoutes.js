import express, { Router, urlencoded } from "express";
const router = Router();
import { checkOrderStatus, createOrder, createRestaurant, getAllRestaurants, login, notifyPayment, payOrder, seeDashboardOrders } from "../controllers/restaurantControllers.js";
import { checkUser } from "../middlewares/authMiddleware.js";

//créer restaurant (seul moi peut le faire)
router.post('/create-restaurant', createRestaurant)
//voir les restaurants (seul moi peut le faire)
router.get('/get-all-restaurants', getAllRestaurants)

//se connecter
router.post("/login", login);


//creer une commande requiert d'être connecté
router.post("/create-order", checkUser, createOrder);

//voir la liste des commandes dans le dashboard
router.get("/dashboard-orders", seeDashboardOrders);

// pour initaliser le paiement quand on envoie le code qr qui contiendra le payment_url
router.patch("/:id/pay", payOrder);
//pour confirmer au près de l'api de cinetpay que la commande a été payé et changé le status de la commande
router.post("/:id/notify", express.urlencoded({extended : true}), notifyPayment);

//pour confirmer par le client
router.get("/:id/status", checkOrderStatus);

//générer ou récupérer un code qr
// router.get("/:id/qr", getCodeQr)
export default router;