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
  arsenal: '#ffaa00',
  hospital: '#ff4488',
  treasure: '#ffd700',
  mine: '#df1e00',
  grid: '#1e1e1e',
  wallDash: '#3a3a3a44',
  gridLine: '#000',
  deadPlayer: '#555',
  deadStroke: '#333',
  hpEmpty: '#1a0a0a',
  hpMe: '#5da844',
  hpEnemy: '#af0b0b',
  mineFill: '#ff220033',
  mineLabel: '#ffffffd0',
  fogOverlay: 'rgba(0,0,0,0.55)',
  canvasBorder: '#222',
};

const FLOOR_TILES = Array.from({length: 9}, (_, i) => `/tiles/floor/0${i+1}_tile.png`);
const HOSPITAL_TILE_SRC = '/tiles/hospital.png';
const HOSPITAL_USED_TILE_SRC = '/tiles/hospital_used.png';
const ARSENAL_TILE_SRC = '/tiles/arsenal.png';
const ARSENAL_USED_TILE_SRC = '/tiles/arsenal_used.png';
const TREASURE_TILE_SRC = '/tiles/treasure_tile.png';
const TREASURE_USED_TILE_SRC = '/tiles/treasure_tile_used.png';

const OUTER_WALL_SRCS = {
  left: '/walls/wall_left.png',
  right: '/walls/wall_right.png',
  top: '/walls/wall_top.png',
  bottom: '/walls/wall_bottom.png',
};

const EXIT_WALL_SRCS = {
  left: '/exits/exit_left.png',
  right: '/exits/exit_right.png',
  top: '/exits/exit_top.png',
  bottom: '/exits/exit_bottom.png',
};


const SPRITES = {
  mine: {
    on: '/sprites/mine/mine_on.png',
    off: '/sprites/mine/mine_off.png',
  },
  treasure: {
    treasure: '/sprites/treasure/treasure.png',
  },
  pinkerton: {
    top: '/sprites/pinkerton/02_back.png',
    bottom: '/sprites/pinkerton/02_front.png',
    left: '/sprites/pinkerton/02_left.png',
    right: '/sprites/pinkerton/02_right.png',
    top_left: '/sprites/pinkerton/02_back_left.png',
    top_right: '/sprites/pinkerton/02_back_right.png',
    bottom_left: '/sprites/pinkerton/02_front_left.png',
    bottom_right: '/sprites/pinkerton/02_front_right.png',
  },
};

