const { revealCell, revealWall, addDebuff, getCell, DIRS, OPPOSITE } = require('./state');
const { weaponResults } = require('./classes');

function actionMove(gameState, socketId, direction) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };
  if (!DIRS[direction]) return { ok: false };

  player.actionPoints -= 1;
  const cell = getCell(gameState.maze, player.x, player.y);
  if (!cell) return { ok: false };
  const { dx, dy } = DIRS[direction];
  const nx = player.x + dx;
  const ny = player.y + dy;
  player.direction = direction;
  const isOutside = nx < 0 || ny < 0 || nx >= gameState.maze.width || ny >= gameState.maze.height;

  if (cell.walls[direction] && !isOutside) {
    const alreadyKnown = !!player.visibleCells[`${player.x},${player.y}`]?.[direction];
    if (alreadyKnown) player.actionPoints += 1;
    revealWall(player, player.x, player.y, direction);
    const key = `${nx},${ny}`;
    if (!player.visibleCells[key]) {
      player.visibleCells[key] = { top: false, right: false, bottom: false, left: false };
    }
    player.visibleCells[key][OPPOSITE[direction]] = true;
    return { ok: true, blocked: true, isEdge: false, alreadyKnown };
  }

  revealWall(player, player.x, player.y, direction);
  player.x += dx;
  player.y += dy;

  // Проверяем выход через внешнюю стену
  if (isOutside) {
    player.x -= dx;
    player.y -= dy;
    const exit = gameState.exit;
    const isExit = exit.x === player.x && exit.y === player.y && exit.direction === direction;

    if (isExit && !player.knownExit) {
      revealWall(player, player.x, player.y, direction);
      player.knownExit = true;
      return { ok: true, blocked: true, exitFound: true, isEdge: true, alreadyKnown: false };
    }

    if (isExit) {
      if (player.hasTreasure || gameState.treasure.destroyed) {
        gameState.status = 'finished';
        gameState.winner = socketId;
        return { ok: true, blocked: false, exit: true, won: true };
      }
      player.actionPoints += 1;
      return { ok: true, blocked: true, isEdge: true, alreadyKnown: true };
    }

    const wallKey = `${player.x},${player.y}_${direction}`;
    if (!player.checkedEdges) player.checkedEdges = new Set();
    const alreadyKnown = player.checkedEdges.has(wallKey);
    if (!alreadyKnown) player.checkedEdges.add(wallKey);
    revealWall(player, player.x, player.y, direction);
    if (alreadyKnown) player.actionPoints += 1;
    return { ok: true, blocked: true, isEdge: true, alreadyKnown };
  }

  const landedCell = getCell(gameState.maze, player.x, player.y);
  if (landedCell.content === 'mine' && landedCell.mineOwner !== socketId) {
    landedCell.content = null;
    const owner = landedCell.mineOwner;
    landedCell.mineOwner = null;
    
    for (const p of gameState.players) {
      const k = `${player.x},${player.y}`;
      if (p.visibleCells[k]) p.visibleCells[k].knownMine = false;
    }

    const victims = gameState.players.filter(p =>
      p.isAlive && ((p.x === player.x && p.y === player.y) || p.id === socketId)
    );
    for (const v of victims) {
      v.health -= 1.5;
      if (v.hasTreasure) {
        v.hasTreasure = false;
        gameState.treasure.carriedBy = null;
        gameState.treasure.x = v.x;
        gameState.treasure.y = v.y;
        gameState.treasure.isBuried = false;
      }
      if (v.health <= 0) v.isAlive = false;
    }

    const died = victims.some(v => !v.isAlive);
    if (died) player.isAlive = false;

    revealCell(player, player.x, player.y);
    revealWall(player, player.x - dx, player.y - dy, direction);
    revealWall(player, player.x, player.y, OPPOSITE[direction]);
    return { ok: true, blocked: false, mine: true, mineOwner: owner, died, victims: victims.map(v => ({ id: v.id, died: !v.isAlive })) };
  }

  revealCell(player, player.x, player.y);
  revealWall(player, player.x, player.y, OPPOSITE[direction]);

  return { ok: true, blocked: false };
}

