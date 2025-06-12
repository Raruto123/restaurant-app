import mongoose from "mongoose";
import bcrypt from 'bcrypt';

//model du restaurant
const restaurantSchema = new mongoose.Schema({
    email : {
        type : String,
        unique : true,
        required : true,
    },
    password : {
        type : String,
        required : true
    },
    lygosApiKey : {
        type : String,
        required : false
    }
},     {timestamps : true}
)

//hashage du mot de passe
//joue la fonction avant d'enregistrer le document dans la databse pour crypter le password
restaurantSchema.pre('save', async function(next) {
    if (!this.isModified) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

// Vérification du mot de passe
restaurantSchema.methods.comparePassword = async function (plain) {
    return bcrypt.compare(plain, this.password)
}

export default mongoose.model("Restaurant", restaurantSchema);