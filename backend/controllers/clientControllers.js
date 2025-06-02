import orderModel from "../models/orderModel.js";
import dotenv from "dotenv/config";
import LYGOS from "lygos-sdk";

const lygos = new LYGOS(process.env.LYGOS_API_KEY);

export async function getPaymentDetails(req, res) {
  const orderId = req.params.id;
  try {
    const order = await orderModel.findById(orderId);
    if (!order) throw new Error("Commande introuvable");

    const orderDetails = await lygos.getPayment(order.qrCodeId);
    if (!orderDetails) throw new Error("Aucun paiement initié avec cette id");

    res.status(200).json(orderDetails);
  } catch (err) {
    console.error("Error in getPaymentDetails :", err);
    return res.status(500).json({ error: err.message });
  }
}
