import { useEffect, useState, useCallback, useRef } from 'react';
import socket from './socket';
import MazeCanvas from './components/MazeCanvas';
import GameUI from './components/GameUI';
import ActionPanel from './components/ActionPanel';
import EventLog from './components/EventLog';
import CharacterPanel from './components/CharacterPanel';
import NotificationPanel from './components/NotificationPanel';

const INITIAL_STATE = {
  screen: 'waiting',
  gameData: null,
  myId: null,
  currentTurn: null,
  winner: null,
  winReason: null,
  events: [],
  notification: null,
};

const COLOR = {
  bg: '#0e0c09',
  border: '#4a3a22',
  text: '#a89070',
  textDim: '#c8c0b0',
  accent: '#c8a84b',
  danger: '#8b2020',
  warn: '#8a6020',
  heal: '#4a7a3a',
  miss: '#aaaaaa',
  explosion: '#8a4010',
  debuffW: '#c8860a',
  debuffS: '#2e6a8a',
  debuffP: '#8b1a1a',
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [targetId, setTargetId] = useState(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [mouseDir, setMouseDir] = useState('bottom');
  const pendingActionRef = useRef(null);

  const addEvent = useCallback((msg) => {
    setState(s => ({ ...s, events: [...s.events.slice(-49), msg] }));
  }, []);

  const myIdRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      myIdRef.current = socket.id;
      setState(s => ({ ...s, myId: socket.id }));
    });

    socket.on('game:state', (data) => {
      setState(s => ({
        ...s,
        screen: data.status === 'finished' ? 'over' : 'game',
        gameData: data,
      }));
    });

    socket.on('game:turn', ({ playerId, playerIndex }) => {
      setState(s => ({ ...s, currentTurn: { playerId, playerIndex } }));
    });

    socket.on('game:over', ({ winner, reason }) => {
      setState(s => ({ ...s, screen: 'over', winner, winReason: reason }));
      addEvent(`🏆 Game is over. Winner: ${winner}. WinCon: ${reason}`);
    });

    socket.on('game:event', (ev) => {
      const note = makeNotification(ev, myIdRef.current);
      if (note) setState(s => ({ ...s, notification: note }));
      const msg = formatEvent(ev, myIdRef.current);
      if (msg) addEvent(msg);
    });

    return () => {
      socket.off('connect');
      socket.off('game:state');
      socket.off('game:turn');
      socket.off('game:over');
      socket.off('game:event');
    };
  }, [addEvent]);

  const isMyTurn = state.currentTurn?.playerId === state.myId;

  const { gameData, myId, currentTurn, events } = state;
  const me = gameData?.you;

  const act = useCallback((event, payload = {}) => {
    if (!isMyTurn) return;
    if (event === 'action:move' && me?.hasTreasure && gameData?.exit) {
      const { direction } = payload;
      if (direction === gameData.exit.direction && me.x === gameData.exit.x && me.y === gameData.exit.y) {
        pendingActionRef.current = { event, payload };
        setConfirmExit(true);
        return;
      }
    }
    socket.emit(event, payload);
  }, [isMyTurn, me, gameData]);
  
  const cellmates = gameData?.visiblePlayers?.filter(p => p.x === gameData?.you?.x && p.y === gameData?.you?.y) ?? [];
  const effectiveTargetId = cellmates.find(p => p.id === targetId)?.id ?? cellmates[0]?.id ?? null;

  return (
    <div style={styles.root}>
      {/* Left bar — character info + log */}
      <div style={styles.leftbar}>
        {state.screen === 'game'
          ? <CharacterPanel me={me} events={events} />
          : <EventLog events={events} />
        }
      </div>

      {/* Canvas */}
      <div style={styles.canvasArea}>
        {state.screen === 'waiting' && <WaitingScreen />}
        {state.screen === 'game' && <MazeCanvas gameData={gameData} myId={myId} targetId={effectiveTargetId} mouseDir={mouseDir} setMouseDir={setMouseDir} />}
        {state.screen === 'over' && <OverScreen winner={state.winner} myId={myId} reason={state.winReason} />}
      </div>

      {/* Right bar — stats + actions */}
      <div style={styles.rightbar}>
        {state.screen === 'game' && <>
          <GameUI me={me} isMyTurn={isMyTurn} currentTurn={currentTurn} />
          <div style={styles.divider} />
          <ActionPanel me={me} isMyTurn={isMyTurn} act={act} gameData={gameData} targetId={effectiveTargetId} setTargetId={setTargetId} setMouseDir={setMouseDir} />
          <div style={styles.divider} />
          <NotificationPanel notification={state.notification} />
        </>}
      </div>

      {confirmExit && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>LEAVE THE MAZE?</div>
            <div style={styles.modalSub}>You have the treasure. This ends the game.</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button style={styles.modalBtnConfirm} onClick={() => {
                socket.emit(pendingActionRef.current.event, pendingActionRef.current.payload);
                setConfirmExit(false);
              }}>YES, LEAVE</button>
              <button style={styles.modalBtnCancel} onClick={() => setConfirmExit(false)}>STAY</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WaitingScreen() {
  return (
    <div style={styles.center}>
      <div style={styles.waitBox}>
        <div style={styles.waitTitle}>THE MAZE</div>
        <div style={styles.waitSub}>Waiting for players...</div>
        <div style={styles.waitDots}>
          <span style={{...styles.dot, animationDelay:'0s'}} />
          <span style={{...styles.dot, animationDelay:'0.2s'}} />
          <span style={{...styles.dot, animationDelay:'0.4s'}} />
        </div>
      </div>
      <style>{dotAnim}</style>
    </div>
  );
}

function OverScreen({ winner, myId, reason }) {
  const won = winner === myId;
  return (
    <div style={styles.center}>
      <div style={styles.overBox}>
        <div style={{...styles.overTitle, color: won ? COLOR.accent : COLOR.danger}}>
          {won ? 'WINNER' : 'LOSER'}
        </div>
        <div style={styles.overSub}>{reasonLabel(reason)}</div>
      </div>
    </div>
  );
}

function formatEvent(ev, myId) {
  const DIR = { top: '↑', right: '→', bottom: '↓', left: '←' };
  const isMe = ev.playerId === myId;
  const isTarget = ev.targetId === myId;

  switch (ev.event) {
    case 'moved':
      if (!isMe) return null;
      return `Moved ${DIR[ev.direction] ?? ''}`;
    case 'move_blocked':
      if (!isMe) return null;
      return `Wall ${DIR[ev.direction] ?? ''}${ev.isEdge ? ' (outer)' : ''}`;
    case 'exit_found':
      if (!isMe) return null;
      return `Exit found ${DIR[ev.direction] ?? ''}`;
    case 'wall_checked':
      if (!isMe) return null;
      return ev.isExit ? `Exit ${DIR[ev.direction] ?? ''}` : ev.hasWall ? `Wall ${DIR[ev.direction] ?? ''}` : `Passage ${DIR[ev.direction] ?? ''}`;
    case 'cell_checked':
      if (!isMe) return null;
      return ev.content ? `Cell ${DIR[ev.direction] ?? ''}: DANGER (${ev.content})` : `Cell ${DIR[ev.direction] ?? ''}: clear`;
    case 'attack':
      if (isMe) return ev.hit ? `Shot — ${ev.damage} dmg${ev.debuff ? ` [${ev.debuff}]` : ''}${ev.died ? ' 💀' : ''}` : `Shot — miss`;
      if (isTarget) return ev.hit ? `Shot at you — ${ev.damage} dmg${ev.debuff ? ` [${ev.debuff}]` : ''}` : `Someone shot at you — miss`;
      return null;
    case 'melee':
      if (isMe) return ev.hit ? `Melee — ${ev.damage} dmg${ev.died ? ' 💀' : ''}` : `Melee — miss`;
      if (isTarget) return ev.hit ? `Melee hit at you — ${ev.damage} dmg` : `Melee hit at you — miss`;
      return null;
    case 'mine_triggered': {
      const inVictims = ev.victims?.find(v => v.id === myId);
      if (!inVictims && ev.playerId !== myId) return null;
      return `Mine! -1.5 HP${ev.died ? ' 💀' : ''}`;
    }
    case 'bomb_used':
      if (!isMe) return null;
      return ev.mode === 'wall' ? `Wall blown ${DIR[ev.direction] ?? ''}` : `Mine planted`;
    case 'arsenal_used':
      if (!isMe) return null;
      return ev.reward === 'ammo' ? `Arsenal: +2 ammo` : `Arsenal: +2 bombs`;
    case 'hospital_used':
      if (!isMe) return null;
      return ev.choice === 'heal' ? `Hospital: fully healed` : `Hospital: +1 medkit`;
    case 'medkit_used':
      if (!isMe) return null;
      return `Medkit: +1 HP`;
    case 'treasure':
      if (!isMe) return null;
      return ev.action === 'dig' ? `Treasure dug up` : ev.action === 'pickup' ? `Treasure picked up` : `Treasure dropped`;
    case 'loot': {
      if (!isMe) return null;
      const { loot } = ev;
      const parts = [];
      if (loot.ammo) parts.push(`+${loot.ammo} ammo`);
      if (loot.mana) parts.push(`+${loot.mana} mana`);
      if (loot.jumps) parts.push(`+${loot.jumps} jumps`);
      if (loot.bombs) parts.push(`+${loot.bombs} bombs`);
      if (loot.medkits) parts.push(`+${loot.medkits} medkits`);
      return `Looted: ${parts.length ? parts.join(', ') : 'nothing'}`;
    }
    case 'player_disconnected':
      return `A player disconnected`;
    default:
      return null;
  }
}

function makeNotification(ev, myId) {
  if (ev.event === 'cell_checked' && ev.playerId === myId) {
    return ev.content
      ? { text: 'DANGER!', color: COLOR.danger, sub: ev.content }
      : { text: 'SAFE!', color: COLOR.accent };
  }
  if (ev.event === 'wall_checked' && ev.playerId === myId) {
    return ev.isEdge
      ? { text: 'NOTHING...', color: COLOR.miss }
      : ev.hasWall
        ? { text: 'WALL!', color: COLOR.miss }
        : { text: 'FREE!', color: COLOR.accent };
  }
  if (ev.event === 'exit_found' && ev.playerId === myId) {
    return { text: 'EXIT DETECTED!', color: COLOR.accent };
  }
  if (ev.event === 'move_blocked' && ev.playerId === myId) {
    return ev.isEdge
      ? { text: 'NOTHING...', color: COLOR.miss }
      : { text: 'WALL!', color: COLOR.miss };
  }
  if (ev.event === 'attack' && ev.playerId === myId) {
    const debuffColor = ev.debuff === 'W' ? COLOR.debuffW : ev.debuff === 'S' ? COLOR.debuffS : ev.debuff === 'P' ? COLOR.debuffP : null;
    return ev.hit && ev.damage > 0
      ? { text: `HIT! -${ev.damage}`, color: COLOR.danger, sub: ev.debuff ? `[${ev.debuff}] ${ev.debuffTurns} turns` : null, subColor: debuffColor }
      : { text: 'MISS!', color: COLOR.miss };
  }
  if (ev.event === 'attack' && ev.targetId === myId) {
    return ev.hit
      ? { text: ev.debuff ? `-${ev.damage} HP, [${ev.debuff}] ${ev.debuffTurns} turns` : `-${ev.damage} HP`, color: COLOR.danger, sub: 'SHOT AT YOU!' }
      : { text: 'MISS!', color: COLOR.miss, sub: 'SHOT AT YOU!' };
  }
  if (ev.event === 'melee' && ev.playerId === myId) {
    return ev.hit && ev.damage > 0
      ? { text: `HIT! -${ev.damage}`, color: COLOR.danger }
      : { text: 'MISS!', color: COLOR.miss };
  }
  if (ev.event === 'melee' && ev.targetId === myId) {
    return ev.hit
      ? { text: `-${ev.damage} HP`, color: COLOR.danger, sub: 'MELEE HIT AT YOU!' }
      : { text: 'MISS!', color: COLOR.miss, sub: 'MELEE HIT AT YOU!' };
  }
  if (ev.event === 'bomb_used' && ev.playerId === myId) {
    return ev.mode === 'wall'
      ? { text: 'BOOM!', color: COLOR.explosion, sub: 'Wall blown', subColor: COLOR.miss }
      : { text: 'THE MINE IS PLANTED!', color: COLOR.explosion };
  }
  if (ev.event === 'mine_triggered') {
    const inVictims = ev.victims?.find(v => v.id === myId);
    if (inVictims || ev.playerId === myId) 
      return { text: '-1.5 HP', color: COLOR.danger, sub: 'EXPLOSION!', subColor: COLOR.explosion };
  }
  if (ev.event === 'arsenal_used' && ev.playerId === myId) {
    return { text: 'LOOTED', color: COLOR.accent, sub: ev.reward === 'ammo' ? '+2 AMMO' : '+2 BOMBS' };
  }
  if (ev.event === 'hospital_used' && ev.playerId === myId) {
    return ev.choice === 'heal'
      ? { text: 'HEALTH FULL RESTORED', color: COLOR.heal }
      : { text: '+1 MEDKIT', color: COLOR.heal };
  }
  if (ev.event === 'medkit_used' && ev.playerId === myId) {
    return { text: '+1 HP', color: COLOR.heal, sub: 'MEDKIT USED' };
  }
  return null;
}

function reasonLabel(r) {
  if (r === 'last_alive') return 'Last alive!';
  if (r === 'exit') return 'Escaped with treasure!';
  return r;
}

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: COLOR.bg,
    fontFamily: "'Spectral', serif",
    color: COLOR.text,
    overflow: 'hidden',
  },
  leftbar: {
    width: '320px',
    borderRight: `1px solid ${COLOR.border}`,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  canvasArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rightbar: {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: `1px solid ${COLOR.border}`,
    flexShrink: 0,
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  waitBox: {
    textAlign: 'center',
    fontFamily: "'Spectral', serif",
  },
  waitTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    letterSpacing: '12px',
    color: COLOR.accent,
    marginBottom: '16px',
  },
  waitSub: {
    fontSize: '18px',
    color: COLOR.textDim,
    letterSpacing: '2px',
    marginBottom: '24px',
  },
  waitDots: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: COLOR.accent,
    display: 'inline-block',
    animation: 'blink 1s infinite',
  },
  overBox: { textAlign: 'center', fontFamily: "'Spectral', serif" },
  overTitle: { fontSize: '56px', fontWeight: 'bold', letterSpacing: '8px' },
  overSub: { fontSize: '18px', color: COLOR.textDim, marginTop: '12px', letterSpacing: '2px' },
  modalOverlay: {
    position: 'fixed', inset: 0, background: COLOR.bg + 'cc', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#111', border: `1px solid ${COLOR.accent}`, padding: '24px 32px', textAlign: 'center',
  },
  modalTitle: { fontSize: '24px', fontWeight: 'bold', color: COLOR.accent, letterSpacing: '4px' },
  modalSub: { fontSize: '12px', color: COLOR.textDim, marginTop: '8px', letterSpacing: '1px' },
  modalBtnConfirm: {
    background: 'none', border: `1px solid ${COLOR.accent}`, color: COLOR.accent,
    padding: '8px 16px', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer',
  },
  modalBtnCancel: {
    background: 'none', border: `1px solid ${COLOR.border}`, color: COLOR.textDim,
    padding: '8px 16px', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer',
  },
  divider: {
    height: '1px',
    background: `linear-gradient(to right, transparent, ${COLOR.border}, transparent)`,
    margin: '10px 0',
  },
};

const dotAnim = `
  @keyframes blink {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
`;
