import { useRef, useEffect } from 'react';
import { TestTube, Bomb, BriefcaseMedical } from 'lucide-react';

const COLOR = {
  accent: '#c8a84b',
  hp: '#2d6e2d',
  debuffW: '#f59920',
  debuffS: '#ae37fd',
  debuffP: '#d13333',
  debuffDefault: '#6a6a6a',
  dim: '#3a3228',
  border: '#3a2e1e',
  textDim: '#c8c0b0',
  hpEmpty: '#2a1a1a',
  hpBorder: '#5a3020',
  hpHighlight: '#4a9e4a',
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
    ctx.clearRect(0, 0, 120, 26);
    for (let i = 0; i < 3; i++) {
      const hp = Math.max(0, Math.min(1, me.health - i));
      const cx = 10 + i * 28;
      const cy = 13;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = COLOR.hpEmpty;
      ctx.fill();
      ctx.strokeStyle = COLOR.hpBorder;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (hp >= 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = COLOR.hp;
        ctx.shadowColor = '#2d6e2d';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = COLOR.hpHighlight;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (hp === 0.5) {
        ctx.beginPath();
        ctx.arc(cx, cy, 8, Math.PI * 0.5, Math.PI * 1.5);
        ctx.closePath();
        ctx.fillStyle = COLOR.hp;
        ctx.shadowColor = '#2d6e2d';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
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

      {/* AP */}
      <div style={{ marginBottom: '12px' }}>
        <div style={styles.label}>ACTION POINTS</div>
        <div style={styles.apRow}>
          {[0, 1].map(i => (
            <div key={i} style={{ ...styles.apDot, background: i < me.actionPoints ? COLOR.accent : COLOR.dim, boxShadow: i < me.actionPoints ? `0 0 6px ${COLOR.accent}88` : 'none' }} />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Health */}
      <div style={styles.label}>HEALTH</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <canvas ref={hpCanvasRef} width={120} height={26} />
        <span style={{ color: COLOR.hpHighlight, fontWeight: 'bold', fontSize: '20px', fontFamily: "'Cinzel', serif", letterSpacing: '1px', textShadow: '0 0 8px COLOR.hp' }}>
          {me.health} / 3
        </span>
      </div>
      
      {/* Divider */}
      <div style={styles.divider} />

      {/* Debuffs */}
      <div style={styles.label}>DEBUFFS</div>
      <div style={{ minHeight: '28px', marginBottom: '12px' }}>
        <div style={styles.debuffRow}>
          {me.debuffs.length === 0
            ? null
            : me.debuffs.map((d, i) => (
                <span key={i} style={{ ...styles.debuff, color: debuffColor(d.type), borderColor: debuffColor(d.type) + '55' }}>
                  {d.type} {d.turnsLeft}
                </span>
              ))
          }
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Inventory */}
      <div style={styles.section}>
        <div style={styles.label}>INVENTORY</div>
        <div style={styles.invGrid}>
          <InvItem icon={<TestTube size={22} color={COLOR.accent} style={{ display: 'block' }} />} label="Ammo" count={me.ammo} />
          <InvItem icon={<Bomb size={22} color={COLOR.accent} />} label="Bombs" count={me.bombs} />
          <InvItem icon={<BriefcaseMedical size={22} color={COLOR.accent} />} label="Medkits" count={me.items?.filter(i => i === 'medkit').length ?? 0} />
        </div>
      </div>
    </div>
  );
}

function InvItem({ icon, label, count }) {
  return (
    <div style={styles.invItem}>
      <span style={{ width: '16px', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ color: COLOR.textDim, fontSize: '16px', fontFamily: "'Spectral', serif", marginLeft: '6px' }}>{label}</span>
      <span style={{ color: count > 0 ? COLOR.accent : COLOR.textDim, fontWeight: 'bold', fontSize: '16px', fontFamily: "'Spectral', serif", marginLeft: 'auto' }}>{count}</span>
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
    padding: '4px 12px',
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
    fontSize: '16px',
    fontWeight: 'bold',
    fontFamily: "'Cinzel', serif",
    letterSpacing: '3px',
    color: COLOR.textDim,
    marginBottom: '6px',
    textTransform: 'uppercase',
  },
  apRow: {
    display: 'flex',
    gap: '6px',
  },
  apDot: {
    width: '20px',
    height: '20px',
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
    fontSize: '13px',
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
    padding: '6px 10px',
    background: COLOR.itemBg,
    border: `1px solid ${COLOR.itemBorder}`,
  },
  divider: {
    height: '1px',
    background: `linear-gradient(to right, transparent, ${COLOR.border}, transparent)`,
    margin: '10px 0',
  },
};
