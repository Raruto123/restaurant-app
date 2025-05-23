const togglePassword = document.getElementById("togglePassword");
const restaurantPassword = document.getElementById("passwordRestaurant");
const form = document.getElementById("signInForm");
const errorMessage = document.getElementById("errorMessage");
const baseUrl = window.APP_CONFIG.API_BASE_URL;


togglePassword.addEventListener("click", () => {
  //afficher ou masquer le mot de passe
  restaurantPassword.type =
    restaurantPassword.type === "password" ? "text" : "password";
  togglePassword.value = restaurantPassword.type === "password" ? "👁️" : "🙈";
});

//Se connecter
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.textContent = ""; //reset l'erreur

  const email = document.getElementById("emailRestaurant").value;
  const password = restaurantPassword.value;
  try {
      const response = await fetch(baseUrl + "/restaurant/login", {
          headers : {
              "Content-Type" : "application/json"
          },
          method : "POST",
          credentials : "include",
          body : JSON.stringify({email, password})//dans le req.body y'a email et password
      })
      // Vérifie le type de contenu AVANT de parser
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Ce n’est pas du JSON : logge la vraie réponse pour diagnostiquer
        const text = await response.text();
        console.error('Réponse inattendue (pas du JSON) :', text);
        errorMessage.textContent = "Réponse inattendue du serveur.";
        return;
      }
      const data = await response.json();

      if (response.ok) {
          alert(data.message + ". Redirection vers votre dashboard...");
          setTimeout(() =>{
            window.location.href="/frontend/admin-side/pages/dashboard.html"
          }, 300)
      } else {
          errorMessage.textContent = data.error || "Erreur de connexion"
      }

  } catch (error) {
      errorMessage.textContent = "Erreur réseau ou serveur";
      console.log(error);
  }
});
