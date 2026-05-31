const DIRS = { top:{dx:0,dy:-1}, right:{dx:1,dy:0}, bottom:{dx:0,dy:1}, left:{dx:-1,dy:0} };
const OPPOSITE = { top:'bottom', bottom:'top', left:'right', right:'left' };

function getCell(maze, x, y) {
  if (x < 0 || y < 0 || x >= maze.width || y >= maze.height) return null;
  return maze.cells[y][x];
}

function createPlayer(socketId, index, spawnCell) {
  return {
    id: socketId,
    index,
    x: spawnCell.x,
    y: spawnCell.y,
    className: 'pinkerton',
    health: 3,
    ammo: 2,
    bombs: 1,
    items: [],
    debuffs: [],
    hasTreasure: false,
    visibleCells: {},
    isAlive: true,
    actionPoints: 2,
  };
}

function createGameState(playerSockets, playerCount) {
  const { generateMaze, getMazeSize, placePOIs, spawnPlayers } = require('./maze');
  const { width, height } = getMazeSize(playerCount);
  const cells = generateMaze(width, height);
  const { cells: mazeCells, exit } = placePOIs(cells, width, height, playerCount);
  let treasureX, treasureY;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        if (cells[y][x].content === 'treasure') {
          treasureX = x;
          treasureY = y;
        }
    }
  }
  console.log('treasure pos:', treasureX, treasureY);
  const spawns = spawnPlayers(cells, width, height, playerCount);

  const players = playerSockets.map((socketId, i) =>
    createPlayer(socketId, i, spawns[i])
  );

  players.forEach(p => revealCell(p, p.x, p.y));

  return {
    status: 'active',
    currentTurn: 0, // индекс игрока в массиве players
    players,
    maze: { width, height, cells: mazeCells },
    exit,
    treasure: {
      x: treasureX,
      y: treasureY,
      isBuried: true,
      carriedBy: null,
      destroyed: false,
    }
  };
}

function revealCell(player, x, y) {
  const key = `${x},${y}`;
  if (!player.visibleCells[key]) {
    player.visibleCells[key] = { top: false, right: false, bottom: false, left: false, visited: true };
  } else {
    player.visibleCells[key].visited = true;
  }
}

function revealWall(player, x, y, direction) {
  const key = `${x},${y}`;
  if (player.visibleCells[key]) {
    player.visibleCells[key][direction] = true;
  }
}

function addDebuff(player, type, turns) {
  const existing = player.debuffs.find(d => d.type === type);
  if (existing) existing.turnsLeft = Math.max(existing.turnsLeft, turns);
  else player.debuffs.push({ type, turnsLeft: turns });
}

function tickDebuffs(player) {
  player.debuffs = player.debuffs
    .map(d => ({ ...d, turnsLeft: d.turnsLeft - 1 }))
    .filter(d => d.turnsLeft > 0);
}

function hasDebuff(player, type) {
  return player.debuffs.some(d => d.type === type);
}

function nextTurn(gameState) {
  const current = gameState.players[gameState.currentTurn];
  tickDebuffs(current);

  const total = gameState.players.length;
  let next = (gameState.currentTurn + 1) % total;
  let attempts = 0;
  while (!gameState.players[next].isAlive && attempts < total) {
    next = (next + 1) % total;
    attempts++;
  }

  gameState.currentTurn = next;
  const p = gameState.players[next];

  if (hasDebuff(p, 'P')) {
    tickDebuffs(p);
    p.actionPoints = 0;
    return nextTurn(gameState); // пропуск хода
  }

  p.actionPoints = hasDebuff(p, 'S') ? 1 : 2;
  return next;
}

function getVisibleZone(player, maze, radius = 1) {
  const zone = new Set();

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const tx = player.x + dx;
      const ty = player.y + dy;
      if (tx < 0 || ty < 0 || tx >= maze.width || ty >= maze.height) continue;
      if (hasLineOfSight(player.x, player.y, tx, ty, maze)) {
        zone.add(`${tx},${ty}`);
      }
    }
  }
  return zone;
}

function hasLineOfSight(x0, y0, x1, y1, maze) {
  let x = x0;
  let y = y0;

  while (x !== x1 || y !== y1) {
    const dx = Math.sign(x1 - x);
    const dy = Math.sign(y1 - y);
    const cell = maze.cells[y][x];

    if (dx !== 0 && dy !== 0) {
      const blockedH = cell.walls[dx > 0 ? 'right' : 'left'];
      const blockedV = cell.walls[dy > 0 ? 'bottom' : 'top'];
      if (blockedH && blockedV) return false;
      x += dx;
      y += dy;
    } else if (dx !== 0) {
      if (cell.walls[dx > 0 ? 'right' : 'left']) return false;
      x += dx;
    } else {
      if (cell.walls[dy > 0 ? 'bottom' : 'top']) return false;
      y += dy;
    }
  }
  return true;
}

function getPlayerView(gameState, socketId) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player) return null;

  const visibleSet = player.visibleCells;

  const zone = getVisibleZone(player, gameState.maze);

  const filteredCells = gameState.maze.cells.map(row =>
  row.map(cell => {
    const key = `${cell.x},${cell.y}`;
    const checkedWalls = visibleSet[key];
    const inZone = zone.has(key);
    const visited = checkedWalls?.visited;

    if (!visited) return { x: cell.x, y: cell.y, hidden: true };
    
    return {
      ...cell,
      inZone,
      walls: {
        top: checkedWalls?.top ? cell.walls.top : null,
        right: checkedWalls?.right ? cell.walls.right : null,
        bottom: checkedWalls?.bottom ? cell.walls.bottom : null,
        left: checkedWalls?.left ? cell.walls.left : null,
      }
    };
  })
);

  const visiblePlayers = gameState.players.filter(p => {
    if (!p.isAlive || p.id === socketId) return false;
    const key = `${p.x},${p.y}`;
    return zone.has(key) && !!visibleSet[key]?.visited;
  });

  return {
    you: player,
    visiblePlayers,
    exit: player.knownExit ? gameState.exit : null,
    maze: { ...gameState.maze, cells: filteredCells },
    treasure: gameState.treasure.destroyed ? null : gameState.treasure,
    currentTurn: gameState.currentTurn,
    status: gameState.status,
  };
}

module.exports = {
  createGameState,
  revealCell, revealWall,
  addDebuff, tickDebuffs, hasDebuff,
  nextTurn,
  getPlayerView,
  getCell, DIRS, OPPOSITE,
};
