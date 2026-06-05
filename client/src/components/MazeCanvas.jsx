import { useRef, useEffect, useState } from 'react';

const WALL = 3;

const COLOR = {
  bg: '#0a0a0a',
  fog: '#111111',
  floor: '#1a1a1a',
  floorVisible: '#242424',
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

const SPRITES = {
  pinkerton: {
    top: '/sprites/pinkerton/02_back.png',
    bottom: '/sprites/pinkerton/02_front.png',
    left: '/sprites/pinkerton/02_left.png',
    right: '/sprites/pinkerton/02_right.png',
  }
};

export default function MazeCanvas({ gameData, myId, targetId, mouseDir, setMouseDir }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const spritesRef = useRef({});
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    for (const [cls, dirs] of Object.entries(SPRITES)) {
      spritesRef.current[cls] = {};
      for (const [dir, src] of Object.entries(dirs)) {
        const img = new Image();
        img.src = src;
        img.onload = () => setForceUpdate(n => n + 1);
        spritesRef.current[cls][dir] = img;
      }
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const canvas = canvasRef.current;
      if (!canvas || !gameData?.you) return;
      const rect = canvas.getBoundingClientRect();
      const { you, maze } = gameData;
      const CELL = canvas.width / maze.width;
      const cx = (you.x + 0.5) * CELL + rect.left;
      const cy = (you.y + 0.5) * CELL + rect.top;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (Math.abs(dx) > Math.abs(dy)) {
        setMouseDir(dx > 0 ? 'right' : 'left');
      } else {
        setMouseDir(dy > 0 ? 'bottom' : 'top');
      }
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [gameData, setMouseDir]);

  useEffect(() => {
    if (!gameData || !containerRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { maze } = gameData;
    const { offsetWidth, offsetHeight } = containerRef.current;
    const MAX_SIZE = Math.min(offsetWidth, offsetHeight) - 20;
    const CELL = Math.floor(MAX_SIZE / Math.max(maze.width, maze.height));
    canvas.width = maze.width * CELL;
    canvas.height = maze.height * CELL;
    const ctx = canvas.getContext('2d');
    draw(ctx, gameData, canvas.width, canvas.height, CELL, targetId, myId, spritesRef.current, mouseDir);
  }, [gameData, targetId, myId, forceUpdate, mouseDir]);

  if (!gameData) return null;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={styles.canvas} />
    </div>
  );
}

function draw(ctx, gameData, W, H, CELL, targetId, myId, sprites, mouseDir) {
  const { you, maze, visiblePlayers, exit } = gameData;

  // Clear
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, W, H);

  // Draw cells and walls
  for (const row of maze.cells)
    for (const cell of row)
      drawCellFloor(ctx, cell, CELL, exit, myId);

  for (const row of maze.cells)
    for (const cell of row)
      drawCellWalls(ctx, cell, CELL);

  // Draw player
  if (you) drawPlayer(ctx, you, CELL, sprites, visiblePlayers, targetId, mouseDir);
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

function drawCellFloor(ctx, cell, CELL, exit, myId) {
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
  ctx.fillStyle = cell.inZone ? COLOR.floorVisible : COLOR.floor;
  ctx.fillRect(px, py, CELL, CELL);
  // тонкая сетка
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(px, py, CELL, CELL);

  if (exit && exit.x === x && exit.y === y) {
    drawExit(ctx, px, py, CELL, exit.direction);
  }

  // POI / content tint
  if (type === 'arsenal') drawTile(ctx, px, py, COLOR.arsenal, '⚙', 'ARSENAL', CELL, cell.inZone);
  if (type === 'hospital') drawTile(ctx, px, py, COLOR.hospital, '+', 'HOSPITAL', CELL, cell.inZone);
  if (content === 'mine') {
    const isOwner = cell.mineOwner === myId;
    ctx.globalAlpha = cell.inZone ? 1 : 0.4;
    ctx.fillStyle = COLOR.mine + '33';
    ctx.beginPath();
    ctx.arc(px + CELL - CELL * 0.18, py + CELL - CELL * 0.18, CELL * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLOR.mine;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (isOwner) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${CELL * 0.1}px "Courier New"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('UR', px + CELL - CELL * 0.18, py + CELL - CELL * 0.18);
    }
    ctx.globalAlpha = 1;
  }
  if (cell.treasure) {
    drawTreasure(ctx, px, py, CELL, cell.treasure.isBuried, cell.inZone);
  }
}

function drawCellWalls(ctx, cell, CELL) {
  if (!cell.walls) return;
  const px = cell.x * CELL;
  const py = cell.y * CELL;
  drawWalls(ctx, cell, px, py, CELL);
}

function drawTile(ctx, px, py, color, icon, label, CELL, active = true) {
  const alpha = active ? 'cc' : '55'; // тускло если не в зоне
  const alphaFill = active ? '18' : '0a';

  ctx.fillStyle = color + alphaFill;
  ctx.fillRect(px, py, CELL, CELL);

  ctx.fillStyle = color + alpha;
  ctx.font = `bold ${CELL * 0.28}px "Courier New"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, px + CELL / 2, py + CELL / 2 - 6);

  ctx.fillStyle = color + (active ? '99' : '44');
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

function drawPlayer(ctx, you, CELL, sprites, visiblePlayers = [], targetId = null, mouseDir = 'bottom') {
  // группируем visiblePlayers по клеткам
  const byCell = {};
  for (const p of visiblePlayers) {
    const key = `${p.x},${p.y}`;
    if (!byCell[key]) byCell[key] = [];
    byCell[key].push(p);
  }

  // рисуем себя
  const myKey = `${you.x},${you.y}`;
  const myCellmates = byCell[myKey] || [];
  const myTotal = myCellmates.length + 1;
  const myPositions = getPositions(you.x, you.y, CELL, myTotal);
  const youWithDir = { ...you, direction: mouseDir };
  drawSinglePlayer(ctx, youWithDir, CELL, COLOR.player, myPositions[0], true, sprites, false, true);
  myCellmates.forEach((p, i) => {
    drawSinglePlayer(ctx, p, CELL, '#ff6666', myPositions[i + 1], false, sprites, p.id === targetId, false);
  });

  // рисуем остальных visible (не в моей клетке)
  for (const [key, players] of Object.entries(byCell)) {
    if (key === myKey) continue;
    const positions = getPositions(players[0].x, players[0].y, CELL, players.length);
    players.forEach((p, i) => {
      drawSinglePlayer(ctx, p, CELL, '#ff6666', positions[i], false, sprites, p.id === targetId, false);
    });
  }
}

function drawSinglePlayer(ctx, player, CELL, color, pos, showTreasure, sprites, isTarget = false, isMe = false){
  const { cx, cy } = pos;
  const r = CELL * 0.15;
  const isDead = player.isDead;

  const img = sprites?.[player.className]?.[player.direction ?? 'bottom'];
  if (!isDead && img?.complete && img.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, cx - r * 1.5, cy - r * 2, r * 3, r * 4);
  } else {
    ctx.globalAlpha = isDead ? 0.5 : 1;
    ctx.fillStyle = isDead ? '#555' : color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isDead ? '#333' : '#000';
    ctx.lineWidth = isDead ? 1 : 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (isDead) {
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy - r * 0.6);
    ctx.lineTo(cx + r * 0.6, cy + r * 0.6);
    ctx.moveTo(cx + r * 0.6, cy - r * 0.6);
    ctx.lineTo(cx - r * 0.6, cy + r * 0.6);
    ctx.stroke();
    if (player.looted) {
      ctx.fillStyle = '#555';
      ctx.font = `${r * 0.9}px "Courier New"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('∅', cx, cy + r * 1.3);
    }
    return; // не рисуем хелсбар и клад
  }

  if (isTarget) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff2200';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (player.hasTreasure) {
    ctx.fillStyle = COLOR.treasure;
    ctx.font = `bold ${r * 1.3}px "Courier New"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◆', cx, cy - r - r * 0.5);
  }

  drawHealthBar(ctx, cx, cy, r, player.health, isMe);
}

function drawHealthBar(ctx, cx, cy, r, health, isMe) {
  const barW = r * 1.5;
  const barH = r * 0.22;
  const x = cx - barW / 2;
  const y = cy - r * 1.2;

  const segW = barW / 3;

  for (let i = 0; i < 3; i++) {
    const hp = Math.max(0, Math.min(1, health - i));
    const sx = x + i * segW;

    // фон
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(sx + 1, y, segW - 2, barH);

    // заполнение
    if (hp >= 1) {
      ctx.fillStyle = isMe ? '#33cc33' : '#cc3333';
      ctx.fillRect(sx + 1, y, segW - 2, barH);
    } else if (hp === 0.5) {
      ctx.fillStyle = isMe ? '#33cc33' : '#cc3333';
      ctx.fillRect(sx + 1, y, (segW - 2) / 2, barH);
    }

    // граница сегмента
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, y, segW, barH);
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

function drawTreasure(ctx, px, py, CELL, isBuried, active = true) {
  const cx = px + CELL / 2;
  const cy = py + CELL / 2;
  const r = CELL * 0.25;
  ctx.globalAlpha = active ? 1 : 0.4;;

  if (isBuried) {
    // пунктирный кружок
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = COLOR.treasure + '88';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLOR.treasure + '33';
    ctx.fill();
    ctx.fillStyle = COLOR.treasure + '66';
    ctx.font = `${CELL * 0.18}px "Courier New"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BURIED', cx, cy);
  } else {
    // solid кружок
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = COLOR.treasure + '33';
    ctx.fill();
    ctx.strokeStyle = COLOR.treasure;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = COLOR.treasure;
    ctx.font = `bold ${CELL * 0.28}px "Courier New"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◆', cx, cy);
  }

  ctx.globalAlpha = 1;
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
