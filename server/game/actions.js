const { revealCell, revealWall, addDebuff, getCell, DIRS, OPPOSITE } = require('./state');
const { weaponResults } = require('./classes');

function actionMove(gameState, socketId, direction) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };
  if (!DIRS[direction]) return { ok: false };

  player.actionPoints -= 1;
  const cell = getCell(gameState.maze, player.x, player.y);

  if (cell.walls[direction]) {
    revealWall(player, player.x, player.y, direction);
    return { ok: true, blocked: true };
  }

  const { dx, dy } = DIRS[direction];
  revealWall(player, player.x, player.y, direction);
  player.x += dx;
  player.y += dy;
  const landedCell = getCell(gameState.maze, player.x, player.y);
  if (landedCell.content === 'mine' && landedCell.mineOwner !== socketId) {
    landedCell.content = null;
    const owner = landedCell.mineOwner;
    landedCell.mineOwner = null;
    player.health -= 1.5;
    if (player.hasTreasure) {
      player.hasTreasure = false;
      gameState.treasure.carriedBy = null;
      gameState.treasure.x = player.x;
      gameState.treasure.y = player.y;
      gameState.treasure.isBuried = false;
    }
    const died = player.health <= 0;
    if (died) player.isAlive = false;
    return { ok: true, blocked: false, mine: true, mineOwner: owner, died };
  }
  if (landedCell.type === 'exit') {
    if (player.hasTreasure) {
      gameState.status = 'finished';
      gameState.winner = socketId;
      return { ok: true, blocked: false, exit: true, won: true };
    }
    if (gameState.treasure.destroyed) {
      gameState.status = 'finished';
      gameState.winner = socketId;
      return { ok: true, blocked: false, exit: true, won: true };
    }
  }
  revealCell(player, player.x, player.y);
  revealWall(player, player.x, player.y, OPPOSITE[direction]);

  return { ok: true, blocked: false };
}

function actionCheckWall(gameState, socketId, direction) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };
  if (!DIRS[direction]) return { ok: false };

  player.actionPoints -= 1;
  const { dx, dy } = DIRS[direction];
  const nx = player.x + dx;
  const ny = player.y + dy;
  const isEdge = nx < 0 || ny < 0 || nx >= gameState.maze.width || ny >= gameState.maze.height;

  revealWall(player, player.x, player.y, direction);

  const cell = getCell(gameState.maze, player.x, player.y);
  const hasWall = cell.walls[direction];

  let isExit = false;
  if (isEdge && !hasWall) {
    const exitCell = gameState.maze.cells.flat().find(c => c.type === 'exit');
    isExit = exitCell?.x === player.x && exitCell?.y === player.y;
  }

  return { ok: true, isEdge, isExit };
}

function actionUseHospital(gameState, socketId, choice) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };

  const cell = getCell(gameState.maze, player.x, player.y);
  if (!cell || cell.type !== 'hospital') return { ok: false, reason: 'not_hospital' };

  player.actionPoints -= 1;
  cell.type = 'empty';

  if (choice === 'heal') {
    player.health = 3;
    return { ok: true, choice: 'heal' };
  }

  if (choice === 'medkit') {
    player.items.push('medkit');
    return { ok: true, choice: 'medkit' };
  }

  return { ok: false, reason: 'bad_choice' };
}

function actionUseArsenal(gameState, socketId) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };

  const cell = getCell(gameState.maze, player.x, player.y);
  if (!cell || cell.type !== 'arsenal') return { ok: false, reason: 'not_arsenal' };

  player.actionPoints -= 1;
  cell.type = 'empty';

  const roll = Math.random() < 0.5 ? 'ammo' : 'bombs';
  if (roll === 'ammo') player.ammo += 2;
  else player.bombs += 2;

  return { ok: true, reward: roll };
}

