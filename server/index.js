const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { setupLobby } = require('./network/lobbyHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 5000,
  pingInterval: 2000,
});

setupLobby(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
