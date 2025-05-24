const baseUrl = window.APP_CONFIG.API_BASE_URL;

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
    // else {
    //   alert(`Bienvenue dans votre dashboard\ ${data.id}`);
    // }
  } catch (error) {
    //problème reseau retourne à la page de connexion
    window.location.href = "/frontend/admin-side/pages/login-page.html";
  }
}

checkAuthOrRedirect();

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("container");
  const sortSelect = document.getElementById("sort-select");

  async function fetchOrders(sort = "oldest") {
    //récupérer les commandes
    const response = await fetch(baseUrl + "/restaurant/dashboard-orders", {
      method: "GET",
      credentials: "include",
    });
    const orders = await response.json();

    console.log(orders);

    //Trier par date
    orders.sort((a, b) => {
      if (sort === "latest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });
    // Efface les anciennes lignes (on garde les 4 premières = headers)
    while (container.children.length > 4)
      container.removeChild(container.lastChild);

    //ajouter les commandes
    for (const order of orders) {
      //Table
      const divTable = document.createElement("div");
      divTable.className = "row";
      divTable.textContent = order.tableNumber;
      //Commande
      const divOrder = document.createElement("div");
      divOrder.className = "row";
      divOrder.textContent = order.items.map((item) => `${item.name} x ${item.qty}`).join(", ");

      console.log(divTable.textContent)

      //Statut
      const divStatut = document.createElement("div");
      divStatut.className =
        "row" + (order.status === "paid" ? "status-paid" : "status-unpaid");
      divStatut.textContent =
        order.status === "paid" ? "Payé ✅" : "Non payé ❌";
      //Total
      const divTotal = document.createElement("div");
      divTotal.className = "row";
      divTotal.textContent = order.totalAmount + " FCFA";

      container.appendChild(divTable);
      container.appendChild(divOrder);
      container.appendChild(divTotal);
      container.appendChild(divStatut);
    }
  }
  //Initialisation
  fetchOrders();

  //Tri dynamique
  sortSelect.addEventListener("change", (e) => {
    fetchOrders(e.target.value);
  });

  document.getElementById("create-order-btn").addEventListener("click", () => {
    alert("crée la commande belelou");
  });
});
