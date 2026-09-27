const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'game.log');

function logGlobal(ev, gameState) {
  const getName = (id) => {
    const p = gameState?.players.find(p => p.id === id);
    return p ? `[P${p.index}]` : `[${id?.slice(0, 4) ?? '?'}]`;
  };
  const DIR = { top: '↑', right: '→', bottom: '↓', left: '←' };
  const time = new Date().toISOString().slice(11, 19);
  let line = null;

  switch (ev.event) {
    case 'moved':
      line = `${getName(ev.playerId)} moved ${DIR[ev.direction] ?? ''}`;
      break;
    case 'move_blocked':
      line = `${getName(ev.playerId)} hit wall ${DIR[ev.direction] ?? ''}`;
      break;
    case 'attack':
      line = `${getName(ev.playerId)} → ${getName(ev.targetId)}: ${ev.hit ? `${ev.damage} dmg${ev.debuff ? ` [${ev.debuff}]` : ''}${ev.died ? ' KILLED' : ''}` : 'miss'}`;
      break;
    case 'melee':
      line = `${getName(ev.playerId)} melee → ${getName(ev.targetId)}: ${ev.hit ? `${ev.damage} dmg${ev.died ? ' KILLED' : ''}` : 'miss'}`;
      break;
    case 'mine_triggered':
      line = `${getName(ev.playerId)} hit mine (owner: ${getName(ev.mineOwner)})${ev.died ? ' KILLED' : ''}`;
      break;
    case 'bomb_used':
      line = `${getName(ev.playerId)} bomb: ${ev.mode === 'wall' ? `wall blown ${DIR[ev.direction] ?? ''}` : 'mine planted'}`;
      break;
    case 'arsenal_used':
      line = `${getName(ev.playerId)} arsenal: ${ev.reward}`;
      break;
    case 'hospital_used':
      line = `${getName(ev.playerId)} hospital: ${ev.choice}`;
      break;
    case 'treasure':
      line = `${getName(ev.playerId)} treasure: ${ev.action}`;
      break;
    case 'exit_found':
      line = `${getName(ev.playerId)} found exit`;
      break;
    case 'player_disconnected':
      line = `${getName(ev.playerId)} disconnected`;
      break;
    default:
      line = `${getName(ev.playerId)} ${ev.event}`;
  }

  if (line) {
    fs.appendFileSync(LOG_FILE, `[${time}] ${line}\n`);
  }
}

module.exports = { logGlobal };

