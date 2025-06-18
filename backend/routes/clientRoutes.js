import { Router } from "express";
const router = Router();
import { seeOrder } from "../controllers/clientControllers.js";


//voir obtenir la liste des commandes côté client sans avoir besoin de cookies
router.get("/order/:id", seeOrder);

//pour voir les détails de sa commande lorsque le client arrive sur le site et pour vérifier aussi si il y a "link" présent dans commande
// router.get("/order/:id/status", getPaymentDetails)

//pour confirmer le statut de sa commande

export default router;