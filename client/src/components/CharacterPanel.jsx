import EventLog from './EventLog';

const COLOR = {
  accent: '#c8a84b',
  text: '#a89070',
  textDim: '#c8c0b0',
  border: '#4a3a22',
  itemBg: '#13110e',
  itemBorder: '#1e1a14',
  panelBg: '#0e0c09',
  portraitBg: '#111',
  empty: '#333',
};

const CLASS_DATA = {
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
  obsessed: {
    name: 'Klaus',
    title: 'Obsessed',
    portrait: '/portraits/04_obsessed.png',
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

            <div style={styles.ornamentDivider}>
              <div style={styles.ornamentLine} />
              <span style={styles.ornamentDiamond}> ◇ </span>
              <div style={styles.ornamentLine} />
            </div>

            {/* Weapon */}
            <div style={styles.infoBlock}>
              <div style={styles.sectionLabel}>WEAPON</div>
              <div style={styles.passiveRow}>
                <span style={styles.passiveTag}>{cls.weapon}</span>
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
    filter: 'brightness(1.0) contrast(1.05)',
  },
  charName: {
    fontSize: '28px',
    fontWeight: 'bold',
    fontFamily: "'Cinzel', serif",
    letterSpacing: '6px',
    color: COLOR.accent,
    textTransform: 'uppercase',
  },
  charTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    fontFamily: "'Cinzel', serif",
    letterSpacing: '3px',
    color: COLOR.textDim,
    marginTop: '2px',
  },
  infoBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
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
    fontSize: '14px',
    fontWeight: 'bold',
    fontFamily: "'Cinzel', serif",
    letterSpacing: '3px',
    color: COLOR.textDim,
    marginBottom: '6px',
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
  invText: {
    color: COLOR.text,
    fontSize: '14px',
    fontWeight: 'bold',
  },
  passiveRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  passiveTag: {
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '2px 5px',
    color: COLOR.text,
    letterSpacing: '1px',
    background: COLOR.itemBg,
    border: `1px solid ${COLOR.itemBorder}`,
  },
  ornamentDivider: {
    display: 'flex',
    alignItems: 'center',
    margin: '6px 0 10px',
  },
  ornamentLine: {
    flex: 1,
    height: '1px',
    background: `linear-gradient(
      to right,
      transparent,
      ${COLOR.border},
      transparent
    )`,
  },
  ornamentDiamond: {
    margin: '0 8px',
    color: COLOR.text,
    fontSize: '11px',
  },
};
