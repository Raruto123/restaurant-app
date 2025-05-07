import mongoose from 'mongoose';
import dotenv from "dotenv/config";


const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function runDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URI, clientOptions).then(function () {
            console.log("Succès de la connexion à MONGO DB")
        });
    } 
    catch (error) {
        console.error("Erreur de la connexion:", error.errorResponse.errmsg);
    }
}

export default runDatabase;