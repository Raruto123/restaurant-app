const baseUrl = window.APP_CONFIG.API_BASE_URL;
const clientBaseUrl = window.APP_CONFIG.CLIENT_URL;

async function checkAuthOrRedirect() {
  try {
    const response = await fetch(baseUrl + "/restaurant/me", {
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      //token manquant retourne à la page connexion
      alert(data.message);
      setTimeout(() => {
        window.location.href = "/frontend/admin-side/pages/login-page.html";
      }, 200);
      return;
    }
  } catch (error) {
    //problème reseau retourne à la page de connexion
    window.location.href = "/frontend/admin-side/pages/login-page.html";
  }
}

checkAuthOrRedirect();

//Lire l'id de l'URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get("id");

//Appeler L'API pour récupérer la commande
async function getOrder() {
  const response = await fetch(baseUrl + "/restaurant/dashboard-orders", {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();
  const order = data.find((i) => i._id === orderId);
  if (!order) return alert("Commande introuvable, veuillez la supprimer");
  //Construire l'URL client en fonction des infos
  const clientUrl = `${clientBaseUrl}?id=${order._id}&total=${order.totalAmount}`;
  //Générer le code qr
  new QRCode(document.getElementById("qrCode"), {
    text: clientUrl,
    width: 128,
    height: 128,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
}

getOrder();

document.getElementById("printCode").addEventListener("click", () => {
  window.print();
});