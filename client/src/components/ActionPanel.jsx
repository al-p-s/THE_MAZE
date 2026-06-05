import { useState, useEffect, useRef, useMemo } from 'react';

const DIRS = ['top', 'right', 'bottom', 'left'];
const DIR_LABEL = { top: 'W', right: 'D', bottom: 'S', left: 'A' };
const DIR_GRID = { top: '1/2', right: '2/3', bottom: '3/2', left: '2/1' }; // row/col

const COLOR = {
  accent: '#c8a84b',
  dim: '#3a3228',
  textDim: '#c8c0b0',
  bg: '#0e0c09',
  border: '#3a2e1e',
  danger: '#8b2020',
  heal: '#4a7a3a',
  hint: '#6a5a48',
  dirBg: '#13110e',
};

export default function ActionPanel({ me, isMyTurn, act, gameData, targetId, setTargetId, setMouseDir }) {
  const [mode, setMode] = useState('move'); // move | attack | bomb_wall | bomb_mine | check_wall | check_cell | melee

  const disabled = !isMyTurn || !me || me.actionPoints < 1;
  const actRef = useRef(act);
  useEffect(() => { actRef.current = act; }, [act]);

  const cell = gameData?.maze?.cells?.[me?.y]?.[me?.x];
  
  const onArsenal = cell?.type === 'arsenal';
  const onHospital = cell?.type === 'hospital';
  const onTreasure = gameData?.treasure &&
    !gameData.treasure.destroyed &&
    !gameData.treasure.carriedBy &&
    me?.x === gameData.treasure?.x &&
    me?.y === gameData.treasure?.y;
  const hasTreasure = me?.hasTreasure;
  const hasMedkit = me?.items?.includes('medkit');
  const corpsesHere = useMemo(
    () => gameData?.visiblePlayers?.filter(
      p => p.isDead && p.x === me?.x && p.y === me?.y
    ) ?? [],
    [gameData?.visiblePlayers, me?.x, me?.y]
  );

  useEffect(() => {
    const KEY_DIR = {
      w: 'top', d: 'right', s: 'bottom', a: 'left',
      ц: 'top', в: 'right', ы: 'bottom', ф: 'left',
    };
    const handler = (e) => {
      const key = e.key.toLowerCase();

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
      if (key === 'f' || key === 'а') {
        if (onTreasure && !hasTreasure && !gameData?.treasure?.isBuried)
          actRef.current('action:treasure', { action: 'pickup' });
        else if (onTreasure && !hasTreasure && gameData?.treasure?.isBuried)
          actRef.current('action:treasure', { action: 'dig' });
        else if (hasTreasure)
          actRef.current('action:treasure', { action: 'drop' });
        return;
      }
      if (key === 'x' || key === 'ч') {
        if (hasMedkit) actRef.current('action:use_medkit');
        return;
      }
      if (key === 'tab') {
        e.preventDefault();
        const cellmates = gameData?.visiblePlayers?.filter(p => p.x === me.x && p.y === me.y) ?? [];
        if (cellmates.length < 2) return;
        const idx = cellmates.findIndex(p => p.id === targetId);
        setTargetId(cellmates[(idx + 1) % cellmates.length].id);
        return;
      }
      if (key === 'r' || key === 'к') {
        if (targetId && !disabled) actRef.current('action:attack', { targetId });
        return;
      }
      if (key === 'c' || key === 'с') {
        if (corpsesHere.length > 0 && !disabled)
          actRef.current('action:loot', { targetId: corpsesHere[0].id });
        return;
      }

      const dir = KEY_DIR[key];
      if (!dir || disabled) return;
      if (mode === 'move') { actRef.current('action:move', { direction: dir }); setMouseDir(dir); }
      else if (mode === 'attack') {
        if (e.altKey) { actRef.current('action:melee', { targetId }); setMouseDir(dir); }
        else { actRef.current('action:attack', { direction: dir }); setMouseDir(dir); }
      }
      else if (mode === 'bomb_wall') {
        if (e.altKey) actRef.current('action:use_bomb', { mode: 'mine' });
        else { actRef.current('action:use_bomb', { mode: 'wall', direction: dir }); setMouseDir(dir); }
      }
      else if (mode === 'check') {
        if (e.altKey) { actRef.current('action:check_cell', { direction: dir }); setMouseDir(dir); }
        else { actRef.current('action:check_wall', { direction: dir }); setMouseDir(dir); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMyTurn, disabled, mode, onArsenal, onHospital, onTreasure, hasTreasure, corpsesHere, gameData?.treasure?.isBuried, hasMedkit, targetId, setTargetId, gameData, me?.x, me?.y, setMouseDir ]);

  if (!me) return null;

  const dirBtn = (dir, action, payload = {}) => (
    <button
      key={dir}
      style={{ ...styles.dirBtn, gridArea: DIR_GRID[dir], opacity: modeDisabled ? 0.3 : 1 }}
      disabled={modeDisabled}
      onClick={() => act(action, { direction: dir, ...payload })}
    >
      {DIR_LABEL[dir]}
    </button>
  );

  const modeBtn = (m, label, color) => (
    <button
      key={m}
      style={{ ...styles.modeBtn, borderColor: mode === m ? (color || COLOR.accent) : COLOR.dim, color: mode === m ? (color || COLOR.accent) : COLOR.textDim }}
      onClick={() => setMode(m)}
    >
      {label}
    </button>
  );

  const modeDisabled = disabled
    || (mode === 'bomb_wall' && me.bombs < 1);

  return (
    <div style={styles.root}>
      {/* Mode selector */}
      <div style={{ ...styles.modeRow, opacity: isMyTurn ? 1 : 0.5 }}>
        {modeBtn('move', '[1] MOVE', COLOR.accent)}
        {modeBtn('bomb_wall', '[3] BOMB', COLOR.accent)}
        {modeBtn('attack', '[2] ATTACK', COLOR.accent)}
        {modeBtn('check', '[4] CHECK', COLOR.accent)}
      </div>

      {/* Direction pad */}
      {['move', 'attack', 'bomb_wall', 'check'].includes(mode) && (
        <div style={{ position: 'relative', display: 'flex' }}>
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
          <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold',
            fontSize: '14px', opacity: modeDisabled ? 0.5 : 1, color: COLOR.textDim, lineHeight: '1.8', textAlign: 'center' }}>
            {mode === 'attack' ? <>[ALT]<br/>MELEE<br/>ATTACK</> : ''}
          </div>
          <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold',
            fontSize: '14px', opacity: modeDisabled ? 0.5 : 1, color: COLOR.textDim, lineHeight: '1.8', textAlign: 'center' }}>
            {mode === 'attack' ? <>[TAB]<br/>AIM<br/><br/>[R]<br/>POINT-BLANK</> : mode === 'bomb_wall' ? <>[ALT]<br/>PLANT<br/>MINE</> : mode === 'check' ? <>[ALT]<br/>CHECK<br/>CELL</> : ''}
          </div>
        </div>
      )}

      {/* End turn */}
      <button
        style={{ ...styles.endBtn, opacity: isMyTurn ? 1 : 0.5 }}
        disabled={!isMyTurn}
        onClick={() => act('action:end_turn')}
      >
        [G] END TURN
      </button>

      {/* Contextual actions */}
      <div style={styles.contextRow}>

        {onArsenal && <ActionBtn label="[Q] ARSENAL" color={COLOR.accent} disabled={disabled} onClick={() => act('action:use_arsenal')} />}

        {onHospital && <>
          <ActionBtn label="[Q] HEAL" color={COLOR.heal} disabled={disabled} onClick={() => act('action:use_hospital', { choice: 'heal' })} />
          <ActionBtn label="[E] GET MEDKIT" color={COLOR.heal} disabled={disabled} onClick={() => act('action:use_hospital', { choice: 'medkit' })} />
        </>}

        {hasMedkit && <ActionBtn label="[X] USE MEDKIT" color={COLOR.heal} disabled={disabled} onClick={() => act('action:use_medkit')} />}

        {onTreasure && !hasTreasure && !gameData?.treasure?.isBuried &&
          <ActionBtn label="[F] PICK UP A TREASURE" color={COLOR.accent} disabled={disabled} onClick={() => act('action:treasure', { action: 'pickup' })} />}

        {onTreasure && !hasTreasure && gameData?.treasure?.isBuried &&
          <ActionBtn label="[F] DIG UP A TREASURE" color={COLOR.accent} disabled={disabled} onClick={() => act('action:treasure', { action: 'dig' })} />}

        {hasTreasure &&
          <ActionBtn label="[F] DROP TREASURE" color={COLOR.accent} disabled={disabled} onClick={() => act('action:treasure', { action: 'drop' })} />}

        {corpsesHere.map(c => (
          <ActionBtn
            key={c.id} label={`[C] LOOT`}
            color={COLOR.accent} disabled={disabled}
            onClick={() => act('action:loot', { targetId: c.id })}
          />
        ))}
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
    padding: '4px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  modeRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px',
  },
  modeBtn: {
    fontFamily: "'Spectral', serif",
    background: 'none',
    border: '1px solid',
    padding: '3px 6px',
    fontWeight: 'bold',
    fontSize: '14px',
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
    margin: '0 auto',
  },
  dpadCenter: {
    gridArea: '2/2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLOR.textDim,
    fontSize: '18px',
  },
  dirBtn: {
    fontFamily: "'Spectral', serif",
    background: COLOR.dirBg,
    border: `1px solid ${COLOR.dim}`,
    color: COLOR.accent,
    fontWeight: 'bold',
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
    fontFamily: "'Spectral', serif",
    background: 'none',
    border: '1px solid',
    padding: '3px 8px',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '1px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  endBtn: {
    fontFamily: "'Spectral', serif",
    background: 'none',
    border: `1px solid ${COLOR.border}`,
    color: COLOR.textDim,
    padding: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '2px',
    cursor: 'pointer',
    borderRadius: '2px',
    width: '100%',
    transition: 'all 0.15s',
  },
};
