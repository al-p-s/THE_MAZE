const {
  actionMove, actionCheckWall,
  actionAttack, actionUseHospital,
  actionUseArsenal, actionTreasure,
  actionUseBomb, actionCheckCell,
  actionUseMedkit, actionMelee,
  actionLoot,
} = require('../game/actions');

function registerGameHandlers(io, socket, context) {
  const {
    getGameState,
    emitEvent,
    broadcastViews,
    isCurrentPlayer,
    advanceTurn,
  } = context;

  socket.on('action:move', ({ direction } = {}) => {
    const gameState = getGameState();
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionMove(gameState, socket.id, direction);
    if (!result.ok) return;

    if (result.mine) {
      emitEvent({
        event: 'mine_triggered',
        playerId: socket.id,
        mineOwner: result.mineOwner,
        died: result.died,
        victims: result.victims,
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
      return;
    }

    if (result.exit && result.won) {
      io.emit('game:over', { winner: socket.id, reason: 'exit' });
      return;
    }

    if (result.exitFound) {
      socket.emit('game:event', { event: 'exit_found', playerId: socket.id, direction });
    } else if (!result.alreadyKnown) {
      emitEvent({
        event: result.blocked ? 'move_blocked' : 'moved',
        playerId: socket.id,
        direction,
        isEdge: result.isEdge ?? false,
      });
    }

    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:check_cell', ({ direction } = {}) => {
    const gameState = getGameState();
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionCheckCell(gameState, socket.id, direction);
    if (!result.ok) return;

    socket.emit('game:event', {
      event: 'cell_checked',
      playerId: socket.id,
      direction,
      content: result.content,
    });

    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:check_wall', ({ direction } = {}) => {
    const gameState = getGameState();
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionCheckWall(gameState, socket.id, direction);
    if (!result.ok) return;

    if (!result.alreadyKnown) {
      socket.emit('game:event', {
        event: result.isExit ? 'exit_found' : 'wall_checked',
        playerId: socket.id,
        direction,
        isEdge: result.isEdge,
        hasWall: result.hasWall,
      });
    }

    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:use_medkit', () => {
    const gameState = getGameState();
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionUseMedkit(gameState, socket.id);
    if (!result.ok) return;

    emitEvent({ event: 'medkit_used', playerId: socket.id });

    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:use_hospital', ({ choice } = {}) => {
    const gameState = getGameState();
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionUseHospital(gameState, socket.id, choice);
    if (!result.ok) return;

    emitEvent({ event: 'hospital_used', playerId: socket.id, choice: result.choice });

    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:use_arsenal', () => {
    const gameState = getGameState();
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionUseArsenal(gameState, socket.id);
    if (!result.ok) return;

    emitEvent({ event: 'arsenal_used', playerId: socket.id, reward: result.reward });

    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:treasure', ({ action } = {}) => {
    const gameState = getGameState();
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionTreasure(gameState, socket.id, action);
    if (!result.ok) return;

    emitEvent({ event: 'treasure', playerId: socket.id, action: result.action });

    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:use_bomb', ({ mode, direction } = {}) => {
    const gameState = getGameState();
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionUseBomb(gameState, socket.id, mode, direction);
    if (!result.ok) return;

    emitEvent({
      event: 'bomb_used',
      playerId: socket.id,
      mode: result.mode,
      direction: result.direction ?? null,
    });

    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });

  socket.on('action:end_turn', () => {
    if (!isCurrentPlayer(socket.id)) return;
    advanceTurn();
  });

  socket.on('action:attack', ({ direction, targetId } = {}) => {
    const gameState = getGameState();
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
    const gameState = getGameState();
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionMelee(gameState, socket.id, targetId);
    if (!result.ok) return;

    emitEvent({
      event: 'melee',
      playerId: socket.id,
      hit: result.hit,
      roll: result.roll,
      damage: result.damage ?? 0,
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

  socket.on('action:loot', ({ targetId } = {}) => {
    const gameState = getGameState();
    if (!isCurrentPlayer(socket.id)) return;
    const result = actionLoot(gameState, socket.id, targetId);
    if (!result.ok) return;

    emitEvent({ event: 'loot', playerId: socket.id, targetId, loot: result.loot });

    const p = gameState.players.find(p => p.id === socket.id);
    if (p.actionPoints <= 0) advanceTurn();
    else broadcastViews();
  });
}

module.exports = { registerGameHandlers };

