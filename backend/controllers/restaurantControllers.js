import orderModel from "../models/orderModel.js";
import restaurantModel from "../models/restaurantModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv/config";
import LYGOS from "lygos-sdk";
import QRCode from "qrcode";

const lygos = new LYGOS(process.env.LYGOS_API_KEY);

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
    res.cookie("jwtoken", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: "lax", //ou "strict"
      // secure: true, true c'est uniquement pour le https en mode dev tu n'as pas droit à cela
      secure: false,
    });
    res.status(200).json({ message: "Connecté", id: restaurantUser._id });
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
    // const total = items.reduce((sum, { price, qty }) => sum + price * qty, 0);
    const total = items
      .filter(
        (item) =>
          item && typeof item.price === "number" && typeof item.qty === "number"
      )
      .reduce((sum, { price, qty }) => sum + price * qty, 0);

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
    //on génère l'url du site qui voit la commande
    const clientUrl = `${process.env.FRONTEND_URL}/order.html?id=${newOrder._id}&total=${newOrder.totalAmount}`;

    //on génère le code qr
    const qrCodeDataUrl = await QRCode.toDataURL(clientUrl).then((url) => url);
    res.status(200).json({
      message: "Commande crée",
      total: newOrder.totalAmount,
      id: newOrder._id,
      qrCode: qrCodeDataUrl,
      produits: newOrder.items,
    });
  } catch (err) {
    console.error("Erreur createOrder :", err);
    res
      .status(400)
      .json({
        error: err.message || "Erreur lors de la création de la commande",
      });
  }
}

export async function seeDashboardOrders(req, res) {
  const dashboardOrders = await orderModel.find({
    restaurant: req.restaurant._id.toString(),
  });
  res.status(200).json(dashboardOrders);
}

export async function updateOrder(req, res) {
  try {
    const orderId = req.params.id;
    const { items, tableNumber } = req.body;

    //on récupère la commande et on vérifie son propriétaire
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Commande non trouvée" });
    }

    if (order.restaurant.toString() !== req.restaurant._id.toString()) {
      return res.status(403).json({
        error:
          "Accès refusé cette commande n'appartient pas à votre restaurant",
      });
    }

    //on recalcule le total des items modifiés
    let total;
    if (items) {
      order.items = items;
      total = items.reduce((sum, { price, qty }) => sum + price * qty, 0);
      order.totalAmount = total;
    }

    if (tableNumber) order.tableNumber = tableNumber;
    await order.save();
    res.json({ message: "Commande modifiée", order: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteOrder(req, res) {
  try {
    const orderId = req.params.id;

    //on récupère la commande et on vérifie le propriétaire
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Commande non trouvée" });
    }

    if (order.restaurant.toString() !== req.restaurant._id.toString()) {
      return res
        .status(403)
        .json({ error: "Cette commande ne provient pas de votre restaurant" });
    }

    await orderModel.findByIdAndDelete(orderId);

    res.json({ message: "Commande supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /orders/:id/pay
 * Initialise le paiement pour l'ordre d'id = req.params.id
 */
export async function payOrder(req, res) {
  try {
    // 2. Récupérer la commande
    const order = await orderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 3. Construire le PaymentData
    const paymentData = {
      amount: order.totalAmount, // montant total de la commande
      shop_name: "Fast Cashier",
      order_id: order.qrCodeId,
      message: `Payment for order ${order._id} effectué`,
      failure_url: `https://webhook.site/2f4f8fb0-7e42-4520-b923-3e8a6b5bf672`,
      success_url: `https://webhook.site/2f4f8fb0-7e42-4520-b923-3e8a6b5bf672`,
    };

    // 4. Appeler lygos
    const response = await lygos.initPayment(paymentData);

    //Gérer les erreurs
    if (response.error) {
      return res
        .status(response.status || 400)
        .json({ error: `voici l'erreur => ${response.error}` });
    }

    //Retourner l'url de paiement
    return res.status(200).json({
      payment_url: response.link,
      gateway_id: response.order_id,
      responseKeys: Object.keys(response),
      responseValues: Object.values(response),
    });
  } catch (err) {
    console.error("Error in payOrder:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// export async function notifyPayment(req, res) {
//   try {
//         // 1) Récupérer le token et les données envoyées
//     const data = req.body;
//     const token = req.get("x-token");
//     const secretKey = process.env.CINETPAY_SECRET_KEY;
//     // 2) Vérifier le token HMAC via la méthode fournie

//     const isValid = await Cinetpay.verifyHMACToken(token, secretKey, data);

//     if (!isValid) {
//       return res.status(401).send("Invalid HMAC token");
//     }

//     const order = await orderModel.findOne({ qrCodeId: data.cpm_trans_id });
//     if (!order) {
//       return res.status(404).send("Order not found");
//     }
//     // 3) Mettre à jour la commande correspondante

//     order.status = "paid";
//     await order.save();
//     // 4) Répondre à CinetPay

//     res.status(200).send("OK");
//   } catch (err) {
//     console.error("notifyPayment error:", err);
//     res.status(500).send("Internal Server Error");
//   }
// }

// export async function checkOrderStatus(req, res) {

//   try {
//         const order = await orderModel.findById(req.params.id);
//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // 1) Appel à checkTransaction pour obtenir le statut
//     const result = await cinetpay.checkTransaction(order.qrCodeId);

//     if (result.data.status === "ACCEPTED") {
//       // 2) Mettre à jour la commande si nécessaire
//       if (order.status !== "paid") {
//         order.status = "paid";
//         await order.save();
//       }
//     } else {
//       console.log(result.data.status)
//     }

//     // 3) Retourner le statut actuel
//     return res.status(200).json({
//       orderId: order._id,
//       status: order.status,
//       payment_method: result.data.payment_method,
//       amount: result.data.amount
//     });
//   } catch (err) {
//     console.error("Error in checkOrderStatus:", err);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }

// }

export async function checkOrderStatus(req, res) {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) throw new Error("This order doesn't exist");

    const result = await lygos.paymentStatus(order.qrCodeId);
    if (!result) throw new Error("Aucun paiement initié avec cette id");

    // const payments = await lygos.listOfPayment();
    // // console.log(payments);

    if (result.status === "completed") {
      order.status = "paid";
      await order.save();
    } else if (result.status === "accepted") {
      console.log("En attente du paiement de la commande :", result.order_id);
    } else if (result.status === "failed") {
      console.log("Erreur de la commande :", result.order_id);
    }

    return res.status(200).json({
      orderId: order._id,
      status: order.status,
      lygosStatus: result.status,
      lygosResultKeys: Object.keys(result),
      lygosResultValues: Object.values(result),
    });
  } catch (err) {
    console.error("Error in checkOrderStatus :", err);
    return res.status(500).json({ error: err.message });
  }
}
