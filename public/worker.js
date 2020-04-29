importScripts("/socket.js");

var clients = [];
var socketClient = null;

self.addEventListener(
  "connect",
  function(event) {
    var client = event.ports[0];
    clients.push(client);
    client.addEventListener("message", function(event) {
      if (event.data.includes("start")) {
        var token = event.data[1];
        var url = event.data[2];
        if (socketClient === null) {
          socketClient = io(url, {
            query: { token }
          });
          client.postMessage(`Started connection to... ${url}`);
        } else {
          client.postMessage(`Reusing connection to... ${url}`);
        }
      }
      if (socketClient) {
        socketClient.on("everyone", function(msgObj) {
          client.postMessage(["new-chat", JSON.stringify(msgObj)]);
        });

        if (event.data.includes("new-message")) {
          var chatData = event.data;
          3;
          var newMessage = event.data.split(",")[1];
          socketClient.emit("new-message", newMessage);
        }
      }
    });
    client.start();
  },
  false
);