function actionCheckWall(gameState, socketId, direction) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };
  if (!DIRS[direction]) return { ok: false };
  const wallKey = `${player.x},${player.y}`;
  const alreadyKnown = !!player.visibleCells[wallKey]?.[direction];
  if (alreadyKnown) return { ok: true, alreadyKnown: true, isEdge: false, isExit: false, hasWall: null };
  player.actionPoints -= 1;
  if (direction) player.direction = direction;

  const { dx, dy } = DIRS[direction];
  const nx = player.x + dx;
  const ny = player.y + dy;
  const isEdge = nx < 0 || ny < 0 || nx >= gameState.maze.width || ny >= gameState.maze.height;

  revealWall(player, player.x, player.y, direction);
  const key = `${nx},${ny}`;
  if (!player.visibleCells[key]) {
    player.visibleCells[key] = { top: false, right: false, bottom: false, left: false };
  }
  player.visibleCells[key][OPPOSITE[direction]] = true;

  const cell = getCell(gameState.maze, player.x, player.y);
  const hasWall = cell.walls[direction];

  let isExit = false;
  if (isEdge) {
    const exit = gameState.exit;
    if (exit.x === player.x && exit.y === player.y && exit.direction === direction) {
      isExit = true;
      player.knownExit = true;
    }
  }

  return { ok: true, isEdge, isExit, hasWall, alreadyKnown };
}

function actionUseHospital(gameState, socketId, choice) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };

  const cell = getCell(gameState.maze, player.x, player.y);
  if (!cell || cell.type !== 'hospital' || cell.used) return { ok: false, reason: 'not_hospital' };

  player.actionPoints -= 1;
  cell.used = true;

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
  cell.used = true

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
    const cell = getCell(gameState.maze, t.x, t.y);
    cell.dugUp = true;
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
  if (action === 'drop') {
    if (!player.hasTreasure) return { ok: false, reason: 'no_treasure' };
    player.actionPoints -= 1;
    player.hasTreasure = false;
    t.carriedBy = null;
    t.x = player.x;
    t.y = player.y;
    t.isBuried = false;
    return { ok: true, action: 'drop' };
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
    if (direction) player.direction = direction;
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
  const { dx, dy } = DIRS[direction];
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx < 0 || ny < 0 || nx >= gameState.maze.width || ny >= gameState.maze.height)
    return { ok: false };

  player.actionPoints -= 1;
  if (direction) player.direction = direction;
  const cell = getCell(gameState.maze, nx, ny);
  if (!cell) return { ok: true, content: null };

  if (cell.content === 'mine') {
    const key = `${nx},${ny}`;
    if (!player.visibleCells[key]) {
      player.visibleCells[key] = { top: false, right: false, bottom: false, left: false };
    }
    player.visibleCells[key].knownMine = true;
  }

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

function actionAttack(gameState, socketId, direction, targetId) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };
  if (player.ammo < 1) return { ok: false, reason: 'no_ammo' };
  if (player.debuffs.some(d => d.type === 'W')) return { ok: false, reason: 'weakness' };

  // если передан targetId — бьём напрямую
  if (targetId) {
    const target = gameState.players.find(p => p.isAlive && p.id === targetId && p.x === player.x && p.y === player.y);
    if (!target) return { ok: false, reason: 'invalid_target' };
    player.ammo -= 1;
    player.actionPoints -= 1;
    if (direction) player.direction = direction;
    const roll = rollDice();
    const { damage, debuff, debuffTurns } = weaponResults[player.className](roll);
    target.health -= damage;
    if (target.hasTreasure) {
      target.hasTreasure = false;
      gameState.treasure.carriedBy = null;
      gameState.treasure.x = target.x;
      gameState.treasure.y = target.y;
      gameState.treasure.isBuried = false;
    }
    if (debuff) addDebuff(target, debuff, debuffTurns);
    const died = target.health <= 0;
    if (died) target.isAlive = false;
    return { ok: true, hit: true, roll, damage, debuff, debuffTurns: debuff ? debuffTurns : null, targetId: target.id, died };
  }

  if (!DIRS[direction]) return { ok: false };

  player.actionPoints -= 1;
  if (direction) player.direction = direction;
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
    const hitsInCell = gameState.players.filter(p => p.isAlive && p.x === x && p.y === y && p.id !== socketId);
    if (hitsInCell.length > 0) {
      target = hitsInCell[Math.floor(Math.random() * hitsInCell.length)];
      break;
    }
  }

  if (!target) {
    return { ok: true, hit: false, roll: null };
  }

  const roll = rollDice();
  const { damage, debuff, debuffTurns } = weaponResults[player.className](roll);

  target.health -= damage;
  if (target.hasTreasure) {
    target.hasTreasure = false;
    gameState.treasure.carriedBy = null;
    gameState.treasure.x = target.x;
    gameState.treasure.y = target.y;
    gameState.treasure.isBuried = false;
  }
  if (debuff) addDebuff(target, debuff, debuffTurns);

  const died = target.health <= 0;
  if (died) {
    target.isAlive = false;
  }

  return { ok: true, hit: true, roll, damage, debuff, debuffTurns: debuff ? debuffTurns : null, targetId: target.id, died };
}

