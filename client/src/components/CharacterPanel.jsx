import EventLog from './EventLog';

const COLOR = {
  accent: '#c8a84b',
  text: '#a89070',
  textDim: '#5a4a38',
  border: '#4a3a22',
  itemBg: '#13110e',
  itemBorder: '#1e1a14',
  panelBg: '#0e0c09',
  portraitBg: '#111',
  empty: '#333',
};

const CLASS_DATA = {
  pinkerton: {
    name: 'Eugene',
    title: 'Pinkerton',
    portrait: '/portraits/02_pinkerton.png',
    initials: 'EG',
    color: '#9dfff2',
    weapon: 'Pistole',
    passives: [
      'WIP',
    ],
  },
  reaper: {
    name: 'Luther',
    title: 'Reaper',
    portrait: '/portraits/01_reaper.png',
    initials: 'LT',
    color: '#a10000',
    weapon: 'Dagger',
    passives: [
      'WIP',
    ],
  },
  witch: {
    name: 'Vivian',
    title: 'Witch',
    portrait: '/portraits/03_witch.png',
    initials: 'VV',
    color: '#64b33f',
    weapon: 'Magic',
    passives: [
      'WIP',
    ],
  },
  pyromaniac: {
    name: 'Klaus',
    title: 'Pyromaniac',
    portrait: '/portraits/04_pyromaniac.png',
    initials: 'KL',
    color: '#ff4800',
    weapon: 'Explosive pistol',
    passives: [
      'WIP'
    ],
  },
  amazon: {
    name: 'Athena',
    title: 'Amazon',
    portrait: '/portraits/05_amazon.png',
    initials: 'AT',
    color: '#ffbb00',
    weapon: 'Grenade-gun',
    passives: [
      'WIP'
    ],
  },
  succubus: {
    name: 'Lilith',
    title: 'Succubus',
    portrait: '/portraits/06_succubus.png',
    initials: 'LL',
    color: '#ff0055',
    weapon: 'Dual pistols',
    passives: [
      'WIP'
    ],
  },
  werewolf: {
    name: 'Fenrir',
    title: 'Werewolf',
    portrait: '/portraits/07_werewolf.png',
    initials: 'FN',
    color: '#c9abab',
    weapon: 'Claws / Blunderbuss',
    passives: [
      'WIP'
    ],
  },
  trickster: {
    name: 'Charlotte',
    title: 'Cutie',
    portrait: '/portraits/08_trickster.png',
    initials: 'CR',
    color: '#9200d6',
    weapon: 'Revolver',
    passives: [
      'WIP'
    ],
  },
};

export default function CharacterPanel({ me, events }) {
  const cls = me ? (CLASS_DATA[me.className] ?? CLASS_DATA.pinkerton) : null;

  return (
    <div style={styles.root}>
      {/* Portrait */}
      <div style={styles.portraitSection}>
        {cls ? (
          <>
            <div style={styles.portraitFrame}>
              <img
                src={cls.portrait}
                alt={cls.name}
                style={styles.portraitImage}
              />
            </div>
            <div style={styles.nameBlock}>
              <div style={styles.charName}>{cls.name}</div>
              <div style={styles.charTitle}>«{cls.title}»</div>
            </div>

            <div style={styles.sectionDivider} />

            {/* Weapon */}
            <div style={styles.infoBlock}>
              <div style={styles.sectionLabel}>WEAPON</div>

              <div style={styles.invItem}>
                <span style={styles.invSymbol}>◆</span>
                <span style={styles.invText}>{cls.weapon}</span>
              </div>
            </div>

            {/* Passives */}
            <div style={styles.infoBlock}>
              <div style={styles.sectionLabel}>PASSIVES</div>

              <div style={styles.passiveRow}>
                {cls.passives.map((p, i) => (
                  <span key={i} style={styles.passiveTag}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={styles.noChar}>—</div>
        )}
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Event log */}
      <div style={styles.logWrap}>
        <EventLog events={events} />
      </div>
    </div>
  );
}

const styles = {
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Courier New', monospace",
    overflow: 'hidden',
  },
  portraitSection: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0,
  },
  nameBlock: {
    textAlign: 'center',
  },
  portraitFrame: {
    width: '100%',
    aspectRatio: '1 / 1',
    border: `1px solid ${COLOR.border}`,
    padding: '6px',
    background: COLOR.itemBg,
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: `inset 0 0 0 1px ${COLOR.border}55`,
  },
  portraitImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    filter: 'brightness(0.9) contrast(1.05)',
  },
  charName: {
    fontSize: '28px',
    letterSpacing: '6px',
    color: COLOR.accent,
    fontFamily: "'Cinzel', serif",
    textTransform: 'uppercase',
  },
  charTitle: {
    fontSize: '14px',
    letterSpacing: '3px',
    color: COLOR.textDim,
    marginTop: '2px',
  },
  infoBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  infoLabel: {
    fontSize: '15px',
    letterSpacing: '2px',
    color: COLOR.textDim,
    marginBottom: '2px',
  },
  infoValue: {
    fontSize: '15px',
    color: COLOR.text,
    letterSpacing: '1px',
  },
  passive: {
    fontSize: '13px',
    color: COLOR.textDim,
    lineHeight: '1.5',
  },
  divider: {
    height: '1px',
    background: `linear-gradient(to right, transparent, ${COLOR.border}, transparent)`,
    flexShrink: 0,
    margin: '0',
  },
  logWrap: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  noChar: {
    color: COLOR.empty,
    textAlign: 'center',
    fontSize: '20px',
    padding: '20px 0',
  },
  sectionLabel: {
    fontSize: '9px',
    letterSpacing: '3px',
    color: COLOR.textDim,
    marginBottom: '6px',
    fontFamily: "'Cinzel', serif",
    textTransform: 'uppercase',
  },
  sectionDivider: {
    height: '1px',
    background: `linear-gradient(to right, transparent, ${COLOR.border}, transparent)`,
    margin: '4px 0 8px',
  },
  invItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    background: COLOR.itemBg,
    border: `1px solid ${COLOR.itemBorder}`,
  },
  invSymbol: {
    color: COLOR.accent,
    width: '16px',
    fontSize: '12px',
  },
  invText: {
    color: COLOR.text,
    fontSize: '12px',
    fontFamily: "'Spectral', serif",
  },
  passiveRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  passiveTag: {
    fontSize: '10px',
    padding: '2px 5px',
    border: `1px solid ${COLOR.border}`,
    color: COLOR.text,
    letterSpacing: '1px',
    fontFamily: "'Cinzel', serif",
  },
};
