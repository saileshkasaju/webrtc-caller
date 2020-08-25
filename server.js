const express = require("express");
const io = require("socket.io")({
  path: "/webrtc",
});

const app = express();
const port = 8080;
app.use(express.static(__dirname + "/dist"));

app.get("/", (req, res) => res.sendFile(__dirname + "/build/index.html"));

const server = app.listen(port, () => console.log("listening on port", port));

io.listen(server);

// https://www.tutorialspoint.com/socket.io/socket.io_namespaces.htm
const peers = io.of("/webrtcPeer");

// Keep a reference of all socket connections
let connectedPeers = new Map();

peers.on("connection", (socket) => {
  console.log(socket.id);
  socket.emit("connection-success", { success: socket.id });
  connectedPeers.set(socket.id, socket);

  socket.on("disconnect", () => {
    console.log("disconnected");
    connectedPeers.delete(socket.id);
  });

  socket.on("offerOrAnswer", (data) => {
    // send offerOrAnswer to other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // do not send offerOrAnswer to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload.type);
        socket.emit("offerOrAnswer", data.payload);
      }
    }
  });

  socket.on("candidate", (data) => {
    // send candidate to other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // do not send candidate to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload.type);
        socket.emit("candidate", data.payload);
      }
    }
  });
});
