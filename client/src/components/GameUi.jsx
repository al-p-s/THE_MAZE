import { useRef, useEffect } from 'react';

const COLOR = {
  accent: '#c8a84b',
  hp: '#8b2020',
  debuffW: '#c8860a',
  debuffS: '#2e6a8a',
  debuffP: '#8b1a1a',
  debuffDefault: '#6a6a6a',
  dim: '#3a3228',
  border: '#3a2e1e',
  textDim: '#c8c0b0',
  hpEmpty: '#2a1a1a',
  hpBorder: '#5a3020',
  hpHighlight: '#c84040',
  bgActive: '#1a1408',
  bgInactive: '#0e0c09',
  borderInactive: '#2a2318',
  itemBg: '#13110e',
  itemBorder: '#1e1a14',
};

export default function GameUI({ me, isMyTurn, currentTurn }) {
  const hpCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = hpCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 72, 14);
    for (let i = 0; i < 3; i++) {
      const hp = Math.max(0, Math.min(1, me.health - i));
      const cx = 8 + i * 24;
      const cy = 7;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = COLOR.hpEmpty;
      ctx.fill();
      ctx.strokeStyle = COLOR.hpBorder;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (hp >= 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLOR.hp;
        ctx.fill();
        ctx.strokeStyle = COLOR.hpHighlight;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (hp === 0.5) {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, Math.PI * 0.5, Math.PI * 1.5);
        ctx.closePath();
        ctx.fillStyle = COLOR.hp;
        ctx.fill();
        ctx.strokeStyle = COLOR.hpHighlight;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, [me.health]);

  if (!me) return null;

  return (
    <div style={styles.root}>
      {/* Turn banner */}
      <div style={{
        ...styles.turnBanner,
        background: isMyTurn ? COLOR.bgActive : COLOR.bgInactive,
        borderColor: isMyTurn ? COLOR.accent : COLOR.borderInactive,
      }}>
        <span style={{ opacity: isMyTurn ? 1 : 0.5, color: isMyTurn ? COLOR.accent : COLOR.accent, fontWeight: 'bold', fontSize: '14px', letterSpacing: '3px', fontFamily: "'Cinzel', serif" }}>
          {isMyTurn ? 'YOUR TURN' : `PLAYER #${currentTurn?.playerIndex ?? '?'} TURN...`}
        </span>
      </div>

      {/* AP & Debuffs */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={styles.label}>ACTION POINTS</div>
          <div style={styles.apRow}>
            {[0, 1].map(i => (
              <div key={i} style={{ ...styles.apDot, background: i < me.actionPoints ? COLOR.accent : COLOR.dim, boxShadow: i < me.actionPoints ? `0 0 6px ${COLOR.accent}88` : 'none' }} />
            ))}
          </div>
        </div>
        <div>
          <div style={styles.label}>DEBUFFS</div>
          <div style={styles.debuffRow}>
            {me.debuffs.length === 0
              ? <span style={{ color: COLOR.textDim, fontSize: '11px', fontStyle: 'italic' }}></span>
              : me.debuffs.map((d, i) => (
                <span key={i} style={{ ...styles.debuff, color: debuffColor(d.type), borderColor: debuffColor(d.type) + '55' }}>
                  {d.type} {d.turnsLeft}
                </span>
              ))
            }
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Health */}
      <div style={styles.label}>HEALTH</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <canvas ref={hpCanvasRef} width={80} height={14} />
        <span style={{ color: COLOR.hp, fontWeight: 'bold', fontSize: '16px', fontFamily: "'Sinzel', serif", letterSpacing: '1px' }}>
          {me.health} / 3
        </span>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Inventory */}
      <div style={styles.section}>
        <div style={styles.label}>INVENTORY</div>
        <div style={styles.invGrid}>
          <InvItem symbol="◆" label="Ammo" count={me.ammo} />
          <InvItem symbol="✦" label="Bombs" count={me.bombs} />
          <InvItem symbol="✚" label="Medkits" count={me.items?.filter(i => i === 'medkit').length ?? 0} />
        </div>
      </div>
    </div>
  );
}

function InvItem({ symbol, label, count }) {
  return (
    <div style={styles.invItem}>
      <span style={{ color: COLOR.accent, fontSize: '14px', width: '16px' }}>{symbol}</span>
      <span style={{ color: COLOR.textDim, fontSize: '14px', fontFamily: "'Spectral', serif", marginLeft: '6px' }}>{label}</span>
      <span style={{ color: count > 0 ? COLOR.accent : COLOR.textDim, fontWeight: 'bold', fontSize: '14px', fontFamily: "'Spectral', serif", marginLeft: 'auto' }}>{count}</span>
    </div>
  );
}

function debuffColor(type) {
  if (type === 'W') return COLOR.debuffW;
  if (type === 'S') return COLOR.debuffS;
  if (type === 'P') return COLOR.debuffP;
  return COLOR.debuffDefault;
}

const styles = {
  root: {
    padding: '14px',
    borderBottom: `1px solid ${COLOR.border}`,
    background: COLOR.bgInactive,
  },
  turnBanner: {
    padding: '7px 10px',
    border: '1px solid',
    marginBottom: '14px',
    textAlign: 'center',
    position: 'relative',
  },
  section: {
    marginTop: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '3px',
    color: COLOR.textDim,
    marginBottom: '6px',
    fontFamily: "'Cinzel', serif",
    textTransform: 'uppercase',
  },
  apRow: {
    display: 'flex',
    gap: '6px',
  },
  apDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    transition: 'all 0.3s',
    border: `1px solid ${COLOR.border}`,
  },
  debuffRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  debuff: {
    fontSize: '10px',
    padding: '2px 5px',
    border: '1px solid',
    fontFamily: "'Cinzel', serif",
    letterSpacing: '1px',
  },
  invGrid: {
    fontFamily: "'Spectral', serif",
    fontSize: '13px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  invItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    background: COLOR.itemBg,
    border: `1px solid ${COLOR.itemBorder}`,
  },
  divider: {
    height: '1px',
    background: `linear-gradient(to right, transparent, ${COLOR.border}, transparent)`,
    margin: '10px 0',
  },
};
