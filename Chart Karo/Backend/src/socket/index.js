const { Server } = require("socket.io");
const { socketAuth } = require("./socket.auth");
const { initializePresenceSocket } = require("./presence.socket");
const { initializeChatSocket } = require("./chat.socket");
const { initializeLocationSocket } = require("./location.socket");
const { clientOrigins, isAllowedOrigin } = require("../config/env");

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: clientOrigins,
      credentials: true,
    },
    // Blocks cross-site websocket hijacking; same-host requests are always fine.
    allowRequest: (req, callback) => {
      callback(null, isAllowedOrigin(req.headers.origin, req.headers.host));
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    initializePresenceSocket(io, socket);
    initializeChatSocket(io, socket);
    initializeLocationSocket(io, socket);
  });

  return io;
}

module.exports = { initializeSocket };
