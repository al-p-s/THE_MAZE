function generateMaze(width, height) {

  // Инициализируем сетку — все стены закрыты
  const cells = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({
      x,
      y,
      walls: { top: true, right: true, bottom: true, left: true },
      visited: false,
      type: 'empty', // empty | arsenal | hospital | exit
      content: null  // treasure | mine | trap | corpse | null
    }))
  );

  // Рекурсивный бэктрекинг
  function carve(x, y) {
    cells[y][x].visited = true;
    const dirs = shuffle([
      { dx: 0, dy: -1, wall: 'top',    opposite: 'bottom' },
      { dx: 1, dy: 0,  wall: 'right',  opposite: 'left'   },
      { dx: 0, dy: 1,  wall: 'bottom', opposite: 'top'    },
      { dx: -1, dy: 0, wall: 'left',   opposite: 'right'  },
    ]);

    for (const { dx, dy, wall, opposite } of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !cells[ny][nx].visited) {
        cells[y][x].walls[wall] = false;
        cells[ny][nx].walls[opposite] = false;
        carve(nx, ny);
      }
    }
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  carve(0, 0);

  // Убираем служебное поле visited
  cells.forEach(row => row.forEach(cell => delete cell.visited));

  return cells;
}

function placePOIs(cells, width, height, playerCount) {
  const poiCount = Math.ceil(playerCount / 3);

  // Крайние клетки для выхода
  const edgeCells = [];
  for (let x = 0; x < width; x++) {
    edgeCells.push(cells[0][x]);
    edgeCells.push(cells[height - 1][x]);
  }
  for (let y = 1; y < height - 1; y++) {
    edgeCells.push(cells[y][0]);
    edgeCells.push(cells[y][width - 1]);
  }

  // Все внутренние клетки для арсенала, госпиталя, клада
  const innerCells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!(x === 0 || x === width - 1 || y === 0 || y === height - 1)) {
        innerCells.push(cells[y][x]);
      }
    }
  }

  function pickRandom(arr, exclude = []) {
    const available = arr.filter(c => !exclude.includes(c));
    return available[Math.floor(Math.random() * available.length)];
  }

  const used = [];

  // Выход — на крайней клетке
  const exit = pickRandom(edgeCells, used);
  exit.type = 'exit';
  used.push(exit);

  // Арсеналы
  for (let i = 0; i < poiCount; i++) {
    const cell = pickRandom(innerCells, used);
    cell.type = 'arsenal';
    used.push(cell);
  }

  // Госпитали
  for (let i = 0; i < poiCount; i++) {
    const cell = pickRandom(innerCells, used);
    cell.type = 'hospital';
    used.push(cell);
  }

  // Клад — внутри, закопан
  const treasureCell = pickRandom(innerCells, used);
  treasureCell.content = 'treasure';
  used.push(treasureCell);

  return cells;
}

function spawnPlayers(cells, width, height, playerCount) {
  const edgeCells = [];
  
  for (let x = 0; x < width; x++) {
    edgeCells.push(cells[0][x]);
    edgeCells.push(cells[height - 1][x]);
  }
  for (let y = 1; y < height - 1; y++) {
    edgeCells.push(cells[y][0]);
    edgeCells.push(cells[y][width - 1]);
  }

  const shuffled = edgeCells.sort(() => Math.random() - 0.5);
  const spawns = shuffled.slice(0, playerCount);

  return spawns.map((cell, i) => ({
    id: i,
    x: cell.x,
    y: cell.y
  }));
}

function getMazeSize(playerCount) {
  if (playerCount <= 2) return { width: 4, height: 4 };
  if (playerCount <= 4) return { width: 5, height: 5 };
  if (playerCount <= 6) return { width: 6, height: 6 };
  return { width: 7, height: 7 };
}

module.exports = { generateMaze, getMazeSize, placePOIs, spawnPlayers };
