const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const {
  createGameState, nextTurn,
  getPlayerView,
} = require('./game/state');

const fs = require('fs');
const path = require('path');
const { actionLoot } = require('./game/actions');

function logGlobal(ev, gameState) {
  const getName = (id) => {
    const p = gameState?.players.find(p => p.id === id);
    return p ? `[P${p.index}]` : `[${id?.slice(0,4) ?? '?'}]`;
  };
  const DIR = { top: '↑', right: '→', bottom: '↓', left: '←' };
  const time = new Date().toISOString().slice(11,19);
  let line = null;

  switch (ev.event) {
    case 'moved': line = `${getName(ev.playerId)} moved ${DIR[ev.direction] ?? ''}`; break;
    case 'move_blocked': line = `${getName(ev.playerId)} hit wall ${DIR[ev.direction] ?? ''}`; break;
    case 'attack': line = `${getName(ev.playerId)} → ${getName(ev.targetId)}: ${ev.hit ? `${ev.damage} dmg${ev.debuff ? ` [${ev.debuff}]` : ''}${ev.died ? ' KILLED' : ''}` : 'miss'}`; break;
    case 'melee': line = `${getName(ev.playerId)} melee → ${getName(ev.targetId)}: ${ev.hit ? `${ev.damage} dmg${ev.died ? ' KILLED' : ''}` : 'miss'}`; break;
    case 'mine_triggered': line = `${getName(ev.playerId)} hit mine (owner: ${getName(ev.mineOwner)})${ev.died ? ' KILLED' : ''}`; break;
    case 'bomb_used': line = `${getName(ev.playerId)} bomb: ${ev.mode === 'wall' ? `wall blown ${DIR[ev.direction] ?? ''}` : 'mine planted'}`; break;
    case 'arsenal_used': line = `${getName(ev.playerId)} arsenal: ${ev.reward}`; break;
    case 'hospital_used': line = `${getName(ev.playerId)} hospital: ${ev.choice}`; break;
    case 'treasure': line = `${getName(ev.playerId)} treasure: ${ev.action}`; break;
    case 'exit_found': line = `${getName(ev.playerId)} found exit`; break;
    case 'player_disconnected': line = `${getName(ev.playerId)} disconnected`; break;
    default: line = `${getName(ev.playerId)} ${ev.event}`;
  }

  if (line) fs.appendFileSync(path.join(__dirname, 'game.log'), `[${time}] ${line}\n`);
}

const {
  actionMove, actionCheckWall,
  actionAttack, actionUseHospital,
  actionUseArsenal, actionTreasure,
  actionUseBomb, actionCheckCell,
  actionUseMedkit, actionMelee,
} = require('./game/actions');

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

function emitEvent(ev) {
  io.emit('game:event', ev);
  logGlobal(ev, gameState);
}

function broadcastViews() {
  for (const p of gameState.players)
    io.to(p.id).emit('game:state', getPlayerView(gameState, p.id));
}

function isCurrentPlayer(socketId) {
  if (!gameState || gameState.status !== 'active') return false;
  return gameState.players[gameState.currentTurn]?.id === socketId;
}

