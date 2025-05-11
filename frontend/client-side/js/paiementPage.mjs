import Cinetpay from "cinetpay-node-sdk";
import dotenv from "dotenv/config";

const cinetpay = new Cinetpay(
  process.env.CINETPAY_API_KEY,
  process.env.CINETPAY_SITE_ID
);

const paymentData = {
  transaction_id: "123456789",
  amount: 1000,
  currency: "XOF",
  description: "Achat de produits",
  notify_url: "http://localhost:23000/notify",
  return_url:
    "http://127.0.0.1:3000/frontend/client-side/pages/paiement-page.html",
  channels: "MOBILE_MONEY", // ou 'CREDIT_CARD', 'MOBILE_MONEY', 'WALLET'
};

function payer() {
  // Simule un paiement

  console.log("lel")
  cinetpay
    .initiatePayment(paymentData)
    .then((response) => {
      console.log("URL de paiement :", response.data.payment_url);
    })
    .catch((error) => {
      console.error("Erreur lors de l’initiation du paiement :", error.message);
    }); // En vrai ici on ferait appel à CinetPay ou autre API de paiement
}

// sélectionne le bouton et écouteur
document.getElementById("payer-button").addEventListener("click", payer);