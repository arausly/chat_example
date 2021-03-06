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
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            query: { token }
          });
          client.postMessage(`Started connection to... ${url}`);
        } else {
          client.postMessage(`Reusing connection to... ${url}`);
        }
      }

      if (socketClient) {
        var senderID;

        socketClient.on("everyone", function(msgObj) {
          if (msgObj.senderID !== senderID) {
            client.postMessage(["new-chat", JSON.stringify(msgObj)]);
            senderID = msg.senderID;
          }
        });

        socketClient.on("users", function(users) {
          client.postMessage(["all-users", JSON.stringify(users)]);
        });

        if (event.data.includes("new-message")) {
          var newMessage = event.data[1];
          socketClient.emit("new-message", newMessage);
        }
      }
    });
    client.start();
  },
  false
);
