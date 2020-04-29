/** worker script */
if (typeof window.SharedWorker === "undefined") {
  throw new Error("Your browser doesn't support shared workers");
}

var worker = new SharedWorker("worker.js");

worker.port.start();

worker.port.onmessage = function(event) {
  console.log("[WORKER_MSG]", event);
};

worker.onerror = function(err) {
  console.error(err.message);
  worker.port.close();
};

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
          localStorage.setItem("token", JSON.stringify(json.token));
          window.location.href = `${window.location.origin}`;
        }
      })
      .catch(err => {
        alert("failed to login");
      });
  });
}

/** socket Io */
var token;
token = localStorage.getItem("token");
if (token) {
  token = JSON.parse(token);
}

if (!window.location.href.includes("login")) {
  worker.port.postMessage(["start", token, window.location.origin]);
}
/** chat panel */

var sendChatBtn = document.getElementById("chat-btn");

var chatBox = document.getElementById("chat-messages");
/** if in the chat panel page */

if (chatBox) {
  worker.port.addEventListener("message", function(event) {
    if (event.data.includes("new-chat")) {
      var data = event.data;
      var newChat = data.split(",")[1];
      var msgObj = JSON.parse(newChat);

      var li = document.createElement("li");
      var from = document.createElement("p");
      var message = document.createElement("p");

      from.innerHTML = msgObj.email;
      message.innerHTML = msgObj.message;

      li.appendChild(from);
      li.appendChild(message);

      chatBox.appendChild(li);
    }
  });
}

if (sendChatBtn) {
  sendChatBtn.addEventListener("click", function(e) {
    e.preventDefault();
    var chatInput = document.getElementById("chat-input");
    var msg = chatInput.value;
    if (msg.length) {
      worker.port.postMessage(["new-message", msg]);
      chatInput.value = "";
    }
  });
}
