import { useState } from 'react';

const DIRS = ['top', 'right', 'bottom', 'left'];
const DIR_LABEL = { top: '↑', right: '→', bottom: '↓', left: '←' };
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

  if (!me) return null;
  const disabled = !isMyTurn || me.actionPoints < 1;

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
  const cell = gameData?.maze?.cells?.[me.y]?.[me.x];
  const onArsenal = cell?.type === 'arsenal';
  const onHospital = cell?.type === 'hospital';
  const onTreasure = gameData?.treasure && me.x === gameData.treasure?.x && me.y === gameData.treasure?.y;
  const hasTreasure = me.hasTreasure;
  const hasMedkit = me.items?.includes('medkit');

  return (
    <div style={styles.root}>
      {/* Mode selector */}
      <div style={styles.modeRow}>
        {modeBtn('move', 'ДВИЖ', COLOR.accent)}
        {modeBtn('attack', 'АТАКА', '#ff4488')}
        {modeBtn('bomb_wall', 'ВЗРЫВ', COLOR.warn)}
        {modeBtn('bomb_mine', 'МИНА', COLOR.danger)}
        {modeBtn('check_wall', 'СТ?', '#aaa')}
        {modeBtn('check_cell', 'КЛ?', '#aaa')}
      </div>

      {/* Direction pad */}
      {['move', 'attack', 'bomb_wall', 'check_wall', 'check_cell'].includes(mode) && (
        <div style={styles.dpad}>
          {DIRS.map(dir => {
            if (mode === 'move') return dirBtn(dir, 'action:move');
            if (mode === 'attack') return dirBtn(dir, 'action:attack');
            if (mode === 'bomb_wall') return dirBtn(dir, 'action:use_bomb', { mode: 'wall' });
            if (mode === 'check_wall') return dirBtn(dir, 'action:check_wall');
            if (mode === 'check_cell') return dirBtn(dir, 'action:check_cell');
            return null;
          })}
          <div style={styles.dpadCenter}>
            {mode === 'move' ? '✦' : mode === 'attack' ? '⚡' : mode === 'bomb_wall' ? '💥' : '?'}
          </div>
        </div>
      )}

      {/* Mine mode */}
      {mode === 'bomb_mine' && (
        <div style={styles.singleAction}>
          <button
            style={{ ...styles.bigBtn, opacity: (disabled || me.bombs < 1) ? 0.3 : 1 }}
            disabled={disabled || me.bombs < 1}
            onClick={() => act('action:use_bomb', { mode: 'mine' })}
          >
            ЗАЛОЖИТЬ МИНУ
          </button>
        </div>
      )}

      {/* Contextual actions */}
      <div style={styles.contextRow}>
        {/* Melee if ranged weapon */}
        <ActionBtn label="РУКОП." disabled={disabled} onClick={() => act('action:melee')} />

        {onArsenal && <ActionBtn label="АРСЕНАЛ" color={COLOR.warn} disabled={disabled} onClick={() => act('action:use_arsenal')} />}

        {onHospital && <>
          <ActionBtn label="ЛЕЧЕНИЕ" color='#ff4488' disabled={disabled} onClick={() => act('action:use_hospital', { choice: 'heal' })} />
          <ActionBtn label="АПТЕЧКА" color='#ff4488' disabled={disabled} onClick={() => act('action:use_hospital', { choice: 'medkit' })} />
        </>}

        {hasMedkit && <ActionBtn label="ИСПОЛЬ. АПТЕЧКУ" color='#ff4488' disabled={disabled} onClick={() => act('action:use_medkit')} />}

        {onTreasure && !hasTreasure && !gameData?.treasure?.isBuried &&
          <ActionBtn label="ПОДОБРАТЬ КЛАД" color="#ffd700" disabled={disabled} onClick={() => act('action:treasure', { action: 'pickup' })} />}

        {onTreasure && !hasTreasure && gameData?.treasure?.isBuried &&
          <ActionBtn label="ВЫКОПАТЬ КЛАД" color="#ffd700" disabled={disabled} onClick={() => act('action:treasure', { action: 'dig' })} />}

        {hasTreasure &&
          <ActionBtn label="ЗАКОПАТЬ КЛАД" color="#ffd700" disabled={disabled} onClick={() => act('action:treasure', { action: 'bury' })} />}
      </div>

      {/* End turn */}
      <button
        style={{ ...styles.endBtn, opacity: isMyTurn ? 1 : 0.3 }}
        disabled={!isMyTurn}
        onClick={() => act('action:end_turn')}
      >
        ЗАВЕРШИТЬ ХОД
      </button>
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
    fontFamily: "'Courier New', monospace",
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
    fontSize: '9px',
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
  },
  dpadCenter: {
    gridArea: '2/2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#333',
    fontSize: '14px',
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
  bigBtn: {
    background: '#1a0000',
    border: `1px solid ${COLOR.danger}`,
    color: COLOR.danger,
    padding: '8px 20px',
    fontSize: '11px',
    letterSpacing: '2px',
    cursor: 'pointer',
    borderRadius: '2px',
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
    fontSize: '9px',
    letterSpacing: '1px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  endBtn: {
    background: 'none',
    border: `1px solid #333`,
    color: '#555',
    padding: '6px',
    fontSize: '9px',
    letterSpacing: '2px',
    cursor: 'pointer',
    borderRadius: '2px',
    width: '100%',
    transition: 'all 0.15s',
  },
};