export default function MazeCanvas({ gameData, myId, targetId, mouseDir, setMouseDir }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const spritesRef = useRef({});
  const floorTilesRef = useRef([]);

  const hospitalTileRef = useRef(null);
  const hospitalUsedTileRef = useRef(null);

  const arsenalTileRef = useRef(null);
  const arsenalUsedTileRef = useRef(null);

  const treasureTileRef = useRef(null);
  const treasureTileUsedRef = useRef(null);

  const outerWallsRef = useRef({});
  const exitWallsRef = useRef({});

  const [, setForceUpdate] = useState(0);

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
    for (const [key, src] of Object.entries(OUTER_WALL_SRCS)) {
      const img = new Image();
      img.src = src;
      img.onload = () => setForceUpdate(n => n + 1);
      outerWallsRef.current[key] = img;
    }
    for (const [key, src] of Object.entries(EXIT_WALL_SRCS)) {
      const img = new Image();
      img.src = src;
      img.onload = () => setForceUpdate(n => n + 1);
      exitWallsRef.current[key] = img;
    }
    floorTilesRef.current = FLOOR_TILES.map(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => setForceUpdate(n => n + 1);
      return img;
    });

    const hImg = new Image();
    hImg.src = HOSPITAL_TILE_SRC;
    hImg.onload = () => setForceUpdate(n => n + 1);
    hospitalTileRef.current = hImg;

    const huImg = new Image();
    huImg.src = HOSPITAL_USED_TILE_SRC;
    huImg.onload = () => setForceUpdate(n => n + 1);
    hospitalUsedTileRef.current = huImg;

    const aImg = new Image();
    aImg.src = ARSENAL_TILE_SRC;
    aImg.onload = () => setForceUpdate(n => n + 1);
    arsenalTileRef.current = aImg;

    const auImg = new Image();
    auImg.src = ARSENAL_USED_TILE_SRC;
    auImg.onload = () => setForceUpdate(n => n + 1);
    arsenalUsedTileRef.current = auImg;

    const ttImg = new Image();
    ttImg.src = TREASURE_TILE_SRC;
    ttImg.onload = () => setForceUpdate(n => n + 1);
    treasureTileRef.current = ttImg;

    const ttuImg = new Image();
    ttuImg.src = TREASURE_USED_TILE_SRC;
    ttuImg.onload = () => setForceUpdate(n => n + 1);
    treasureTileUsedRef.current = ttuImg;
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
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      let dir;
      if (angle > -22.5 && angle <= 22.5) dir = 'right';
      else if (angle > 22.5 && angle <= 67.5) dir = 'bottom_right';
      else if (angle > 67.5 && angle <= 112.5) dir = 'bottom';
      else if (angle > 112.5 && angle <= 157.5) dir = 'bottom_left';
      else if (angle > 157.5 || angle <= -157.5) dir = 'left';
      else if (angle > -157.5 && angle <= -112.5) dir = 'top_left';
      else if (angle > -112.5 && angle <= -67.5) dir = 'top';
      else dir = 'top_right';
      setMouseDir(dir);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [gameData, setMouseDir]);

  const animRef = useRef(null);
  useEffect(() => {
    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      if (!canvasRef.current || !containerRef.current || !gameData) return;
      const canvas = canvasRef.current;
      const { maze } = gameData;
      const { offsetWidth, offsetHeight } = containerRef.current;
      const MAX_SIZE = Math.min(offsetWidth, offsetHeight) - 20;
      const CELL = Math.floor(MAX_SIZE / Math.max(maze.width, maze.height));
      if (canvas.width !== maze.width * CELL) {
        canvas.width = maze.width * CELL;
        canvas.height = maze.height * CELL;
      }
      const ctx = canvas.getContext('2d');
      draw(ctx, gameData, canvas.width, canvas.height, CELL, targetId, myId, spritesRef.current, mouseDir,
        floorTilesRef.current, hospitalTileRef.current, hospitalUsedTileRef.current,
        arsenalTileRef.current, arsenalUsedTileRef.current, treasureTileRef.current, treasureTileUsedRef.current,
        outerWallsRef.current, exitWallsRef.current);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameData, targetId, myId, mouseDir]);

  if (!gameData) return null;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={styles.canvas} />
    </div>
  );
}

function draw(ctx, gameData, W, H, CELL, targetId, myId, sprites, mouseDir, floorTiles,
  hospitalTile, hospitalUsedTile, arsenalTile, arsenalUsedTile, treasureTile, treasureUsedTile, outerWalls, exitWalls) {
  const { you, maze, visiblePlayers, exit } = gameData;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clear
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, W, H);

  // Draw cells and walls
  for (const row of maze.cells)
    for (const cell of row)
      drawCellFloor(ctx, cell, CELL, exit, myId, floorTiles, hospitalTile, hospitalUsedTile, arsenalTile, arsenalUsedTile, treasureTile, treasureUsedTile, sprites);

  for (const row of maze.cells)
    for (const cell of row)
      drawCellWalls(ctx, cell, CELL, outerWalls, maze.width, maze.height, exit, exitWalls);

  // Draw player
  if (you) drawPlayer(ctx, you, CELL, sprites, visiblePlayers, targetId, mouseDir);
}

