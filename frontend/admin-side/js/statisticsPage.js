//PROTÉGER LA PAGE
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
  } catch (error) {
    //problème reseau retourne à la page de connexion
    window.location.href = "/frontend/admin-side/pages/login-page.html";
  }
}

checkAuthOrRedirect();

const tabBtns = document.querySelectorAll(".tab");
const sections = document.querySelectorAll(".stats-section");

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    sections.forEach((section) => section.classList.remove("active"));
    document.getElementById(btn.dataset.tab + "-stats").classList.add("active");
  });
});

async function fetchOrdersStats(dateStart, dateEnd) {
  // Appel à l'API de tes commandes
  const response = await fetch(`${baseUrl}/restaurant/dashboard-orders`, {
    method: "GET",
    credentials: "include",
  });
  const orders = await response.json();
  // Filtrage par date
  let filtered = orders;
  if (dateStart) {
    filtered = filtered.filter(
      (order) => new Date(order.createdAt) >= new Date(dateStart)
    );
  }
  if (dateEnd) {
    filtered = filtered.filter(
      (order) => new Date(order.createdAt) <= new Date(dateEnd)
    );
  }

  // KPI principaux
  const totalOrders = filtered.length;
  //chiffre d'affaires en fr
  const totalSales = filtered.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  const avgTicket = totalOrders ? Math.round(totalSales / totalOrders) : 0;
  const paidCount = filtered.filter((order) => order.status === "paid").length;
  const unpaidCount = filtered.filter(
    (order) => order.status !== "paid"
  ).length;

  document.getElementById("total-orders").textContent = totalOrders;
  document.getElementById(
    "total-ca"
  ).textContent = `${totalSales.toLocaleString()} FCFA`;
  document.getElementById(
    "avg-ticket"
  ).textContent = `${avgTicket.toLocaleString()} FCFA`;
  document.getElementById(
    "paid-vs-unpaid"
  ).textContent = `${paidCount}/${unpaidCount}`;

  // Data pour graphique
  let labels = [],
    data = [];
  // Grouper par jour
  const grouped = {};
  filtered.forEach((order) => {
    const day = new Date(order.createdAt).toISOString().split("T")[0];
    grouped[day] = (grouped[day] || 0) + 1;
  });
  labels = Object.keys(grouped).sort();
  data = labels.map((date) => grouped[date]);

  drawOrdersChart(labels, data);

  // Pour export CSV
  window.ordersStatsExport = filtered;
}

// Courbe du nombre de commandes par jour
let chart;
function drawOrdersChart(labels, data) {
  const ctx = document.getElementById("orders-chart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Commandes par jour",
          data,
          borderColor: "#6372e9",
          backgroundColor: "#6372e933",
          tension: 0.2,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
      },
      scales: {
        x: { title: { display: true, text: "Date" } },
        y: {
          title: { display: true, text: "Nombre de commandes" },
          beginAtZero: true,
        },
      },
    },
  });
}

// Export CSV
document.getElementById("export-btn").addEventListener("click", () => {
  const rows = [["Date", "Numéro de table", "Total (FCFA)", "Statut"]];
  (window.ordersStatsExport || []).forEach((order) => {
    rows.push([
      new Date(order.createdAt).toLocaleDateString(),
      order.tableNumber,
      order.totalAmount,
      order.status,
    ]);
  });
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  saveAs(
    blob,
    `commandes_stats à la date du ${
      document.getElementById("date-start").value
    } au ${document.getElementById("date-end").value}`
  );
});

// Filtres par date
document.getElementById("filter-btn").addEventListener("click", () => {
  const date1 = document.getElementById("date-start").value;
  const date2 = document.getElementById("date-end").value;
  fetchOrdersStats(date1, date2);
});

// Initialisation
fetchOrdersStats();

