const ordersList = document.getElementById("ordersList");
const form = document.getElementById("orderForm");

let orderIdCounter = 1;

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const client = document.getElementById("clientName").value;
  const table = document.getElementById("tableNumber").value;
  const details = document.getElementById("orderDetails").value;
  const total = document.getElementById("totalAmount").value;

  const orderId = `CMD-${Date.now()}`;
  const paymentUrl = `https://monapp.com/payer?id=${orderId}`;

  const orderEl = document.createElement("div");
  orderEl.className = "order";
  orderEl.innerHTML = `
    <strong>Commande #${orderIdCounter++}</strong><br/>
    👤 Client : ${client}<br/>
    🍽️ Table : ${table}<br/>
    📦 Détails : ${details}<br/>
    💵 Total : <strong>${total} FCFA</strong><br/>
    🔄 Statut : <span style="color:orange">En attente de paiement</span>
    <div class="qr-container"><canvas id="qr-${orderId}"></canvas></div>
    <p><small>À scanner par le client pour payer</small></p>
  `;

  ordersList.appendChild(orderEl);

  // Générer le QR code
  const qr = new QRious({
    element: document.getElementById(`qr-${orderId}`),
    value: paymentUrl,
    size: 150
  });

  // Reset form
  form.reset();
  window.print(orderEl);
});