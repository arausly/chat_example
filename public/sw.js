importScripts("/socket.io/socket.io.js");

self.addEventListener("message", async function(event) {
  var clients = await self.clients.matchAll({ includeUncontrolled: true });

  return Promise.all(
    clients.map(function(client) {
      var newChannel = new MessageChannel();
      return messageHandler(event, client, newChannel);
    })
  );
});

var socketClient = io(self.name);

workerInit("Hi, from worker").catch(console.error);

function messageHandler(event, client, newChannel) {
  if (event.data.start) {
    var token = event.data.token;
    var url = event.data.url;
    // if (socketClient === null) {
    //   socketClient = io(url, {
    //     query: { token }
    //   });
    //   return client.postMessage(`Started connection to... ${url}`, [
    //     newChannel.port2
    //   ]);
    // } else {
    //   return client.postMessage(`Reusing connection to... ${url}`, [
    //     newChannel.port2
    //   ]);
    // }
  }

  if (socketClient) {
    socketClient.on("everyone", function(msgObj) {
      return client.postMessage({ newChat: true, msgObj }, [newChannel.port2]);
    });

    if (event.data.newMessage) {
      var msg = event.data.msg;
      socketClient.emit("new-message", msg);
    }
  }
}

async function workerInit(msg) {
  var clients = await self.clients.matchAll({ includeUncontrolled: true });

  return Promise.all(
    clients.map(function(client) {
      var newChannel = new MessageChannel();
      //   newChannel.port2.onmessage = function(event) {
      //     console.log("loading from some where else");
      //   };
      return client.postMessage(msg, [newChannel.port2]);
    })
  );
}
