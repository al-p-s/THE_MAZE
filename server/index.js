const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createGameState } = require('./game/state');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  },
  pingTimeout: 5000,
  pingInterval: 2000
});

const lobby = [];
let gameState = null;

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  lobby.push(socket.id);

  // Для теста — стартуем когда 2 игрока
  if (lobby.length === 2) {
    gameState = createGameState(lobby, lobby.length);
    console.log('Game started!');
    console.log(JSON.stringify(gameState, null, 2));
  }

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    lobby.splice(lobby.indexOf(socket.id), 1);
  });
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
