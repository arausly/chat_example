var loginBtn = document.getElementsByClassName("login-btn")[0];

if (loginBtn) {
  loginBtn.addEventListener("click", function(e) {
    e.preventDefault();
    loginBtn.innerHTML = "submitting...";
    var formData = {
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    };

    fetch("/signIn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(json => {
        if (json) {
          loginBtn.innerHTML = "submit";
          localStorage.setItem("token", json.token);
          window.location.href = `${window.location.origin}`;
        }
      })
      .catch(err => {
        alert("failed to login");
      });
  });
}

/** socket Io */
var token = localStorage.getItem("token");
var client = io("http://localhost:3000", {
  query: { token }
});

client.on("msg", function(data) {
  console.log(data);
});
