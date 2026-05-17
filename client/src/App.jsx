import { useEffect, useState, useCallback } from 'react';
import socket from './socket';
import MazeCanvas from './components/MazeCanvas';
import GameUI from './components/GameUI';
import ActionPanel from './components/ActionPanel';
import EventLog from './components/EventLog';

const INITIAL_STATE = {
  screen: 'waiting', // waiting | game | over
  gameData: null,    // последний game:state от сервера
  myId: null,
  currentTurn: null, // { playerId, playerIndex }
  winner: null,
  winReason: null,
  events: [],        // лог событий
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);

  const addEvent = useCallback((msg) => {
    setState(s => ({ ...s, events: [...s.events.slice(-49), msg] }));
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      setState(s => ({ ...s, myId: socket.id }));
    });

    socket.on('game:state', (data) => {
      console.log('cellmates', data.cellmates);
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
      addEvent(`🏆 Игра окончена. Победитель: ${winner}. Причина: ${reason}`);
    });

    socket.on('game:event', (ev) => {
      addEvent(formatEvent(ev));
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

  // Действия
  const act = useCallback((event, payload = {}) => {
    if (!isMyTurn) return;
    socket.emit(event, payload);
  }, [isMyTurn]);

  const { gameData, myId, currentTurn, events } = state;
  const me = gameData?.you;

  return (
    <div style={styles.root}>
      <div style={styles.leftbar} />
      <div style={styles.canvasArea}>
        {state.screen === 'waiting' && <WaitingScreen />}
        {state.screen === 'game' && <MazeCanvas gameData={gameData} myId={myId} />}
        {state.screen === 'over' && <OverScreen winner={state.winner} myId={myId} reason={state.winReason} />}
      </div>
      <div style={styles.rightbar}>
        {state.screen === 'game' && <>
          <GameUI me={me} isMyTurn={isMyTurn} currentTurn={currentTurn} />
          <ActionPanel me={me} isMyTurn={isMyTurn} act={act} gameData={gameData} />
          <EventLog events={events} />
        </>}
      </div>
    </div>
  );
}

function WaitingScreen() {
  return (
    <div style={styles.center}>
      <div style={styles.waitBox}>
        <div style={styles.waitTitle}>THE MAZE</div>
        <div style={styles.waitSub}>Ожидание игроков...</div>
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
        <div style={{...styles.overTitle, color: won ? '#c8ff00' : '#ff4444'}}>
          {won ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}
        </div>
        <div style={styles.overSub}>{reasonLabel(reason)}</div>
      </div>
    </div>
  );
}

function formatEvent(ev) {
  const id = ev.playerId ? `#${ev.playerId.slice(0,4)}` : '';
  switch (ev.event) {
    case 'moved': return `${id} перемещается`;
    case 'move_blocked': return `${id} упирается в стену`;
    case 'attack': return ev.hit
      ? `${id} атакует → ${ev.damage} урон${ev.debuff ? ` [${ev.debuff}]` : ''}${ev.died ? ' 💀' : ''}`
      : `${id} промахивается`;
    case 'melee': return ev.hit
      ? `${id} рукопашная → ${ev.damage} урон${ev.died ? ' 💀' : ''}`
      : `${id} рукопашная — промах`;
    case 'bomb_used': return `${id} использует бомбу (${ev.mode})`;
    case 'mine_triggered': return `${id} попадает на мину 💥${ev.died ? ' 💀' : ''}`;
    case 'arsenal_used': return `${id} обыскивает арсенал → ${ev.reward}`;
    case 'hospital_used': return `${id} использует госпиталь → ${ev.choice}`;
    case 'medkit_used': return `${id} использует аптечку`;
    case 'treasure': return `${id} → клад: ${ev.action}`;
    case 'exit_found': return `${id} нашёл выход!`;
    case 'cell_checked': return `${id} проверяет клетку`;
    case 'wall_checked': return `${id} проверяет стену`;
    case 'player_disconnected': return `${id} отключился`;
    default: return `${id} ${ev.event}`;
  }
}

function reasonLabel(r) {
  if (r === 'last_alive') return 'Последний выживший';
  if (r === 'exit') return 'Вышел с кладом';
  return r;
}

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: '#0a0a0a',
    fontFamily: "'Courier New', monospace",
    color: '#e0e0e0',
    overflow: 'hidden',
  },
  leftbar: {
  width: '280px',
  borderRight: '1px solid #222',
  flexShrink: 0,
  },
  canvasArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rightbar: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #222',
    overflow: 'hidden',
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
    fontFamily: "'Courier New', monospace",
  },
  waitTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    letterSpacing: '12px',
    color: '#c8ff00',
    marginBottom: '16px',
  },
  waitSub: {
    fontSize: '14px',
    color: '#666',
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
    background: '#c8ff00',
    display: 'inline-block',
    animation: 'blink 1s infinite',
  },
  overBox: { textAlign: 'center', fontFamily: "'Courier New', monospace" },
  overTitle: { fontSize: '56px', fontWeight: 'bold', letterSpacing: '8px' },
  overSub: { fontSize: '14px', color: '#666', marginTop: '12px', letterSpacing: '2px' },
};

const dotAnim = `
  @keyframes blink {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
`;