////////////////SECTION PRODUITS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
async function fetchProductsStats(dateStart, dateEnd) {
  // Récupère toutes les commandes (on peut optimiser côté backend plus tard)
  const response = await fetch(`${baseUrl}/restaurant/dashboard-orders`, {
    method: "GET",
    credentials: "include",
  });

  const orders = await response.json();

  // Filtrage par date (commandes)
  let filteredOrders = orders;
  if (dateStart) {
    filteredOrders = filteredOrders.filter(
      (order) => new Date(order.createdAt) >= new Date(dateStart)
    );
  }
  if (dateEnd) {
    filteredOrders = filteredOrders.filter(
      (order) => new Date(order.createdAt) <= new Date(dateEnd)
    );
  }
  // Comptabilisation des produits
  const productsMap = {}; //{name : {qty, ca/sales} }
  let totalProductsSold = 0;
  let totalProductsSales = 0; //Sales = CA

  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (!item.name) return;
      if (!productsMap[item.name]) {
        productsMap[item.name] = { qty: 0, sales: 0 };
      }
      productsMap[item.name].qty += item.qty;
      productsMap[item.name].sales += item.qty * item.price;
      totalProductsSold += item.qty;
      totalProductsSales += item.price * item.qty;
    });
  });

  // Trouver le best-seller
  let topProduct = "-",
    topQty = 0;
  for (const [name, data] of Object.entries(productsMap)) {
    if (data.qty > topQty) {
      topProduct = name;
      topQty = data.qty;
    }
  }

  // Affichage KPI
  document.getElementById("top-product").textContent = topProduct;
  document.getElementById("total-products-sold").textContent =
    totalProductsSold;
  document.getElementById("products-total-ca").textContent =
    totalProductsSales.toLocaleString() + " FCFA";

  // Tableau des produits
  const tbody = document.querySelector("#products-table tbody");
  tbody.innerHTML = "";
  Object.entries(productsMap).sort((a, b) => b[1].qty - a[1].qty).forEach(([name, data]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${name}</td><td>${data.qty}</td><td>${data.sales.toLocaleString()} FCFA</td>`;
    tbody.appendChild(tr);
  })

  // Graphique en barres
  drawProductsBarChart(productsMap);

      // Graphique pie (répartition CA)
  drawProductsPieChart(productsMap);

      // Pour export CSV
  window.productsStatsExport = productsMap;
}

// Bar Chart des produits
let prodBarChart;
function drawProductsBarChart(productsMap) {
  const ctx = document.getElementById("products-bar-chart").getContext("2d");
  if (prodBarChart) prodBarChart.destroy();
  const labels = Object.keys(productsMap);
  const data = Object.values(productsMap).map(val => val.qty);
  prodBarChart = new Chart(ctx, {
    type : "bar",
    data : {
      labels,
      datasets : [{
        label : "Quantité vendue",
        data,
        backgroundColor : "#6372e9"
      }]
    },
    options : {
      responsive : true,
      plugins : {legend : {display : true}},
      scales : {
        x : {title : {display : true, text : "Produit"}},
        y : {title : {display : true, text : "Quantité vendue"}, beginAtZero : true}
      }
    }
  })
}

// Pie Chart CA produits
let prodPieChart;
function drawProductsPieChart(productsMap) {
  const ctx = document.getElementById("products-pie-chart").getContext("2d");
  if (prodPieChart) prodPieChart.destroy();
  const labels = Object.keys(productsMap);
  const data = Object.values(productsMap).map(val =>val.sales);
  prodPieChart = new Chart(ctx, {
    type : "pie",
    data : {
      labels,
      datasets : [{
        data,
        backgroundColor : labels.map((_, i) => `hsl(${i*360/labels.length}, 60%, 70%)`)
      }]
    },
    options : {
      plugins : {
        legend : {display : true, position : "bottom"}
      }
    }
  })
}

// Filtres et export
document.getElementById("prod-filter-btn").addEventListener("click", () => {
  const date1 = document.getElementById("prod-date-start").value;
  const date2 = document.getElementById("prod-date-end").value;
  fetchProductsStats(date1, date2);
});

document.getElementById("prod-export-btn").addEventListener("click", () => {
  const rows = [["Produit", "Quantité vendue", "CA généré"]];
  for (const [name, data] of Object.entries(window.productsStatsExport || {})) {
    rows.push([name, data.qty, data.sales])
  }
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], {type : "text/csv"});
  saveAs(blob, `statistiques sur les produits du ${document.getElementById("prod-date-start").value} au ${document.getElementById("prod-date-end").value}`)
})
// Initialisation auto si on arrive sur l’onglet
document.querySelector('[data-tab="products"]').addEventListener("click", () => {
  fetchProductsStats();
  console.log("yes")
})