function drawCellFloor(ctx, cell, CELL, exit, myId, floorTiles, hospitalTile, hospitalUsedTile, arsenalTile, arsenalUsedTile, treasureTile, treasureUsedTile, sprites) {
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
  const tileImg = floorTiles?.[cell.tileIndex ?? 0];
  if (tileImg?.complete && tileImg.naturalWidth > 0) {
    ctx.drawImage(tileImg, px, py, CELL, CELL);
    if (!cell.inZone) {
      ctx.fillStyle = COLOR.fogOverlay;
      ctx.fillRect(px, py, CELL, CELL);
    }
  } else {
    ctx.fillStyle = COLOR.floor;
    ctx.fillRect(px, py, CELL, CELL);
  }
  // тонкая сетка
  ctx.strokeStyle = COLOR.gridLine;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(px, py, CELL, CELL);

  // POIs
  if (type === 'arsenal') {
    const tile = cell.used ? arsenalUsedTile : arsenalTile;
    if (tile?.complete && tile.naturalWidth > 0) {
      ctx.drawImage(tile, px, py, CELL, CELL);
      if (!cell.inZone) {
        ctx.fillStyle = COLOR.fogOverlay;
        ctx.fillRect(px, py, CELL, CELL);
      }
    } else {
      drawTile(ctx, px, py, COLOR.arsenal, '⚙', 'ARSENAL', CELL, cell.inZone);
    }
  }
  if (type === 'hospital') {
    const tile = cell.used ? hospitalUsedTile : hospitalTile;
    if (tile?.complete && tile.naturalWidth > 0) {
      ctx.drawImage(tile, px, py, CELL, CELL);
      if (!cell.inZone) {
        ctx.fillStyle = COLOR.fogOverlay;
        ctx.fillRect(px, py, CELL, CELL);
      }
    } else {
      drawTile(ctx, px, py, COLOR.hospital, '+', 'HOSPITAL', CELL, cell.inZone);
    }
  }
  if (content === 'mine') {
    const pulse = Math.floor(Date.now() / 500) % 2 === 0;
    const mineImg = pulse ? sprites?.mine?.on : sprites?.mine?.off;
    ctx.globalAlpha = cell.inZone ? 1 : 0.4;
    if (mineImg?.complete && mineImg.naturalWidth > 0) {
      const size = CELL * 0.25;

      ctx.drawImage(
        mineImg,
        px + (CELL - size) / 2,
        py + (CELL - size) / 2 + CELL * 0.3,
        size,
        size
      );
    }
    ctx.globalAlpha = 1;
  }
  if (cell.dugUp) {
    const tile = treasureUsedTile;
    if (tile?.complete && tile.naturalWidth > 0) {
      ctx.drawImage(tile, px, py, CELL, CELL);
      if (!cell.inZone) {
        ctx.fillStyle = COLOR.fogOverlay;
        ctx.fillRect(px, py, CELL, CELL);
      }
    }
  } else if (cell.treasure && cell.treasure.isBuried) {
    const tile = treasureTile;
    if (tile?.complete && tile.naturalWidth > 0) {
      ctx.drawImage(tile, px, py, CELL, CELL);
      if (!cell.inZone) {
        ctx.fillStyle = COLOR.fogOverlay;
        ctx.fillRect(px, py, CELL, CELL);
      }
    }
  }

  if (cell.treasure && !cell.treasure.isBuried) {
    const chest = sprites?.treasure?.treasure;
    if (chest?.complete && chest.naturalWidth > 0) {
      const size = CELL * 0.35;
      ctx.filter = 'saturate(0.8) brightness(0.9)';
      // ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(chest, px + (CELL - size) / 2, py + (CELL - size) / 2 + CELL * 0.02, size, size);
      ctx.filter = 'none';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      if (!cell.inZone) {
        ctx.fillStyle = COLOR.fogOverlay;
        ctx.fillRect(px, py, CELL, CELL);
      }
    }
  }
}

