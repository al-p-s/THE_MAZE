function createPlayer(socketId, index, spawnCell) {
  return {
    id: socketId,
    index,
    x: spawnCell.x,
    y: spawnCell.y,
    health: 3,
    ammo: 2,
    bombs: 1,
    items: [],
    debuffs: [],
    hasTreasure: false,
    visibleCells: {},
    isAlive: true,
    actionPoints: 2,
    rerollUsed: false, // Пинкертон — 1 раз за игру
  };
}

function createGameState(playerSockets, playerCount) {
  const { generateMaze, getMazeSize, placePOIs, spawnPlayers } = require('./maze');
  const { width, height } = getMazeSize(playerCount);
  const cells = generateMaze(width, height);
  placePOIs(cells, width, height, playerCount);
  let treasureX, treasureY;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        if (cells[y][x].content === 'treasure') {
          treasureX = x;
          treasureY = y;
        }
    }
  }
  const spawns = spawnPlayers(cells, width, height, playerCount);

  const players = playerSockets.map((socketId, i) =>
    createPlayer(socketId, i, spawns[i])
  );

  return {
    status: 'active',
    currentTurn: 0, // индекс игрока в массиве players
    players,
    maze: { width, height, cells },
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
    player.visibleCells[key] = { top: false, right: false, bottom: false, left: false };
  }
}

function revealWall(player, x, y, direction) {
  const key = `${x},${y}`;
  if (player.visibleCells[key]) {
    player.visibleCells[key][direction] = true;
  }
}

function getPlayerView(gameState, socketId) {
  const player = gameState.players.find(p => p.id === socketId);
  if (!player) return null;

  const visibleSet = player.visibleCells;

  const filteredCells = gameState.maze.cells.map(row =>
    row.map(cell => {
      const key = `${cell.x},${cell.y}`;
      const checkedWalls = visibleSet[key];
      if (!checkedWalls) return { x: cell.x, y: cell.y, hidden: true };
      return {
        ...cell,
        walls: {
          top: checkedWalls.top ? cell.walls.top : null,
          right: checkedWalls.right ? cell.walls.right : null,
          bottom: checkedWalls.bottom ? cell.walls.bottom : null,
          left: checkedWalls.left ? cell.walls.left : null,
        }
      };
    })
  );

  return {
    you: player,
    maze: { ...gameState.maze, cells: filteredCells },
    treasure: player.hasTreasure ? gameState.treasure : null,
    currentTurn: gameState.currentTurn,
    status: gameState.status,
  };
}

module.exports = { createGameState, revealCell, revealWall, getPlayerView };