function actionMelee(gameState, socketId, targetId) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };
  if (player.debuffs.some(d => d.type === 'W')) return { ok: false, reason: 'weakness' };

  const target = targetId
    ? gameState.players.find(p => p.isAlive && p.id === targetId && p.x === player.x && p.y === player.y)
    : gameState.players.find(p => p.isAlive && p.id !== socketId && p.x === player.x && p.y === player.y);
  
  if (!target) return { ok: false, reason: 'no_target' };

  player.actionPoints -= 1;
  const roll = rollDice();
  if (roll <= 3) return { ok: true, hit: false, roll, targetId: target.id };

  target.health -= 0.5;
  if (target.hasTreasure) {
    target.hasTreasure = false;
    gameState.treasure.carriedBy = null;
    gameState.treasure.x = target.x;
    gameState.treasure.y = target.y;
    gameState.treasure.isBuried = false;
  }

  const died = target.health <= 0;
  if (died) target.isAlive = false;

  return { ok: true, hit: true, roll, damage: 0.5, targetId: target.id, died };
}

function actionLoot(gameState, socketId, targetId) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player || !player.isAlive || player.actionPoints < 1) return { ok: false };

  const corpse = gameState.players.find(p =>
    !p.isAlive && p.id === targetId && p.x === player.x && p.y === player.y
  );
  if (!corpse || corpse.looted) return { ok: false, reason: 'no_corpse' };

  player.actionPoints -= 1;
  corpse.looted = true;

  const loot = {};

  // ammo / mana / jumps
  if (corpse.className === 'witch') {
    loot.mana = corpse.mana ?? 0;
    player.mana = (player.mana ?? 0) + loot.mana;
    corpse.mana = 0;
  } else if (corpse.className === 'reaper') {
    loot.jumps = corpse.jumps ?? 0;
    player.jumps = (player.jumps ?? 0) + loot.jumps;
    corpse.jumps = 0;
  } else {
    loot.ammo = corpse.ammo ?? 0;
    player.ammo += loot.ammo;
    corpse.ammo = 0;
  }

  // бомбы
  if (corpse.bombs > 0) {
    loot.bombs = corpse.bombs;
    player.bombs += corpse.bombs;
    corpse.bombs = 0;
  }

  // аптечки
  const medkits = corpse.items?.filter(i => i === 'medkit').length ?? 0;
  if (medkits > 0) {
    loot.medkits = medkits;
    player.items.push(...corpse.items.filter(i => i === 'medkit'));
    corpse.items = corpse.items.filter(i => i !== 'medkit');
  }

  return { ok: true, loot };
}

module.exports = {
  revealCell, revealWall,
  addDebuff, actionMove, actionCheckWall,
  actionUseHospital, actionUseArsenal,
  actionAttack, actionTreasure, actionUseBomb,
  actionCheckCell, actionUseMedkit,
  actionMelee, actionLoot,
};
