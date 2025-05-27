const baseUrl = window.APP_CONFIG.API_BASE_URL;
const restaurantId = window.APP_CONFIG.RESTAURANT_ID;

function decodeId(id) {
  if (id === restaurantId) return "Dashboard de Noom Hôtel";
}

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
    } else {
      const restaurantName = document.getElementById("restaurant-name");
      restaurantName.textContent = decodeId(data.id);
    }
  } catch (error) {
    //problème reseau retourne à la page de connexion
    window.location.href = "/frontend/admin-side/pages/login-page.html";
  }
}

checkAuthOrRedirect();

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("container");
  const sortSelect = document.getElementById("sort-select");
  const datePicker = document.getElementById("date-picker");
  const dateEndPicker = document.getElementById("date-end-picker");
  const showTodayBtn = document.getElementById("show-btn-today");

  //fonction utilitaire pour formater le temps yyyy-mm-dd
  function toShortDate(date) {
    return date.toISOString().split("T")[0]; //"2011-10-05"
  }

  //retourne true si la commande est dans l'intervalle (dateDebut incluse, dateFin incluse)
  function isOrderInRange(order, dateDebut, dateFin) {
    const created = toShortDate(new Date(order.createdAt)); //une nouvelle date formatée est crée
    //tu verifies si elle est dans l'intervalle
    return (
      (!dateDebut || created >= dateDebut) && (!dateFin || created <= dateFin)
    );
  }

  async function fetchOrders(sort = "oldest", dateStart, dateEnd) {
    //récupérer les commandes
    const response = await fetch(baseUrl + "/restaurant/dashboard-orders", {
      method: "GET",
      credentials: "include",
    });
    const orders = await response.json();

    console.log(orders);

    //Filtrer par date
    let filtered = orders;
    if (dateStart || dateStart) {
      filtered = orders.filter((order) =>
        isOrderInRange(order, dateStart, dateEnd)
      );
    } else {
      // Par défaut : seulement les dates d'aujourd'hui
      const today = toShortDate(new Date());
      filtered = orders.filter(
        (order) => toShortDate(new Date(order.createdAt)) === today
      );
    }

    // Trie par date
    filtered.sort((a, b) => {
      if (sort === "latest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });

    // Efface les anciennes lignes (on garde les 4 premières = headers)
    while (container.children.length > 6)
      container.removeChild(container.lastChild);

    //ajouter les commandes
    for (const order of filtered) {
      //Table
      const divTable = document.createElement("div");
      divTable.className = "row";
      divTable.textContent = order.tableNumber;
      //Commande
      const divOrder = document.createElement("div");
      divOrder.className = "row";
      divOrder.textContent = order.items
        .map((item) => `${item.name} x ${item.qty}`)
        .join(", ");

      //Statut
      const divStatut = document.createElement("div");
      divStatut.className =
        "row" + (order.status === "paid" ? "status-paid" : "status-unpaid");
      divStatut.textContent =
        order.status === "paid" ? "Payé ✅" : "En attente ⌛️";
      //Total
      const divTotal = document.createElement("div");
      divTotal.className = "row";
      divTotal.textContent = order.totalAmount + " FCFA";
      //QrCode
      const divQR = document.createElement("div");
      divQR.className = "row";
      divQR.title = "QR Code";
      const btnQR = document.createElement("button");
      btnQR.textContent = "Voir QR Code";
      btnQR.onclick = () => {
        window.open(
          `/frontend/admin-side/pages/generate-qrcode.html?id=${order._id}`,
          "_blank"
        );
      };
      divQR.appendChild(btnQR);

      //Paiement
      const divPay = document.createElement("div");
      divPay.className = "row";
      const btnPay = document.createElement("button");
      btnPay.textContent = "Lancer le paiement";
      btnPay.onclick = () => {
        alert("initialisation de paiement pas encore implémenter");
      };
      divPay.appendChild(btnPay);

      container.appendChild(divTable);
      container.appendChild(divOrder);
      container.appendChild(divTotal);
      container.appendChild(divStatut);
      container.appendChild(divQR);
      container.appendChild(divPay);
    }
  }
  //Initialisation
  fetchOrders();

  //Tri dynamique
  sortSelect.addEventListener("change", (e) => {
    fetchOrders(e.target.value, datePicker.value, dateEndPicker.value);
  });

  datePicker.addEventListener("change", (e) => {
    fetchOrders(e.target.value, datePicker.value, dateEndPicker.value);
  });
  dateEndPicker.addEventListener("change", () => {
    fetchOrders(sortSelect.value, datePicker.value, dateEndPicker.value);
  });

  showTodayBtn.addEventListener("click", () => {
    datePicker.value = "";
    dateEndPicker.value = "";
    fetchOrders(sortSelect.value, "", ""); // affiche seulement aujourd'hui
  });

  document.getElementById("create-order-btn").addEventListener("click", () => {
    alert("crée la commande belelou");
  });
});
