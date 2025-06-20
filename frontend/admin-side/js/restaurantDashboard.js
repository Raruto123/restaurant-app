const baseUrl = window.APP_CONFIG.API_BASE_URL;
const restaurantId = window.APP_CONFIG.RESTAURANT_ID;

function decodeId(id) {
  if (id === restaurantId) return "Dashboard de Noom Hôtel";
}

document.getElementById("stat-button").addEventListener("click", () => {
  window.open("/frontend/admin-side/pages/statistics-page.html", "_blank");
});

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
  const paymentsLaunched = new Set();

  const container = document.getElementById("container");
  const sortSelect = document.getElementById("sort-select");
  const datePicker = document.getElementById("date-picker");
  const dateEndPicker = document.getElementById("date-end-picker");
  const showTodayBtn = document.getElementById("show-btn-today");
  //modal de création de commande
  const modal = document.getElementById("order-modal");
  const openModal = document.getElementById("create-order-btn");
  const closeModal = document.getElementById("close-modal");
  const itemsList = document.getElementById("items-list");
  //modal d'édition de commande
  const editModal = document.getElementById("order-edit-modal");
  const closeEditModal = document.getElementById("close-edit-modal");
  const itemsEditList = document.getElementById("items-edit-list");
  let editingOrderId = null;

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
  // Fonction pour faire du polling du statut de paiement d'une commande
  function retrievePaymentStatus(orderId, divStatut) {
    // Stoppe le polling si déjà payé (on garde la référence pour pouvoir clear si besoin)
    let interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${baseUrl}/restaurant/${orderId}/cinetpay/status`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (response.status === 404) {
          divStatut.textContent = "Supprimée 🗑️";
          divStatut.className = "row status-delete";
          clearInterval(interval);
          return//on arrête ici
        }
        const data = await response.json();
        // Si statut payé, met à jour l'affichage et arrête l'intervalle
        if (data.orderStatus === "paid" || data.cinetpayStatus === "ACCEPTED") {
          divStatut.textContent = "Payé ✅";
          divStatut.className = "row status-paid";
          clearInterval(interval);
          // Tu peux aussi rafraîchir la liste des commandes ici si tu veux
          // await fetchOrders(sortSelect.value, datePicker.value, dateEndPicker.value);
        } else if (
          data.orderStatus === "failed" ||
          data.cinetpayStatus === "REFUSED"
        ) {
          divStatut.textContent = "Échec 🚫";
          divStatut.className = "row status-unpaid";
          clearInterval(interval);
        }
      } catch (err) {
        console.log("Erreur dans le polling paiement :", err);
      }
    }, 5000);
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

    // Efface les anciennes lignes (on garde les 8 premières = headers)
    while (container.children.length > 8)
      container.removeChild(container.lastChild);

    //ajouter les commandes
    for (const order of filtered) {
      //Modifier
      const divModify = document.createElement("div");
      divModify.className = "row";
      divModify.title = "Modifier la commande";
      const btnModify = document.createElement("button");
      btnModify.className = "btn-modify";
      btnModify.textContent = "✏️";
      btnModify.onclick = () => {
        editingOrderId = order._id;
        console.log(editingOrderId);
        editModal.style.display = "flex";
        document.getElementById("table-edit-number").value = order.tableNumber;
        itemsEditList.innerHTML = "";
        order.items.forEach((item) => {
          const itemRow = document.createElement("div");
          itemRow.className = "item-row";
          itemRow.innerHTML = `
      <input type="text" placeholder="Nom du produit" class="item-name" required value="${item.name}">
      <input type="number" placeholder="Quantité" min="1" class="item-qty" required value="${item.qty}">
      <input type="number" placeholder="Prix (FCFA)" min="0" class="item-price" required value="${item.price}">
      <button type="button" class="remove-item">Suppr</button>
    `;
          itemRow
            .querySelector(".remove-item")
            .addEventListener("click", () => itemRow.remove());
          itemsEditList.appendChild(itemRow);
        });
      };
      divModify.appendChild(btnModify);
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
          `/frontend/admin-side/pages/print-qrcode.html?id=${order._id}`,
          "_blank"
        );
      };
      divQR.appendChild(btnQR);

      //Paiement
      const divPay = document.createElement("div");
      divPay.className = "row";
      const btnPay = document.createElement("button");
      if (order.status === "paid") {
        divStatut.textContent = "Payé ✅";
        divStatut.className = "row status-paid";
        btnPay.textContent = "Commande Terminée";
        btnPay.disabled = true;
        btnModify.disabled = true;
        btnModify.textContent = "❌";
      } else if (order.status === "failed") {
        divStatut.textContent = "Échec 🚫";
        divStatut.className = "row status-unpaid";
        btnPay.textContent = "Commande Terminée";
        btnPay.disabled = true;
        btnModify.disabled = true;
        btnModify.textContent = "❌";
      } else {
        divStatut.textContent = "En attente ⌛️";
        divStatut.className = "row status-unpaid";
        btnPay.textContent = "Lancer le paiement";
        // S'assurer que la clé est unique par commande

        const paymentKey = "pay-" + order._id;
        // Si le paiement est déjà lancé (front)
        if (order.payment_url !== null || paymentsLaunched.has(paymentKey)) {
          btnPay.textContent = "Paiement lancé";
          btnPay.disabled = true;
          btnModify.disabled = true;
          btnModify.textContent = "❌";
        } else {
          btnPay.textContent = "Lancer le paiement";
        }
        btnPay.onclick = async () => {
          // Empêche le relancement si déjà lancé
          if (order.payment_url) {
            alert("Paiement déjà lancé. Le client peut maintenant payer.");
            return;
          }
          // Lancer la requête POST
          try {
            btnPay.disabled = true;
            btnPay.textContent = "Lancement...";
            btnModify.disabled = true;
            btnModify.textContent = "❌";
            const response = await fetch(
              `${baseUrl}/restaurant/${order._id}/cinetpay/pay`,
              {
                credentials: "include",
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            const data = await response.json();

            if (response.ok && data.payment_url) {
              console.log(data);
              btnPay.textContent = "Paiement lancé";
              paymentsLaunched.add(paymentKey);
              // Tu peux stocker data.payment_url si tu veux l’afficher quelque part
              alert(
                "Le paiement a bien été lancé ! Le client peut maintenant payer."
              );
              // Rafraîchir toute la liste pour MAJ boutons et état de la commande

              await fetchOrders(
                sortSelect.value,
                datePicker.value,
                dateEndPicker.value
              );
            } else {
              btnPay.textContent = "Lancer le paiement";
              btnPay.disabled = false;
              alert(data.error || "Erreur lors du lancement du paiement");
            }
          } catch (err) {
            btnPay.textContent = "Lancer le paiement";
            btnPay.disabled = false;
            alert(err || "Erreur réseau !");
          }
        };
        retrievePaymentStatus(order._id, divStatut);
      }
      divPay.appendChild(btnPay);

      //Supprimer
      const divDelete = document.createElement("div");
      divDelete.className = "row";
      divDelete.title = "Supprimer la commande";
      const btnDelete = document.createElement("button");
      btnDelete.className = "btn-delete";
      btnDelete.textContent = "🚮";
      btnDelete.onclick = async () => {
        try {
          const response = await fetch(
            `${baseUrl}/restaurant/${order._id}/delete`,
            {
              credentials: "include",
              method: "DELETE",
            }
          );

          const data = await response.json();
          if (response.ok) {
            alert(`${data.message}`);
            //raffraîchir la liste
            await fetchOrders(
              sortSelect.value,
              datePicker.value,
              dateEndPicker.value
            );
          } else {
            alert(data.error || "Erreur lors de la suppression");
          }
        } catch (err) {
          alert("Erreur réseau");
          console.log(err);
        }
      };
      divDelete.appendChild(btnDelete);

      container.appendChild(divModify);
      container.appendChild(divTable);
      container.appendChild(divOrder);
      container.appendChild(divTotal);
      container.appendChild(divStatut);
      container.appendChild(divQR);
      container.appendChild(divPay);
      container.appendChild(divDelete);
    }
  }
  //Initialisation
  fetchOrders();

  //Tri dynamique
  sortSelect.addEventListener("change", (e) => {
    fetchOrders(e.target.value, datePicker.value, dateEndPicker.value);
  });

  datePicker.addEventListener("change", (e) => {
    fetchOrders(sortSelect.value, datePicker.value, dateEndPicker.value);
  });
  dateEndPicker.addEventListener("change", () => {
    fetchOrders(sortSelect.value, datePicker.value, dateEndPicker.value);
  });

  showTodayBtn.addEventListener("click", () => {
    datePicker.value = "";
    dateEndPicker.value = "";
    fetchOrders(sortSelect.value, "", ""); // affiche seulement aujourd'hui
  });

  //LOGIQUE POUR LA MODAL DE CRÉATION DE COMMANDE
  openModal.onclick = () => {
    modal.style.display = "flex";
    document.getElementById("table-number").value = "";
    // itemsList.innerHTML=""
  };
  closeModal.onclick = () => {
    modal.style.display = "none";
  };
  //appuyer n'importe où ferme la fenêtre
  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  document.getElementById("add-item").onclick = () => {
    const itemRow = document.createElement("div");
    itemRow.className = "item-row";
    itemRow.innerHTML = `
    <input type="text" placeholder="Nom du produit" class="item-name" required>
    <input type="number" placeholder="Quantité" min="1" class="item-qty" required>
    <input type="number" placeholder="Prix (FCFA)" min="0" class="item-price" required>
    <button type="button" class="remove-item">Suppr</button>
  `;
    itemRow
      .querySelector(".remove-item")
      .addEventListener("click", () => itemRow.remove());
    itemsList.appendChild(itemRow);
  };
  //Créer la commande
  document
    .getElementById("submit-button")
    .addEventListener("click", async () => {
      //Récupère table et items
      const table = document.getElementById("table-number").value;
      const itemNodes = itemsList.querySelectorAll(".item-row");
      const items = [...itemNodes].map((row) => ({
        name: row.querySelector(".item-name").value,
        price: Number(row.querySelector(".item-price").value),
        qty: Number(row.querySelector(".item-qty").value),
      }));
      console.log(items);
      //Appeler l'API
      try {
        if (
          !table ||
          items.length === 0 ||
          items.some((i) => !i.name || !i.price || !i.qty)
        ) {
          alert("Tous les champs sont obligatoires");
          return;
        }
        const response = await fetch(baseUrl + "/restaurant/create-order", {
          credentials: "include",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, table }),
        });

        const data = await response.json();
        console.log(data);
        if (response.ok) {
          modal.style.display = "none";
          await fetchOrders(sortSelect.value, "", "");
        } else {
          alert(data.error || "Erreur lors de la création");
        }
      } catch (err) {
        alert("Erreur réseau");
        console.log(err);
      }
    });

  //LOGIQUE POUR LA MODAL DE MODIFICATION DE COMMANDE
  closeEditModal.onclick = () => {
    editModal.style.display = "none";
    editingOrderId = null;
    console.log(editingOrderId);
  };
  //appuyer n'importe où ferme la fenêtre
  window.onclick = (event) => {
    if (event.target == editModal) {
      editModal.style.display = "none";
      editingOrderId = null;
      console.log(editingOrderId);
    }
  };

  document.getElementById("add-edit-item").addEventListener("click", () => {
    const itemRow = document.createElement("div");
    itemRow.className = "item-row";
    itemRow.innerHTML = `
    <input type="text" placeholder="Nom du produit" class="item-name" required>
    <input type="number" placeholder="Quantité" min="1" class="item-qty" required>
    <input type="number" placeholder="Prix (FCFA)" min="0" class="item-price" required>
    <button type="button" class="remove-item">Suppr</button>
  `;
    itemRow
      .querySelector(".remove-item")
      .addEventListener("click", () => itemRow.remove());
    itemsEditList.appendChild(itemRow);
  });

  document
    .getElementById("submit-edit-item")
    .addEventListener("click", async () => {
      const table = document.getElementById("table-edit-number").value;
      const itemNodes = itemsEditList.querySelectorAll(".item-row");
      const items = [...itemNodes].map((row) => ({
        name: row.querySelector(".item-name").value,
        price: Number(row.querySelector(".item-price").value),
        qty: Number(row.querySelector(".item-qty").value),
      }));
      // Ici tu peux faire la vérification front "required" si tu veux :
      if (
        !table ||
        items.length === 0 ||
        items.some((i) => !i.name || !i.price || !i.qty)
      ) {
        alert("Tous les champs sont obligatoires !");
        return;
      }

      try {
        const response = await fetch(
          `${baseUrl}/restaurant/${editingOrderId}/modify`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items, table }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          console.log(data.order.items);
          if (
            table == data.order.tableNumber &&
            items.name == data.order.items.name &&
            items.price == data.order.items.price &&
            items.qty == data.order.items.qty
          ) {
            console.log("same shit");
            editModal.style.display = "none";
            await fetchOrders(
              sortSelect.value,
              datePicker.value,
              dateEndPicker.value
            );
          } else {
            alert(data.message);
            editModal.style.display = "none";
            await fetchOrders(
              sortSelect.value,
              datePicker.value,
              dateEndPicker.value
            );
          }
        } else {
          alert(data.error || "Erreur lors de la modification d'une commande");
        }
      } catch (error) {
        alert("Erreur réseau");
        console.log(error);
      }
    });
});
