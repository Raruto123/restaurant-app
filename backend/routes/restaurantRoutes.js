import { Router } from "express";
const router = Router();
import { checkOrderStatus, checkOrderStatusCinetpay, createOrder, createRestaurant, deleteOrder, getAllRestaurants, login, payOrder, payOrderCinetpay, seeDashboardOrders, updateOrder } from "../controllers/restaurantControllers.js";
import { checkAuth, checkUser, requireAuth } from "../middlewares/authMiddleware.js";

//créer restaurant (seul moi peut le faire)
router.post('/create-restaurant', createRestaurant)
//voir les restaurants (seul moi peut le faire)
router.get('/get-all-restaurants', getAllRestaurants)

//se connecter
router.post("/login", login);

//pour protéger mes pages front
router.get("/me", requireAuth, checkUser, checkAuth);

//creer une commande requiert d'être connecté
router.post("/create-order", requireAuth, checkUser, createOrder);

//voir la liste des commandes dans le dashboard
router.get("/dashboard-orders", requireAuth, checkUser, seeDashboardOrders);

router.patch("/:id/modify", requireAuth, checkUser, updateOrder);

router.delete('/:id/delete', requireAuth, checkUser, deleteOrder);

///////////////////////LYGOS\\\\\\\\\\\\\
// pour initaliser le paiement quand on envoie le code qr qui contiendra le payment_url
router.patch("/:id/pay", requireAuth, payOrder);
//pour confirmer au près de l'api de lygos que la commande a été payé et changé le status de la commande
// router.post("/:id/notify", express.urlencoded({extended : true}), notifyPayment);

// //pour confirmer par le client
router.get("/:id/status", requireAuth, checkOrderStatus);


/////////////////////CINETPAY\\\\\\\\\\\\\\\\\\\\\\\
// pour initaliser le paiement quand on envoie le code qr qui contiendra le payment_url
router.post("/:id/cinetpay/pay", requireAuth, payOrderCinetpay);


//pour confirmer le statut de la commande dans le dashboard
router.get("/:id/cinetpay/status", requireAuth, checkOrderStatusCinetpay);


//générer ou récupérer un code qr
// router.get("/:id/qr", getCodeQr)
export default router;