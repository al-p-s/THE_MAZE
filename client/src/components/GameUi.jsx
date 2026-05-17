import { useRef, useEffect } from 'react';

const COLOR = {
  accent: '#c8ff00',
  hp: '#ff4488',
  debuffW: '#ffaa00',
  debuffS: '#00aaff',
  debuffP: '#ff2200',
  dim: '#444',
  bg: '#111',
  border: '#222',
};

export default function GameUI({ me, isMyTurn, currentTurn }) {
  const hpCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = hpCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 52, 10);
    for (let i = 0; i < 3; i++) {
      const hp = Math.max(0, Math.min(1, me.health - i));
      const cx = 5 + i * 16;
      const cy = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#333';
      ctx.fill();
      if (hp >= 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#cc3333';
        ctx.fill();
      } else if (hp === 0.5) {
        ctx.beginPath();
        ctx.arc(cx, cy, 4, Math.PI * 0.5, Math.PI * 1.5);
        ctx.closePath();
        ctx.fillStyle = '#cc3333';
        ctx.fill();
      }
    }
  }, [me.health]);
  
  if (!me) return null;

  return (
    <div style={styles.root}>
      {/* Turn banner */}
      <div style={{ ...styles.turnBanner, background: isMyTurn ? COLOR.accent + '22' : '#1a1a1a', borderColor: isMyTurn ? COLOR.accent : '#333' }}>
        <span style={{ color: isMyTurn ? COLOR.accent : '#666', fontSize: '11px', letterSpacing: '2px' }}>
          {isMyTurn ? '▶ ВАШ ХОД' : `ХОД ИГРОКА #${currentTurn?.playerIndex ?? '?'}`}
        </span>
      </div>

      {/* AP */}
      <div style={styles.section}>
        <div style={styles.label}>ОД</div>
        <div style={styles.apRow}>
          {[0, 1].map(i => (
            <div key={i} style={{ ...styles.apDot, background: i < me.actionPoints ? COLOR.accent : COLOR.dim }} />
          ))}
        </div>
      </div>

      {/* Health */}
      <div style={styles.label}>ЗДОРОВЬЕ</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <canvas ref={hpCanvasRef} width={52} height={10} />
        <span style={{ color: '#cc3333', fontSize: '14px', fontWeight: 'bold' }}>
          {me.health} / 3
        </span>
      </div>

      {/* Debuffs */}
      {me.debuffs.length > 0 && (
        <div style={styles.section}>
          <div style={styles.label}>ДЕБАФФЫ</div>
          <div style={styles.debuffRow}>
            {me.debuffs.map((d, i) => (
              <span key={i} style={{ ...styles.debuff, color: debuffColor(d.type), borderColor: debuffColor(d.type) + '66' }}>
                {d.type} {d.turnsLeft}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inventory */}
      <div style={styles.section}>
        <div style={styles.label}>ИНВЕНТАРЬ</div>
        <div style={styles.invGrid}>
          <InvItem icon="🔹" label="патроны" count={me.ammo} />
          <InvItem icon="💣" label="бомбы" count={me.bombs} />
          {me.items?.filter(i => i === 'medkit').length > 0 &&
            <InvItem icon="+" label="аптечки" count={me.items.filter(i => i === 'medkit').length} color={COLOR.hp} />}
          {me.hasTreasure && <InvItem icon="◆" label="клад" count="" color="#ffd700" />}
        </div>
      </div>
    </div>
  );
}

function InvItem({ icon, label, count, color }) {
  return (
    <div style={styles.invItem}>
      <span style={{ color: color || '#888', fontSize: '14px' }}>{icon}</span>
      <span style={{ color: '#aaa', fontSize: '11px', marginLeft: '4px' }}>{label}</span>
      <span style={{ color: color || COLOR.accent, fontSize: '13px', marginLeft: 'auto', fontWeight: 'bold' }}>{count}</span>
    </div>
  );
}

function debuffColor(type) {
  if (type === 'W') return COLOR.debuffW;
  if (type === 'S') return COLOR.debuffS;
  if (type === 'P') return COLOR.debuffP;
  return '#aaa';
}

const styles = {
  root: {
    padding: '12px',
    borderBottom: `1px solid ${COLOR.border}`,
    fontFamily: "'Courier New', monospace",
  },
  turnBanner: {
    padding: '6px 10px',
    border: '1px solid',
    borderRadius: '2px',
    marginBottom: '12px',
    textAlign: 'center',
  },
  section: {
    marginBottom: '10px',
  },
  label: {
    fontSize: '9px',
    letterSpacing: '2px',
    color: '#555',
    marginBottom: '4px',
  },
  apRow: {
    display: 'flex',
    gap: '6px',
  },
  apDot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    transition: 'background 0.2s',
  },
  hpRow: {
    display: 'flex',
    gap: '4px',
  },
  debuffRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  debuff: {
    fontSize: '10px',
    padding: '2px 6px',
    border: '1px solid',
    borderRadius: '2px',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  invGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  invItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '3px 6px',
    background: '#151515',
    borderRadius: '2px',
  },
};
