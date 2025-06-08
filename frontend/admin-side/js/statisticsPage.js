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
        method:"GET",
        credentials:"include"
    });
const orders = await response.json();
    // Filtrage par date
let filtered = orders;
if (dateStart) {
    filtered = filtered.filter((order) => new Date(order.createdAt) >= new Date(dateStart));
}
if (dateEnd) {
    filtered = filtered.filter((order) => new Date(order.createdAt) <= new Date(dateEnd));
}
}