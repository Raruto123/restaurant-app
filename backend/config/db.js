const mongoose = require('mongoose');
import('dotenv/config');


const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function runDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URI, clientOptions);
    } catch (error) {
        console.error("Erreur de la connexion:", error);
    }
}

module.exports = runDatabase;