function drawCellWalls(ctx, cell, CELL, outerWalls, mazeW, mazeH, exit, exitWalls) {
  if (!cell.walls) return;
  const px = cell.x * CELL;
  const py = cell.y * CELL;
  drawWalls(ctx, cell, px, py, CELL, outerWalls, mazeW, mazeH, cell.inZone, exit, exitWalls);
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

function drawTiledWall(ctx, img, x, y, w, h) {
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  if (w < h) {
    const tileH = Math.round(w * sh / sw);
    for (let ty = y; ty < y + h; ty += tileH) {
      const drawH = Math.min(tileH, y + h - ty);
      const srcH = Math.round(drawH * sh / tileH);
      ctx.drawImage(img, 0, 0, sw, srcH, x, ty, w, drawH);
    }
  } else {
    const tileW = Math.round(h * sw / sh);
    for (let tx = x; tx < x + w; tx += tileW) {
      const drawW = Math.min(tileW, x + w - tx);
      const srcW = Math.round(drawW * sw / tileW);
      ctx.drawImage(img, 0, 0, srcW, sh, tx, y, drawW, h);
    }
  }
}

function drawWalls(ctx, cell, px, py, CELL, outerWalls, mazeW, mazeH, _inZone, exit, exitWalls) {
  if (!cell.walls) return;

  const ready = (img) => img?.complete && img.naturalWidth > 0;
  const wt = Math.round(CELL * 1);

  const isOuterSide = {
    top:    cell.y === 0,
    bottom: cell.y === mazeH - 1,
    left:   cell.x === 0,
    right:  cell.x === mazeW - 1,
  };

  ctx.lineWidth = WALL;
  ctx.lineCap = 'square';

  for (const dir of ['top', 'right', 'bottom', 'left']) {
    const wallVal = cell.walls[dir];
    if (wallVal === null) {
      // пунктир — как было
      ctx.strokeStyle = COLOR.wallDash;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      if (dir === 'top') { ctx.moveTo(px, py); ctx.lineTo(px + CELL, py); }
      if (dir === 'right') { ctx.moveTo(px + CELL, py); ctx.lineTo(px + CELL, py + CELL); }
      if (dir === 'bottom') { ctx.moveTo(px, py + CELL); ctx.lineTo(px + CELL, py + CELL); }
      if (dir === 'left') { ctx.moveTo(px, py); ctx.lineTo(px, py + CELL); }
      ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }

    const isExitWall = exit && exit.x === cell.x && exit.y === cell.y && exit.direction === dir;

    if (isExitWall && ready(exitWalls?.[dir])) {
      const img = exitWalls[dir];
      if (dir === 'left') drawTiledWall(ctx, img, px, py, wt, CELL);
      if (dir === 'right') drawTiledWall(ctx, img, px + CELL - wt, py, wt, CELL);
      if (dir === 'top') drawTiledWall(ctx, img, px, py, CELL, wt);
      if (dir === 'bottom') drawTiledWall(ctx, img, px, py + CELL - wt, CELL, wt);
      continue;
    }

    if (wallVal !== true) continue; // false = нет стены

    if (isOuterSide[dir] && ready(outerWalls?.[dir])) {
      const img = outerWalls[dir];
      if (dir === 'left') {
        if (dir === 'left') drawTiledWall(ctx, img, px, py, wt, CELL);
      }
      if (dir === 'right') {
        if (dir === 'right') drawTiledWall(ctx, img, px + CELL - wt, py, wt, CELL);
      }
      if (dir === 'top') {
        if (dir === 'top') drawTiledWall(ctx, img, px, py, CELL, wt);
      }
      if (dir === 'bottom') {
        if (dir === 'bottom') drawTiledWall(ctx, img, px, py + CELL - wt, CELL, wt);
      }
    } else {
      // обычная линия
      ctx.strokeStyle = COLOR.wall;
      ctx.beginPath();
      if (dir === 'left') { ctx.moveTo(px, py); ctx.lineTo(px, py + CELL); }
      if (dir === 'right') { ctx.moveTo(px + CELL, py); ctx.lineTo(px + CELL, py + CELL); }
      if (dir === 'top') { ctx.moveTo(px, py); ctx.lineTo(px + CELL, py); }
      if (dir === 'bottom') { ctx.moveTo(px, py + CELL); ctx.lineTo(px + CELL, py + CELL); }
      ctx.stroke();
    }
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
  const baseCx = you.x * CELL + CELL / 2;
  const baseCy = you.y * CELL + CELL * 0.65;
  const youWithDir = { ...you, direction: mouseDir };
  drawSinglePlayer(ctx, youWithDir, CELL, COLOR.player, { cx: baseCx, cy: baseCy }, true, sprites, false, true);

  const enemyPositions = [
    { dx: 0,    dy: -0.3 }, // сверху
    { dx: 0.3,  dy: 0 }, // справа
    { dx: -0.3, dy: 0 }, // слева
    { dx: 0.3,  dy: -0.3 }, // верхний-правый
    { dx: -0.3, dy: -0.3 }, // верхний-левый
    { dx: 0.3,  dy: 0.3 }, // нижний-правый
    { dx: -0.3, dy: 0.3 }, // нижний-левый
  ];

  myCellmates.forEach((p, i) => {
    const offset = enemyPositions[i] ?? enemyPositions[0];
    const pos = {
      cx: you.x * CELL + CELL / 2 + offset.dx * CELL,
      cy: you.y * CELL + CELL * 0.4 + offset.dy * CELL,
    };
    drawSinglePlayer(ctx, p, CELL, COLOR.enemyPlayer, pos, false, sprites, p.id === targetId, false);
  });

  // рисуем остальных visible (не в моей клетке)
  for (const [key, players] of Object.entries(byCell)) {
    if (key === myKey) continue;
    const enemyPositions = [
      { dx: 0, dy: -0.3 },
      { dx: 0.3, dy: 0 },
      { dx: -0.3, dy: 0 },
      { dx: 0.3, dy: -0.3 },
      { dx: -0.3, dy: -0.3 },
      { dx: 0.3, dy: 0.3 },
      { dx: -0.3, dy: 0.3 },
    ];
    const cellCx = players[0].x * CELL + CELL / 2;
    const cellCy = players[0].y * CELL + CELL * 0.4;
    const positions = players.length === 1
      ? [{ cx: cellCx, cy: players[0].y * CELL + CELL * 0.4 - CELL * 0.3 }]
      : players.map((_, i) => ({
          cx: cellCx + (enemyPositions[i]?.dx ?? 0) * CELL,
          cy: cellCy + (enemyPositions[i]?.dy ?? 0) * CELL,
        }));
    players.forEach((p, i) => {
      drawSinglePlayer(ctx, p, CELL, COLOR.enemyPlayer, positions[i], false, sprites, p.id === targetId, false);
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
    ctx.filter = 'saturate(0.6)';
    const offsetY = r * 0.7;
    ctx.drawImage(img, cx - r * 1.0, cy - r * 1.0 + offsetY, r * 2.0, r * 2.0);
    ctx.filter = 'none';
  } else {
    ctx.globalAlpha = isDead ? 0.5 : 1;
    ctx.fillStyle = isDead ? COLOR.deadPlayer : color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isDead ? COLOR.deadStroke : COLOR.gridLine;
    ctx.lineWidth = isDead ? 1 : 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (isDead) {
    ctx.strokeStyle = COLOR.deadPlayer;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy - r * 0.6);
    ctx.lineTo(cx + r * 0.6, cy + r * 0.6);
    ctx.moveTo(cx + r * 0.6, cy - r * 0.6);
    ctx.lineTo(cx - r * 0.6, cy + r * 0.6);
    ctx.stroke();
    return; // не рисуем хелсбар и клад
  }

  if (isTarget) {
    const spriteCy = cy + r * 0.7;
    const s = r * 0.4;
    ctx.strokeStyle = COLOR.hpEnemy;
    ctx.lineWidth = 2;

    // круг
    ctx.beginPath();
    ctx.arc(cx, spriteCy, s, 0, Math.PI * 2);
    ctx.stroke();

    // крестик
    const gap = s * 0.3;
    // горизонталь
    ctx.beginPath();
    ctx.moveTo(cx - s - s * 0.3, spriteCy);
    ctx.lineTo(cx - gap, spriteCy);
    ctx.moveTo(cx + gap, spriteCy);
    ctx.lineTo(cx + s + s * 0.3, spriteCy);
    ctx.stroke();

    // вертикаль
    ctx.beginPath();
    ctx.moveTo(cx, spriteCy - s - s * 0.3);
    ctx.lineTo(cx, spriteCy - gap);
    ctx.moveTo(cx, spriteCy + gap);
    ctx.lineTo(cx, spriteCy + s + s * 0.3);
    ctx.stroke();
  }

  if (player.hasTreasure) {
    const barW = r * 1.5;
    const hpX = cx - barW / 2;
    const hpY = cy;

    ctx.fillStyle = COLOR.treasure;
    ctx.font = `bold ${r * 0.7}px "Spectral"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = COLOR.treasure;
    ctx.shadowBlur = 8;
    ctx.fillText(
      '◆',
      hpX + barW / 2, // центр HP-бара
      hpY - r * 0.01 // немного выше полоски
    );
    ctx.shadowBlur = 0;
  }

  drawHealthBar(ctx, cx, cy, r, player.health, isMe);
}

function drawHealthBar(ctx, cx, cy, r, health, isMe) {
  const barW = r * 1.5;
  const barH = r * 0.2;
  const x = cx - barW / 2;
  const y = cy - r * 2 + r * 1.95;

  const segW = barW / 3;

  for (let i = 0; i < 3; i++) {
    const hp = Math.max(0, Math.min(1, health - i));
    const sx = x + i * segW;

    // фон
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(sx + 1, y, segW - 2, barH);

    // заполнение
    if (hp >= 1) {
      ctx.fillStyle = isMe ? COLOR.hpMe : COLOR.hpEnemy;
      ctx.fillRect(sx + 1, y, segW - 2, barH);
    } else if (hp === 0.5) {
      ctx.fillStyle = isMe ? COLOR.hpMe : COLOR.hpEnemy;
      ctx.fillRect(sx + 1, y, (segW - 2) / 2, barH);
    }

    // граница сегмента
    ctx.strokeStyle = COLOR.gridLine;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, y, segW, barH);
  }
}

const styles = {
  canvas: {
    display: 'block',
    border: `1px solid ${COLOR.canvasBorder}`,
    imageRendering: 'auto',
    maxWidth: '100%',
    maxHeight: '100%',
  },
};
