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
  saveAs(blob, `commandes_stats à la date du ${document.getElementById("date-start").value} au ${document.getElementById("date-end").value}`);
});

// Filtres par date
document.getElementById("filter-btn").addEventListener("click", () => {
  const date1 = document.getElementById("date-start").value;
  const date2 = document.getElementById("date-end").value;
  fetchOrdersStats(date1, date2);
});

// Initialisation
fetchOrdersStats();