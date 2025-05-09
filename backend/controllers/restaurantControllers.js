import orderModel from "../models/orderModel.js";
import restaurantModel from "../models/restaurantModel.js";

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

    res.status(200).json({ email: restaurantUser._id });
    res.send("Connexion réussie! bienvenue dans votre restaurant");
  } catch (err) {
    console.log("Password entered :", password);
    console.error("une erreur est surevenue lors de la connexion", err);
    res.status(400).json({ error: err.message });
  }
}

export async function createOrder(req, res) {
  try {
    const { items, total, restaurantId, table } = req.body;
    const newOrder = new orderModel({
      items: items,
      totalAmount: total,
      restaurant: restaurantId,
      tableNumber: table,
      qrCodeId: Date.now(),
    });
    await newOrder.save();
    res.status(200).json(newOrder);
  } catch (err) {
    console.log("veuillez inscrire correctement les données");
    res.status(400).json({ error: err.message });
  }
}
