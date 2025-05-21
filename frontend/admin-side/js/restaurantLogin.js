const togglePassword = document.getElementById("togglePassword");
const restaurantPassword = document.getElementById("passwordRestaurant");
const form = document.getElementById("signInForm");
const errorMessage = document.getElementById("errorMessage");

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

  const message = document.getElementById("emailRestaurant").value;
  const id = restaurantPassword.value;

  fetch("http://localhost:23000/api/restaurant/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => console.log(response))
    .catch((err) => console.error(err));
  //   try {
  //     const response = fetch("http://localhost:23000/api/restaurant/login", {
  //       method: "POST",
  //       credentials: "include",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: new FormData(),
  //     });

  //     const data = Object.keys(response);

  //     console.log(data);
  //   } catch (error) {
  //     errorMessage.textContent = "Erreur réseau ou serveur";
  //     console.log(error);
  //   }
  // try {
  //     const response = await fetch("http://localhost:23000/api/restaurant/login", {
  //         headers : {
  //             "Content-Type" : "application/json"
  //         },
  //         method : "POST",
  //         credentials : "include",
  //         body : JSON.stringify({email, password})//dans le req.body y'a email et password
  //     })

  //     const data = await response.json();

  //     if (response.ok) {
  //         window.location.href="https://www.google.com"
  //     } else {
  //         errorMessage.textContent = data.error || "Erreur de connexion"
  //     }

  // } catch (error) {
  //     errorMessage.textContent = "Erreur réseau ou serveur";
  //     console.log(error);
  // }
});