function advanceTurn() {
  nextTurn(gameState);
  const p = gameState.players[gameState.currentTurn];
  io.emit('game:turn', { playerId: p.id, playerIndex: p.index });
  broadcastViews();
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  lobby.push(socket.id);

  // Для теста — стартуем когда 2 игрока
  if (lobby.length === 3) {
    gameState = createGameState(lobby, lobby.length);
    console.log('Game started!');
    broadcastViews();
    const first = gameState.players[gameState.currentTurn];
    io.emit('game:turn', { playerId: first.id, playerIndex: first.index });
  }

  socket.on('action:move', ({ direction } = {}) => {
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionMove(gameState, socket.id, direction);
    if (!result.ok) return;
    if (result.mine) {
      emitEvent({ event: 'mine_triggered', playerId: socket.id, mineOwner: result.mineOwner, died: result.died, victims: result.victims });
      if (result.died) {
        const alive = gameState.players.filter(p => p.isAlive);
        if (alive.length === 1) {
          gameState.status = 'finished';
          io.emit('game:over', { winner: alive[0].id, reason: 'last_alive' });
          return;
        }
      }
      advanceTurn();
      return;
    }
    if (result.exit && result.won) {
      io.emit('game:over', { winner: socket.id, reason: 'exit' });
      return;
    }
    if (result.exitFound) {
      socket.emit('game:event', { event: 'exit_found', playerId: socket.id, direction });
    } else if (!result.alreadyKnown) {
      emitEvent({ event: result.blocked ? 'move_blocked' : 'moved', playerId: socket.id, direction, isEdge: result.isEdge ?? false });
    }
    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:check_cell', ({ direction } = {}) => {
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionCheckCell(gameState, socket.id, direction);
    if (!result.ok) return;
    socket.emit('game:event', { event: 'cell_checked', playerId: socket.id, direction, content: result.content });
    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:check_wall', ({ direction } = {}) => {
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionCheckWall(gameState, socket.id, direction);
    if (!result.ok) return;
    if (!result.alreadyKnown) {
      socket.emit('game:event', { event: result.isExit ? 'exit_found' : 'wall_checked', playerId: socket.id, direction, isEdge: result.isEdge, hasWall: result.hasWall });
    }
    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:use_medkit', () => {
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionUseMedkit(gameState, socket.id);
    if (!result.ok) return;
    emitEvent({ event: 'medkit_used', playerId: socket.id });
    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:use_hospital', ({ choice } = {}) => {
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionUseHospital(gameState, socket.id, choice);
    if (!result.ok) return;
    emitEvent({ event: 'hospital_used', playerId: socket.id, choice: result.choice });
    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:use_arsenal', () => {
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionUseArsenal(gameState, socket.id);
    if (!result.ok) return;
    emitEvent({ event: 'arsenal_used', playerId: socket.id, reward: result.reward });
    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:treasure', ({ action } = {}) => {
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionTreasure(gameState, socket.id, action);
    if (!result.ok) return;
    emitEvent({ event: 'treasure', playerId: socket.id, action: result.action });
    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:use_bomb', ({ mode, direction } = {}) => {
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionUseBomb(gameState, socket.id, mode, direction);
    if (!result.ok) return;
    emitEvent({ event: 'bomb_used', playerId: socket.id, mode: result.mode, direction: result.direction ?? null });
    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:end_turn', () => {
    if (!isCurrentPlayer(socket.id)) return;
    advanceTurn();
  });

  socket.on('action:attack', ({ direction, targetId } = {}) => {
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionAttack(gameState, socket.id, direction, targetId);
    if (!result.ok) return;

    emitEvent({
      event: 'attack',
      playerId: socket.id,
      direction,
      hit: result.hit,
      roll: result.roll,
      damage: result.damage,
      debuff: result.debuff,
      debuffTurns: result.debuffTurns ?? null,
      targetId: result.targetId ?? null,
      died: result.died ?? false,
    });

    if (result.died) {
      const alive = gameState.players.filter(p => p.isAlive);
      if (alive.length === 1) {
        gameState.status = 'finished';
        io.emit('game:over', { winner: alive[0].id, reason: 'last_alive' });
        return;
      }
    }

    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:melee', ({ targetId } = {}) => {
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionMelee(gameState, socket.id, targetId);
    if (!result.ok) return;
    emitEvent({ event: 'melee', playerId: socket.id, hit: result.hit, roll: result.roll,
      damage: result.damage ?? 0, targetId: result.targetId ?? null, died: result.died ?? false });
    if (result.died) {
      const alive = gameState.players.filter(p => p.isAlive);
      if (alive.length === 1) {
        gameState.status = 'finished';
        io.emit('game:over', { winner: alive[0].id, reason: 'last_alive' });
        return;
      }
    }
    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:loot', ({ targetId } = {}) => {
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionLoot(gameState, socket.id, targetId);
    if (!result.ok) return;
    emitEvent({ event: 'loot', playerId: socket.id, targetId, loot: result.loot });
    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    lobby.splice(lobby.indexOf(socket.id), 1);
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

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
