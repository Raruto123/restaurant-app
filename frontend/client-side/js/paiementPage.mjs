const baseUrl = window.APP_CONFIG.API_BASE_URL;
const payButton = document.getElementById("payer-button");

const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get("id");
// const total = urlParams.get('total');

async function displayOrder() {
  try {
    const response = await fetch(baseUrl + "/client/order/" + orderId, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      alert(
        "Vous êtes sur un mauvais lien. Veuillez scanner correctement le code QR ou demander au serveur de réimprimer le code."
      );
    }

    const order = await response.json();

    document.querySelector(
      "h1"
    ).textContent = `Table ${order.tableNumber} - Addition`;
    const ul = document.getElementById("order-list");
    ul.innerHTML = "";

    order.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.name} x ${item.qty} - ${item.price} FCFA`;
      ul.appendChild(li);
    });

    document.getElementById(
      "total-price"
    ).textContent = `${order.totalAmount} FCFA`;
  } catch (err) {
    document.getElementById("alertMessage").textContent = "Erreur réseau";
    document.getElementById("alertMessage").style.display = "block";
    document.getElementById("payer-button").style.display = "none";
  }
}

displayOrder();

// async function verifyPaymentLink() {
//   try {
//     const response = await fetch(
//       baseUrl + "/client/order/" + orderId + "/status",
//       {
//         method: "GET",
//         credentials: "include",
//       }
//     );
//     const data = await response.json();
//     console.log(data.status);

//     if (response.ok && (data.status === 404 || data.status === 422)) {
//       document.getElementById("alertMessage").textContent =
//         "Vous êtes sur le bon lien. Mais le serveur n'a pas encore lancé votre paiement. Veuillez patienter"
//       document.getElementById("alertMessage").style.display = "block";
//       document.getElementById("payer-button").style.display = "none";
//     } else {
//      // Affiche le bouton si le paiement est prêt
//       document.getElementById("alertMessage").style.display = "none";
//       document.getElementById("payer-button").style.display = "block";
//       payButton.addEventListener("click", () => {
//         window.location.href = "https://www.google.com";
//       });
//     }

//   } catch (err) {
//     document.getElementById("alertMessage").style.display = "block";
//     document.getElementById("payer-button").style.display = "none";
//   }
// }

async function verifyPaymentLinkCinetpay() {
  try {
    const response = await fetch(baseUrl + "/client/order/" + orderId, {
      method: "GET",
      credentials: "include",
    });

    const order = await response.json();

    if (response.ok && !order.payment_url) {
      document.getElementById("alertMessage").textContent =
        "Vous êtes sur le bon lien. Mais le serveur n'a pas encore lancé votre paiement. Veuillez patienter";
      document.getElementById("alertMessage").style.display = "block";
      document.getElementById("payer-button").style.display = "none";
    } else {
      // Affiche le bouton si le paiement est prêt
      document.getElementById("alertMessage").style.display = "none";
      document.getElementById("payer-button").style.display = "block";
      payButton.addEventListener("click", () => {
        window.location.href = order.payment_url;
      });
    }
  } catch (err) {
    document.getElementById("alertMessage").style.display = "block";
    document.getElementById("payer-button").style.display = "none";
  }
}

verifyPaymentLinkCinetpay();