function actionTreasure(gameState, socketId, action) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };

  const t = gameState.treasure;
  if (t.destroyed) return { ok: false, reason: 'destroyed' };

  const onTreasureCell = player.x === t.x && player.y === t.y;

  // выкопать
  if (action === 'dig') {
    if (!onTreasureCell || !t.isBuried || t.carriedBy) return { ok: false, reason: 'cant_dig' };
    player.actionPoints -= 1;
    t.isBuried = false;
    return { ok: true, action: 'dig' };
  }

  // поднять
  if (action === 'pickup') {
    if (!onTreasureCell || t.isBuried || t.carriedBy) return { ok: false, reason: 'cant_pickup' };
    player.actionPoints -= 1;
    t.carriedBy = socketId;
    player.hasTreasure = true;
    return { ok: true, action: 'pickup' };
  }

  // закопать
  if (action === 'bury') {
    if (!player.hasTreasure) return { ok: false, reason: 'no_treasure' };
    player.actionPoints -= 1;
    player.hasTreasure = false;
    t.carriedBy = null;
    t.x = player.x;
    t.y = player.y;
    t.isBuried = true;
    return { ok: true, action: 'bury' };
  }

  return { ok: false, reason: 'bad_action' };
}

function actionUseBomb(gameState, socketId, mode, direction) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };
  if (player.bombs < 1) return { ok: false, reason: 'no_bombs' };

  if (mode === 'mine') {
    player.actionPoints -= 1;
    player.bombs -= 1;
    const cell = getCell(gameState.maze, player.x, player.y);
    cell.content = 'mine';
    cell.mineOwner = socketId;
    return { ok: true, mode: 'mine' };
  }

  if (mode === 'wall') {
    if (!DIRS[direction]) return { ok: false, reason: 'bad_direction' };
    const cell = getCell(gameState.maze, player.x, player.y);
    if (!cell.walls[direction]) return { ok: false, reason: 'no_wall' };
    const { dx, dy } = DIRS[direction];
    const nx = player.x + dx;
    const ny = player.y + dy;
    // внешние стены неуязвимы
    if (nx < 0 || ny < 0 || nx >= gameState.maze.width || ny >= gameState.maze.height)
      return { ok: false, reason: 'outer_wall' };
    player.actionPoints -= 1;
    player.bombs -= 1;
    cell.walls[direction] = false;
    getCell(gameState.maze, nx, ny).walls[OPPOSITE[direction]] = false;
    return { ok: true, mode: 'wall', direction };
  }

  return { ok: false, reason: 'bad_mode' };
}

function actionCheckCell(gameState, socketId, direction) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };
  if (!DIRS[direction]) return { ok: false };

  player.actionPoints -= 1;
  const { dx, dy } = DIRS[direction];
  const nx = player.x + dx;
  const ny = player.y + dy;
  const cell = getCell(gameState.maze, nx, ny);
  if (!cell) return { ok: true, content: null };

  return { ok: true, content: cell.content };
}

function actionUseMedkit(gameState, socketId) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };
  if (!player.items.includes('medkit')) return { ok: false, reason: 'no_medkit' };

  player.actionPoints -= 1;
  player.items.splice(player.items.indexOf('medkit'), 1);
  player.health = Math.min(player.health + 1, 3);
  return { ok: true };
}

function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function actionAttack(gameState, socketId, direction) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };
  if (!DIRS[direction]) return { ok: false };
  if (player.ammo < 1) return { ok: false, reason: 'no_ammo' };

  player.actionPoints -= 1;
  player.ammo -= 1;

  // Идём по прямой до стены или игрока
  const { dx, dy } = DIRS[direction];
  let x = player.x;
  let y = player.y;
  let target = null;

  while (true) {
    const cell = getCell(gameState.maze, x, y);
    if (!cell) break; // вышли за границу
    if (cell.walls[direction]) break; // стена на пути
    x += dx;
    y += dy;
    const hit = gameState.players.find(p => p.isAlive && p.x === x && p.y === y && p.id !== socketId);
    if (hit) { target = hit; break; }
  }

  if (!target) {
    return { ok: true, hit: false, roll: null };
  }

  const roll = rollDice();
  const { damage, debuff } = weaponResults[player.className](roll);

  target.health -= damage;
  if (target.hasTreasure) {
    target.hasTreasure = false;
    gameState.treasure.carriedBy = null;
    gameState.treasure.x = target.x;
    gameState.treasure.y = target.y;
    gameState.treasure.isBuried = false;
  }
  if (debuff) addDebuff(target, debuff, 1);

  const died = target.health <= 0;
  if (died) {
    target.isAlive = false;
  }

  return { ok: true, hit: true, roll, damage, debuff, targetId: target.id, died };
}

module.exports = {
  revealCell, revealWall,
  addDebuff, actionMove, actionCheckWall,
  actionUseHospital, actionUseArsenal,
  actionAttack, actionTreasure, actionUseBomb,
  actionCheckCell, actionUseMedkit
};
