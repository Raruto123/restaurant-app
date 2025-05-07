import { Router } from "express";
const router = Router();
// import orderControllers from "../controllers/orderControllers";

//voir sa commande quand il arrive sur le site
router.get("/order-list", () => {
    console.log("lel1")
})

export default router;