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
    visibleCells: [],
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

module.exports = { createGameState };
