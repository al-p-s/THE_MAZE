const { createGameState, nextTurn, getPlayerView } = require('../game/state');
const { logGlobal } = require('../utils/logger');
const { registerGameHandlers } = require('./gameHandler');

function setupLobby(io) {
  const lobby = [];
  let gameState = null;

  function emitEvent(ev) {
    io.emit('game:event', ev);
    logGlobal(ev, gameState);
  }

  function broadcastViews() {
    if (!gameState) return;
    for (const p of gameState.players) {
      io.to(p.id).emit('game:state', getPlayerView(gameState, p.id));
    }
  }

  function isCurrentPlayer(socketId) {
    if (!gameState || gameState.status !== 'active') return false;
    return gameState.players[gameState.currentTurn]?.id === socketId;
  }

  function advanceTurn() {
    if (!gameState) return;
    nextTurn(gameState);
    const p = gameState.players[gameState.currentTurn];
    io.emit('game:turn', { playerId: p.id, playerIndex: p.index });
    broadcastViews();
  }

  const context = {
    getGameState: () => gameState,
    emitEvent,
    broadcastViews,
    isCurrentPlayer,
    advanceTurn,
  };

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    lobby.push(socket.id);

    // Для теста — стартуем когда 2 игрока
    if (lobby.length === 2) {
      gameState = createGameState(lobby, lobby.length);
      console.log('Game started!');
      broadcastViews();
      const first = gameState.players[gameState.currentTurn];
      io.emit('game:turn', { playerId: first.id, playerIndex: first.index });
    }

    // Регистрируем обработчики игровых действий
    registerGameHandlers(io, socket, context);

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      const idx = lobby.indexOf(socket.id);
      if (idx !== -1) lobby.splice(idx, 1);

      if (gameState && gameState.status === 'active') {
        const player = gameState.players.find(p => p.id === socket.id);
        if (player) {
          player.isAlive = false;
          emitEvent({ event: 'player_disconnected', playerId: socket.id });
          const alive = gameState.players.filter(p => p.isAlive);
          if (alive.length === 1) {
            gameState.status = 'finished';
            io.emit('game:over', { winner: alive[0].id, reason: 'last_alive' });
            return;
          }
          if (isCurrentPlayer(socket.id)) advanceTurn();
        }
      }
    });
  });
}

module.exports = { setupLobby };

