import { Router } from "express";
const router = Router();
import { getPaymentDetails } from "../controllers/clientControllers.js";


//pour voir les détails de sa commande lorsque le client arrive sur le site et pour vérifier aussi si il y a "link" présent dans commande
router.get("/order/:id", getPaymentDetails)

export default router;