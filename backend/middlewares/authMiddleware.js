import jwt from "jsonwebtoken";
import restaurantModel from "../models/restaurantModel.js";
import dotenv from "dotenv/config"

// Check le token de l'utilisateur à n'importe quel endroit de l'application
export function checkUser(req, res, next) {
    //Récupérer le token
    const token = req.cookies.jwtoken;
    if (token) {
        jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
            if (err) {
                // res.locals.restaurant = null;
                req.restaurant = null;
                next();
            } else {
                let restaurant = await restaurantModel.findById(decodedToken.id);
                // res.locals.restaurant = restaurant;
                req.restaurant = restaurant;
                // console.log(`C'EST MOI RES.LOCALS.USER3:`, res.locals.restaurant);
            }
            next();
        });
    } else {
        res.locals.user = null;
        next();
    }
}

//Pour vérifier le restaurant et récupérer son id
// export async function requireAuth(req, res, next) {
//     const token = req.cookies.jwtoken;
//   if (!token) {
//     console.log('❌ No token')
//     return res.status(401).json({ error: 'Token manquant' })
//   }
//     try {
//         if (!token) throw new Error("Non authentifié veuillez vous connecter");
//         const decodedId = jwt.verify(token, process.env.TOKEN_SECRET);
//         console.log('🗝️ decoded JWT =', decodedId);
//         const restaurant = restaurantModel.findById(decodedId.id);
//         // console.log('🍴 found restaurant =', restaurant);
//         if (!restaurant) throw new Error("Aucun restaurant trouvable");
//         //on stocke le restaurant avec son token
//         req.restaurant = restaurant;
//         next();
//     } catch (err) {
//         res.status(400).json({message : err.message});
//         next();
//     }
// }