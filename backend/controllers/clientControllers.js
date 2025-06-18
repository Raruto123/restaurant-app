import orderModel from "../models/orderModel.js";
import dotenv from "dotenv/config";
import LYGOS from "lygos-sdk";
import restaurantModel from "../models/restaurantModel.js";

export async function seeOrder(req, res) {
  const orderId = req.params.id;
  const order = await orderModel.findById(orderId);
  res.status(200).json(order);
}

// //À REVOIR QUAND TU AURAS FAIS VERIFIER TON COMPTE LYGOS
// export async function getPaymentDetails(req, res) {
//   const orderId = req.params.id;
//   try {
//     // Étape 1 : Trouver la commande
//     const order = await orderModel.findById(orderId);
//     if (!order) throw new Error("Commande introuvable");
//     // Étape 2 : Trouver le restaurant lié à la commande
//     const restaurant = await restaurantModel.findById(order.restaurant);
//     if (!restaurant || !restaurant.lygosApiKey) {
//       return res
//         .status(400)
//         .json({ error: "Clé API LYGOS non configurée pour ce restaurant" });
//     }
//     // Étape 3 : Initialiser LYGOS avec la bonne clé
//     const lygos = new LYGOS(restaurant.lygosApiKey);
//     // Étape 4 : Récupérer les infos du paiement
//     const orderDetails = await lygos.getPayment(order.qrCodeId);
//     if (!orderDetails) throw new Error("Aucun paiement initié avec cette id");

//     res.status(200).json(orderDetails);
//   } catch (err) {
//     console.error("Error in getPaymentDetails :", err);
//     return res.status(500).json({ err });
//   }
// }
