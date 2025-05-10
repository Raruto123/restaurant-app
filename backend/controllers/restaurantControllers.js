import orderModel from "../models/orderModel.js";
import restaurantModel from "../models/restaurantModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv/config";

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
    console.log('🏷️ req.restaurant =', req.restaurant);

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
    res.status(201).json(newOrder);
  } catch (err) {
    console.error("Erreur createOrder :", err);
    res.status(400).json({ error: err.message });
  }
}
