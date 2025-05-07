import restaurantModel from "../models/restaurantModel.js";

//créer un restaurant
export async function createRestaurant(req, res) {
    try {
        const newRestaurant = await restaurantModel.create(req.body);
        res.status(201).json(newRestaurant);
    } catch (err) {
        res.status(400).json({error : err.message})
    }
}

export async function getAllRestaurants(req, res) {
    const restaurants = await restaurantModel.find();
    res.json(restaurants);
}