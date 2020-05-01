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
var content = document.querySelector("div.content");
var sendChatBtn = document.getElementById("chat-btn");
var chatBox = document.getElementById("chat-messages");
/** if in the chat panel page */

worker.port.addEventListener("message", function(event) {
  if (event.data.includes("new-chat")) {
    var data = event.data;
    var newChat = data[1];
    var msgObj = JSON.parse(newChat);

    var li = document.createElement("li");
    var from = document.createElement("p");
    var message = document.createElement("p");

    from.innerHTML = msgObj.email;
    message.innerHTML = msgObj.message;

    li.appendChild(from);
    li.appendChild(message);

    $(".content")
      .find("#chat-messages")
      .append(li);
  }
});

$(".content").on("click", "#chat-btn", function() {
  var chatInput = document.getElementById("chat-input");
  var msg = chatInput.value;
  if (msg.length) {
    worker.port.postMessage(["new-message", msg]);
    chatInput.value = "";
  }
});

// content.querySelector("#chat-btn").addEventListener("click", function(e) {

// });

var html = document.querySelector("html");

if (!window.location.href.includes("/login")) {
  var chatLink = document.getElementById("chat-link");
  var aboutLink = document.getElementById("about-link");
  var homeLink = document.getElementById("home-link");

  function formatHTML(text) {
    const contentBody = text.match(
      /\<\s*div\s*(class="content")\>.*\<script\ssrc="https:\/\/code/gm
    );
    const content = contentBody[0]
      .replace(`</div><script src="https://code`, "")
      .replace(`<div class="content">`, "");

    return content;
  }

  function renderChatHTML() {
    fetch("/chat", {
      method: "GET",
      headers: {
        "Content-Type": "text/html"
      }
    })
      .then(res => res.text())
      .then(text => {
        var chatContent = formatHTML(text);
        content.innerHTML = chatContent;
      })
      .catch(console.error);
  }

  function renderAboutHTML() {
    fetch("/about", {
      method: "GET",
      headers: {
        "Content-Type": "text/html"
      }
    })
      .then(res => res.text())
      .then(text => {
        var aboutContent = formatHTML(text);
        content.innerHTML = aboutContent;
      })
      .catch(console.error);
  }

  function renderHomeHTML() {
    fetch("/", {
      method: "GET",
      headers: {
        "Content-Type": "text/html"
      }
    })
      .then(res => res.text())
      .then(text => {
        var homeContent = formatHTML(text);
        content.innerHTML = homeContent;
      })
      .catch(console.error);
  }

  const applicationState = {
    home: true,
    about: false,
    chat: true
  };

  history.replaceState({ chat: false, about: false, home: true }, null, "");

  chatLink.addEventListener("click", function(e) {
    history.pushState({ chat: true, about: false, home: false }, null, "chat");
    renderChatHTML();
  });

  aboutLink.addEventListener("click", function(e) {
    history.pushState({ chat: false, about: true, home: false }, null, "about");
    renderAboutHTML();
  });

  homeLink.addEventListener("click", function(e) {
    history.pushState({ chat: false, about: false, home: true }, null, "");
    renderHomeHTML();
  });

  window.onpopstate = function(e) {
    if (e.state) {
      if (e.state.about) {
        history.replaceState(
          { chat: false, about: true, home: false },
          null,
          "about"
        );
        renderAboutHTML();
      } else if (e.state.chat) {
        history.replaceState(
          { chat: true, about: false, home: false },
          null,
          "chat"
        );
        renderChatHTML();
      } else {
        history.replaceState(
          { chat: false, about: false, home: true },
          null,
          ""
        );
        renderHomeHTML();
      }
    } else {
      history.replaceState({ chat: false, about: false, home: true }, null, "");
      renderHomeHTML();
    }
  };
}
