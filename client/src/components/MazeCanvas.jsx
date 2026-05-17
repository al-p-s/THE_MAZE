import { useRef, useEffect } from 'react';

const WALL = 3;

const COLOR = {
  bg: '#0a0a0a',
  fog: '#111111',
  floor: '#1a1a1a',
  wall: '#3a3a3a',
  wallOuter: '#555',
  player: '#c8ff00',
  exit: '#00ffcc',
  arsenal: '#ffaa00',
  hospital: '#ff4488',
  treasure: '#ffd700',
  mine: '#ff2200',
  grid: '#1e1e1e',
};

export default function MazeCanvas({ gameData }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    console.log('gameData', gameData);
    if (!gameData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { maze } = gameData;
    const MAX_SIZE = Math.min(window.innerWidth - 560, window.innerHeight - 40);
    const CELL = Math.floor(MAX_SIZE / Math.max(maze.width, maze.height));
    const ctx = canvas.getContext('2d');
    draw(ctx, gameData, canvas.width, canvas.height, CELL);
  }, [gameData]);

  if (!gameData) return null;

  const { maze } = gameData;
  const MAX_SIZE = Math.min(window.innerWidth - 300, window.innerHeight - 40);
  const CELL = Math.floor(MAX_SIZE / Math.max(maze.width, maze.height));
  const W = maze.width * CELL;
  const H = maze.height * CELL;

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={styles.canvas}
    />
  );
}

function draw(ctx, gameData, W, H, CELL) {
  const { you, maze, cellmates, exit } = gameData;

  // Clear
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, W, H);

  // Draw cells
  for (const row of maze.cells) {
    for (const cell of row) {
      drawCell(ctx, cell, CELL, exit);
    }
  }

  // Draw player
  if (you) drawPlayer(ctx, you, CELL, cellmates);
}

function drawExit(ctx, px, py, CELL, direction) {
  const gap = CELL * 0.3;
  ctx.strokeStyle = COLOR.exit;
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (direction === 'top') {
    ctx.moveTo(px + gap, py);
    ctx.lineTo(px + CELL - gap, py);
  } else if (direction === 'bottom') {
    ctx.moveTo(px + gap, py + CELL);
    ctx.lineTo(px + CELL - gap, py + CELL);
  } else if (direction === 'left') {
    ctx.moveTo(px, py + gap);
    ctx.lineTo(px, py + CELL - gap);
  } else if (direction === 'right') {
    ctx.moveTo(px + CELL, py + gap);
    ctx.lineTo(px + CELL, py + CELL - gap);
  }
  ctx.stroke();
}

function drawCell(ctx, cell, CELL, exit) {
  const { x, y, hidden, type, content } = cell;
  const px = x * CELL;
  const py = y * CELL;

  if (hidden) {
    ctx.fillStyle = COLOR.fog;
    ctx.fillRect(px, py, CELL, CELL);
    drawWalls(ctx, cell, px, py, CELL);
    return;
  }

  // Floor
  ctx.fillStyle = COLOR.floor;
  ctx.fillRect(px, py, CELL, CELL);

  if (exit && exit.x === x && exit.y === y) {
    drawExit(ctx, px, py, CELL, exit.direction);
  }

  // POI / content tint
  if (type === 'exit') drawTile(ctx, px, py, COLOR.exit, '⬆', 'ВЫХОД', CELL);
  else if (type === 'arsenal') drawTile(ctx, px, py, COLOR.arsenal, '⚙', 'АРСЕНАЛ', CELL);
  else if (type === 'hospital') drawTile(ctx, px, py, COLOR.hospital, '+', 'ГОСПИТАЛЬ', CELL);

  if (content === 'mine') drawTile(ctx, px, py, COLOR.mine, '✕', 'МИНА', CELL);
  if (content === 'treasure') drawTile(ctx, px, py, COLOR.treasure, '◆', 'КЛАД', CELL);

  // Walls
  drawWalls(ctx, cell, px, py, CELL);
}

