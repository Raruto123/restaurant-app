import orderModel from "../models/orderModel.js";
import restaurantModel from "../models/restaurantModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv/config";
import Cinetpay from "cinetpay-node-sdk";

const cinetpay = new Cinetpay(
  process.env.CINETPAY_API_KEY,
  process.env.CINETPAY_SITE_ID
);

//créer un restaurant
export async function createRestaurant(req, res) {
  try {
    const newRestaurant = await restaurantModel.create(req.body);
    // const newRestaurant = await restaurantModel.create({
    //     email = req.body,
    //     password = req.body
    // });

    res.status(201).json(newRestaurant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getAllRestaurants(req, res) {
  const restaurants = await restaurantModel.find();
  res.json(restaurants);
}

//se connecter à son restaurant
export async function login(req, res) {
  const { email, password } = req.body;
  try {
    //vérification du mail
    const restaurantUser = await restaurantModel.findOne({ email });
    if (!restaurantUser) throw new Error("E-mail introuvable");
    // Vérification du mot de passe
    const validateUser = await restaurantUser.comparePassword(password);
    if (!validateUser) throw new Error("Mot de passe incorrect");

    //Attribuer un token à la connexion
    const token = jwt.sign(
      { id: restaurantUser._id },
      process.env.TOKEN_SECRET,
      { expiresIn: "3d" }
    );
    //Stocker le cookie
    res
      .cookie("jwtoken", token, {
        httpOnly: true,
        maxAge: 3 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
      })
      .status(200)
      .json({ message: "Connecté", id: restaurantUser._id });
  } catch (err) {
    console.log("Password entered :", password);
    console.error("une erreur est surevenue lors de la connexion", err);
    res.status(400).json({ error: err.message });
  }
}

export async function createOrder(req, res) {
  // console.log('🏷️ res.locals.restaurant =', req.restaurant);
  console.log("🏷️ req.restaurant =", req.restaurant);

  try {
    const { items, table } = req.body;

    //On calcule le total
    const total = items.reduce((sum, { price, qty }) => sum + price * qty, 0);
    //on prend l'id du restaurant depuis ce qu'on a stocké
    const restaurantId = req.restaurant._id;
    // const restaurantId = res.locals.restaurant._id;

    const newOrder = new orderModel({
      items: items,
      totalAmount: total,
      restaurant: restaurantId,
      tableNumber: table,
      qrCodeId: Date.now().toString(),
    });
    await newOrder.save();
    //Attribuer un token à la connexion
    const tokenOrder = jwt.sign(
      { id: newOrder._id },
      process.env.TOKEN_SECRET,
      { expiresIn: "3d" }
    );
    //Stocker le cookie
    res
      .cookie("jwtokenOrder", tokenOrder, {
        httpOnly: true,
        maxAge: 3 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
      })
      .status(200)
      .json({ message: "Token appliqué à cette commande", id: newOrder._id });
  } catch (err) {
    console.error("Erreur createOrder :", err);
    res.status(400).json({ error: err.message });
  }
}

export async function seeDashboardOrders(req, res) {
  const dashboardOrders = await orderModel.find();
  res.status(200).json(dashboardOrders);
}

// export async function payOrder(req, res) {
//   const paymentData = {
//     transaction_id: req.order._id,
//     amount: req.order.totalAmount,
//     currency: "XOF",
//     description: req.order.items,
//     notify_url: "https://webhook.site/2f4f8fb0-7e42-4520-b923-3e8a6b5bf672",
//     return_url: "https://webhook.site/2f4f8fb0-7e42-4520-b923-3e8a6b5bf672",
//     channels: "MOBILE_MONEY", // ou 'CREDIT_CARD', 'MOBILE_MONEY', 'WALLET'
//   };
//   cinetpay
//     .initiatePayment(paymentData)
//     .then((response) => {
//       console.log("l'URL de paiement :", response.data.payment_url);
//     })
//     .catch((error) => {
//       console.log(
//         "Erreur lors de l'initialisation du paiement :",
//         error.message
//       );
//     });
//   const results = cinetpay.checkTransaction(paymentData.transaction_id);
//   console.log(results);
//   // if (results.data.status === "ACCEPTED") {
//   //   await orderModel.findByIdAndUpdate(req.order._id, { status: "paid" });
//   //   return res.json({ message: "Paiement validé" });
//   // } else {
//   //   res.status(400).json({ error: "Paiement échoué" });
//   // }
// }

/**
 * POST /orders/:id/pay
 * Initialise le paiement pour l'ordre d'id = req.params.id
 */
export async function payOrder(req, res) {
  try {
    // 2. Récupérer l'ordre
    const order = await orderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 3. Construire le PaymentData
    /** @type {import('cinetpay-node-sdk').PaymentData} */
    const paymentData = {
      transaction_id: order.qrCodeId, // identifiant unique de la transaction
      amount: order.totalAmount, // montant total de la commande
      currency: "XOF", // ou selon votre zone
      description: `Payment for order ${order._id}`,
      notify_url: `https://webhook.site/2f4f8fb0-7e42-4520-b923-3e8a6b5bf672`,
      return_url: `https://webhook.site/2f4f8fb0-7e42-4520-b923-3e8a6b5bf672`,
      channels: "ALL", // ou MOBILE_MONEY, WALLET, ...
    };

    // 4. Appeler CinetPay
    const response = await cinetpay.initiatePayment(paymentData);
    // const results = await cinetpay.checkTransaction(paymentData.transaction_id);
    //console.log(results.data.status);

    if (response.code === "201") {
      // code 201 = succès
      return res.status(400).json({
        success_code: response.code,
        message: response.message,
        description: response.description,
        payment_url: response.data.payment_url,
        payment_token: response.data.payment_token,
      });
    } else {
      return res.status(200).json({
        error_code: response.code,
        error: response.message,
        description: response.description,
      });
    }
  } catch (err) {
    console.error("Error in payOrder:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function notifyPayment(req, res) {
  try {
        // 1) Récupérer le token et les données envoyées
    const data = req.body;
    const token = req.get("x-token");
    const secretKey = process.env.CINETPAY_SECRET_KEY;
    // 2) Vérifier le token HMAC via la méthode fournie

    const isValid = await Cinetpay.verifyHMACToken(token, secretKey, data);

    if (!isValid) {
      return res.status(401).send("Invalid HMAC token");
    }

    const order = await orderModel.findOne({ qrCodeId: data.cpm_trans_id });
    if (!order) {
      return res.status(404).send("Order not found");
    }
    // 3) Mettre à jour la commande correspondante

    order.status = "paid";
    await order.save();
    // 4) Répondre à CinetPay

    res.status(200).send("OK");
  } catch (err) {
    console.error("notifyPayment error:", err);
    res.status(500).send("Internal Server Error");
  }
}

export async function checkOrderStatus(req, res) {

  try {
        const order = await orderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 1) Appel à checkTransaction pour obtenir le statut
    const result = await cinetpay.checkTransaction(order.qrCodeId);

    if (result.data.status === "ACCEPTED") {
      // 2) Mettre à jour la commande si nécessaire
      if (order.status !== "paid") {
        order.status = "paid";
        await order.save();
      }
    } else {
      console.log(result.data.status)
    }

    // 3) Retourner le statut actuel
    return res.status(200).json({
      orderId: order._id,
      status: order.status,
      payment_method: result.data.payment_method,
      amount: result.data.amount
    });
  } catch (err) {
    console.error("Error in checkOrderStatus:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
  
}