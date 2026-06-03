import { useState, useEffect, useRef } from 'react';

const DIRS = ['top', 'right', 'bottom', 'left'];
const DIR_LABEL = { top: 'W', right: 'D', bottom: 'S', left: 'A' };
const DIR_GRID = { top: '1/2', right: '2/3', bottom: '3/2', left: '2/1' }; // row/col

const COLOR = {
  accent: '#c8ff00',
  dim: '#333',
  dimText: '#555',
  bg: '#111',
  border: '#222',
  danger: '#ff4444',
  warn: '#ffaa00',
};

export default function ActionPanel({ me, isMyTurn, act, gameData }) {
  const [mode, setMode] = useState('move'); // move | attack | bomb_wall | bomb_mine | check_wall | check_cell | melee

  const disabled = !isMyTurn || !me || me.actionPoints < 1;
  const actRef = useRef(act);
  useEffect(() => { actRef.current = act; }, [act]);

  const cell = gameData?.maze?.cells?.[me?.y]?.[me?.x];
  const onArsenal = cell?.type === 'arsenal';
  const onHospital = cell?.type === 'hospital';

  useEffect(() => {
    const KEY_DIR = {
      w: 'top', d: 'right', s: 'bottom', a: 'left',
      ц: 'top', в: 'right', ы: 'bottom', ф: 'left',
    };
    const handler = (e) => {
      const key = e.key.toLowerCase();
      
      if (key === 'f' || key === 'а') {
        if (!disabled && mode === 'bomb_wall') actRef.current('action:use_bomb', { mode: 'mine' });
        return;
      }

      const MODE_KEYS = { '1': 'move', '2': 'attack', '3': 'bomb_wall', '4': 'check' };
      if (MODE_KEYS[key]) {
        setMode(MODE_KEYS[key]);
        return;
      }
      if (key === 'g' || key === 'п') {
        actRef.current('action:end_turn');
        return;
      }
      if (key === 'q' || key === 'й') {
        if (onArsenal) actRef.current('action:use_arsenal');
        else if (onHospital) actRef.current('action:use_hospital', { choice: 'heal' });
        return;
      }
      if ((key === 'e' || key === 'у') && onHospital) {
        actRef.current('action:use_hospital', { choice: 'medkit' });
        return;
      }

      const dir = KEY_DIR[key];
      if (!dir || disabled) return;
      if (mode === 'move') actRef.current('action:move', { direction: dir });
      else if (mode === 'attack') actRef.current('action:attack', { direction: dir });
      else if (mode === 'bomb_wall') actRef.current('action:use_bomb', { mode: 'wall', direction: dir });
      else if (mode === 'check') {
        if (e.altKey) actRef.current('action:check_cell', { direction: dir });
        else actRef.current('action:check_wall', { direction: dir });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMyTurn, disabled, mode, onArsenal, onHospital]);

  if (!me) return null;

  const dirBtn = (dir, action, payload = {}) => (
    <button
      key={dir}
      style={{ ...styles.dirBtn, gridArea: DIR_GRID[dir], opacity: disabled ? 0.3 : 1 }}
      disabled={disabled}
      onClick={() => act(action, { direction: dir, ...payload })}
    >
      {DIR_LABEL[dir]}
    </button>
  );

  const modeBtn = (m, label, color) => (
    <button
      key={m}
      style={{ ...styles.modeBtn, borderColor: mode === m ? (color || COLOR.accent) : COLOR.dim, color: mode === m ? (color || COLOR.accent) : COLOR.dimText }}
      onClick={() => setMode(m)}
    >
      {label}
    </button>
  );

  // Check if on POI
  const onTreasure = gameData?.treasure && me.x === gameData.treasure?.x && me.y === gameData.treasure?.y;
  const hasTreasure = me.hasTreasure;
  const hasMedkit = me.items?.includes('medkit');

  const hasCellmate = gameData?.visiblePlayers?.some(p => p.x === me.x && p.y === me.y);

  return (
    <div style={styles.root}>
      {/* Mode selector */}
      <div style={styles.modeRow}>
        {modeBtn('move', '[1] MOVE', COLOR.accent)}
        {modeBtn('attack', '[2] ATTACK', '#ff4488')}
        {modeBtn('bomb_wall', '[3] BOMB', COLOR.warn)}
        {modeBtn('check', '[4] CHECK', '#aaa')}
      </div>

      {/* Direction pad */}
      {['move', 'attack', 'bomb_wall', 'check'].includes(mode) && (
        <>
          <div style={styles.dpad}>
            {DIRS.map(dir => {
              if (mode === 'move') return dirBtn(dir, 'action:move');
              if (mode === 'attack') return dirBtn(dir, 'action:attack');
              if (mode === 'bomb_wall') return dirBtn(dir, 'action:use_bomb', { mode: 'wall' });
              if (mode === 'check') return dirBtn(dir, 'action:check_wall');
              return null;
            })}
            <div style={styles.dpadCenter}>
              {mode === 'move' ? '✦' : mode === 'attack' ? '⚡' : mode === 'bomb_wall' ? '💥' : '?'}
            </div>
          </div>
          <div style={{ fontSize: '13px', letterSpacing: '1px', textAlign: 'center', height: '14px', color: COLOR.danger }}>
            {mode === 'bomb_wall' ? '[F] — PLANT MINE' : ''}
          </div>
        </>
      )}

      {/* End turn */}
      <button
        style={{ ...styles.endBtn, opacity: isMyTurn ? 1 : 0.3 }}
        disabled={!isMyTurn}
        onClick={() => act('action:end_turn')}
      >
        [G] END TURN
      </button>

      {/* Contextual actions */}
      <div style={styles.contextRow}>
        {/* Melee if ranged weapon */}
        {hasCellmate && <ActionBtn label="MELEE" disabled={disabled} onClick={() => act('action:melee')} />}

        {onArsenal && <ActionBtn label="[Q] ARSENAL" color={COLOR.warn} disabled={disabled} onClick={() => act('action:use_arsenal')} />}

        {onHospital && <>
          <ActionBtn label="[Q] HEAL" color='#ff4488' disabled={disabled} onClick={() => act('action:use_hospital', { choice: 'heal' })} />
          <ActionBtn label="[E] MEDKIT" color='#ff4488' disabled={disabled} onClick={() => act('action:use_hospital', { choice: 'medkit' })} />
        </>}

        {hasMedkit && <ActionBtn label="USE MEDKIT" color='#ff4488' disabled={disabled} onClick={() => act('action:use_medkit')} />}

        {onTreasure && !hasTreasure && !gameData?.treasure?.isBuried &&
          <ActionBtn label="PICK UP A TREASURE" color="#ffd700" disabled={disabled} onClick={() => act('action:treasure', { action: 'pickup' })} />}

        {onTreasure && !hasTreasure && gameData?.treasure?.isBuried &&
          <ActionBtn label="DIG UP A TREASURE" color="#ffd700" disabled={disabled} onClick={() => act('action:treasure', { action: 'dig' })} />}

        {hasTreasure &&
          <ActionBtn label="BURY A TREASURE" color="#ffd700" disabled={disabled} onClick={() => act('action:treasure', { action: 'bury' })} />}
      </div>
    </div>
  );
}

function ActionBtn({ label, onClick, disabled, color }) {
  return (
    <button
      style={{ ...styles.ctxBtn, opacity: disabled ? 0.3 : 1, borderColor: color || '#444', color: color || '#888' }}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

const styles = {
  root: {
    padding: '10px 12px',
    borderBottom: `1px solid ${COLOR.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  modeRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  modeBtn: {
    background: 'none',
    border: '1px solid',
    padding: '3px 6px',
    fontSize: '12px',
    letterSpacing: '1px',
    cursor: 'pointer',
    borderRadius: '2px',
    transition: 'all 0.15s',
  },
  dpad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 36px)',
    gridTemplateRows: 'repeat(3, 36px)',
    gap: '3px',
    alignSelf: 'center',
    marginTop: '4px',
  },
  dpadCenter: {
    gridArea: '2/2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#333',
    fontSize: '18px',
  },
  dirBtn: {
    background: '#1a1a1a',
    border: `1px solid ${COLOR.dim}`,
    color: COLOR.accent,
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '2px',
    transition: 'background 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleAction: {
    display: 'flex',
    justifyContent: 'center',
  },
  contextRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  ctxBtn: {
    background: 'none',
    border: '1px solid',
    padding: '3px 8px',
    fontSize: '13px',
    letterSpacing: '1px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  endBtn: {
    background: 'none',
    border: `1px solid #333`,
    color: '#555',
    padding: '6px',
    fontSize: '13px',
    letterSpacing: '2px',
    cursor: 'pointer',
    borderRadius: '2px',
    width: '100%',
    transition: 'all 0.15s',
  },
};