function drawTile(ctx, px, py, color, icon, label, CELL) {
  // Subtle tint
  ctx.fillStyle = color + '18';
  ctx.fillRect(px, py, CELL, CELL);

  // Icon
  ctx.fillStyle = color + 'cc';
  ctx.font = `bold ${CELL * 0.28}px "Courier New"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, px + CELL / 2, py + CELL / 2 - 6);

  // Label
  ctx.fillStyle = color + '99';
  ctx.font = `${CELL * 0.13}px "Courier New"`;
  ctx.fillText(label, px + CELL / 2, py + CELL / 2 + CELL * 0.22);
}

function drawWalls(ctx, cell, px, py, CELL) {
  if (!cell.walls) return;

  ctx.lineWidth = WALL;
  ctx.lineCap = 'square';

  // top
  if (cell.walls.top === true) {
    ctx.strokeStyle = COLOR.wall;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + CELL, py); ctx.stroke();
  } else if (cell.walls.top === null) {
    // checked but unknown — subtle dotted
    ctx.strokeStyle = COLOR.wall + '44';
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + CELL, py); ctx.stroke();
    ctx.setLineDash([]);
  }

  // right
  if (cell.walls.right === true) {
    ctx.strokeStyle = COLOR.wall;
    ctx.beginPath(); ctx.moveTo(px + CELL, py); ctx.lineTo(px + CELL, py + CELL); ctx.stroke();
  } else if (cell.walls.right === null) {
    ctx.strokeStyle = COLOR.wall + '44';
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(px + CELL, py); ctx.lineTo(px + CELL, py + CELL); ctx.stroke();
    ctx.setLineDash([]);
  }

  // bottom
  if (cell.walls.bottom === true) {
    ctx.strokeStyle = COLOR.wall;
    ctx.beginPath(); ctx.moveTo(px, py + CELL); ctx.lineTo(px + CELL, py + CELL); ctx.stroke();
  } else if (cell.walls.bottom === null) {
    ctx.strokeStyle = COLOR.wall + '44';
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(px, py + CELL); ctx.lineTo(px + CELL, py + CELL); ctx.stroke();
    ctx.setLineDash([]);
  }

  // left
  if (cell.walls.left === true) {
    ctx.strokeStyle = COLOR.wall;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + CELL); ctx.stroke();
  } else if (cell.walls.left === null) {
    ctx.strokeStyle = COLOR.wall + '44';
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + CELL); ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPlayer(ctx, player, CELL, cellmates = []) {
  console.log('cellmates in draw:', cellmates);
  const total = cellmates.length + 1;
  const scale = total === 1 ? 1 : 1 / Math.sqrt(total);
  const r = CELL * 0.15 * scale;

  const positions = getPositions(player.x, player.y, CELL, total);
  const { cx, cy } = positions[0]; // ты всегда первый

  // Body
  ctx.fillStyle = COLOR.player;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Body border
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Treasure indicator
  if (player.hasTreasure) {
    ctx.fillStyle = COLOR.treasure;
    ctx.font = `bold ${r * 1.3}px "Courier New"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◆', cx, cy - r - r * 0.5);
  }

  // Health dots above player
  drawHealthBar(ctx, cx, cy, r, player.health);

  cellmates.forEach((mate, i) => {
    const { cx, cy } = positions[i + 1];
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();

    drawHealthBar(ctx, cx, cy, r, mate.health);
  });
}

function drawHealthBar(ctx, cx, cy, r, health) {
  for (let i = 0; i < 3; i++) {
    const hp = Math.max(0, Math.min(1, health - i));
    const spacing = r * 0.6;
    const dotX = cx - spacing + i * spacing;
    const dotY = cy - r * 0.8;

    ctx.beginPath();
    ctx.arc(dotX, dotY, r * 0.33, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (hp >= 1) {
      ctx.beginPath();
      ctx.arc(dotX, dotY, r * 0.33, 0, Math.PI * 2);
      ctx.fillStyle = '#cc3333';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (hp === 0.5) {
      ctx.beginPath();
      ctx.arc(dotX, dotY, r * 0.33, Math.PI * 0.5, Math.PI * 1.5);
      ctx.closePath();
      ctx.fillStyle = '#cc3333';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function getPositions(cellX, cellY, CELL, total) {
  const baseCx = cellX * CELL + CELL / 2;
  const baseCy = cellY * CELL + CELL / 2;
  if (total === 1) return [{ cx: baseCx, cy: baseCy }];
  const radius = CELL * 0.28;
  return Array.from({ length: total }, (_, i) => {
    const angle = (2 * Math.PI * i) / total - Math.PI / 2;
    return {
      cx: baseCx + radius * Math.cos(angle),
      cy: baseCy + radius * Math.sin(angle),
    };
  });
}

const styles = {
  canvas: {
    display: 'block',
    border: '1px solid #222',
    imageRendering: 'pixelated',
    maxWidth: '100%',
    maxHeight: '100%',
  },
};
