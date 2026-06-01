import EventLog from './EventLog';

const CLASS_DATA = {
  pinkerton: {
    name: 'Eugene',
    title: 'Pinkerton',
    initials: 'YJ',
    color: '#c8ff00',
    weapon: 'Revolver',
    passives: [
      'Чувствует существ в 3x3',
      'Бесшумное столкновение',
      'Не тратит ОД на поиск выхода',
      '1x перебросить кубик',
    ],
  },
  reaper: {
    name: 'Лютер',
    title: 'Жнец',
    initials: 'LT',
    color: '#aa44ff',
    weapon: 'Кинжал',
    passives: ['Прыжок через стену (1 ОД)', 'Удар после прыжка бесплатно', '+0.5 урона после прыжка'],
  },
  witch: {
    name: 'Вивиан',
    title: 'Ведьма',
    initials: 'VV',
    color: '#ff44cc',
    weapon: 'Магия',
    passives: ['Использует ману вместо патронов', 'Телепортация', 'Создание бомбы без ОД'],
  },
  pyroman: {
    name: 'Клаус',
    title: 'Пироман',
    initials: 'KL',
    color: '#ff6600',
    weapon: 'Взрывной пистолет',
    passives: ['Пробивает 1 стену', 'Коктейль Молотова (1 ОД)'],
  },
  amazon: {
    name: 'Астрея',
    title: 'Амазонка',
    initials: 'AS',
    color: '#00ccff',
    weapon: 'Гранатомёт',
    passives: ['Барс (1 хп, 1 ОД/ход)', 'Барс с бомбой взрывается при столкновении'],
  },
  succubus: {
    name: 'Лилит',
    title: 'Суккуб',
    initials: 'LL',
    color: '#ff2266',
    weapon: 'Парные пистолеты',
    passives: ['2 патрона за выстрел', 'Соблазнение игрока (3×)'],
  },
  werewolf: {
    name: 'Фенрир',
    title: 'Оборотень',
    initials: 'FN',
    color: '#88aaff',
    weapon: 'Когти / Мушкетон',
    passives: ['Смена формы (1 ОД)', 'В форме зверя: усиленный ближний бой'],
  },
  trickster: {
    name: 'Шарлотта',
    title: 'Плутовка',
    initials: 'SH',
    color: '#ffcc00',
    weapon: 'Пистоль',
    passives: ['Копия на клетке (1 ОД)', 'Перемещение после атаки бесплатно'],
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
            <div style={{ ...styles.portrait, borderColor: cls.color, boxShadow: `0 0 24px ${cls.color}33` }}>
              <div style={{ ...styles.initials, color: cls.color }}>{cls.initials}</div>
              <div style={{ ...styles.portraitGlow, background: `radial-gradient(circle at 50% 60%, ${cls.color}22 0%, transparent 70%)` }} />
            </div>
            <div style={styles.nameBlock}>
              <div style={{ ...styles.charName, color: cls.color }}>{cls.name}</div>
              <div style={styles.charTitle}>«{cls.title}»</div>
            </div>

            {/* Weapon */}
            <div style={styles.infoBlock}>
              <div style={styles.infoLabel}>ОРУЖИЕ</div>
              <div style={styles.infoValue}>{cls.weapon}</div>
            </div>

            {/* Passives */}
            <div style={styles.infoBlock}>
              <div style={styles.infoLabel}>ПАССИВКИ</div>
              {cls.passives.map((p, i) => (
                <div key={i} style={styles.passive}>
                  <span style={{ color: cls.color, marginRight: '6px' }}>›</span>{p}
                </div>
              ))}
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
    padding: '16px 14px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0,
  },
  portrait: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '2px solid',
    alignSelf: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    background: '#111',
    overflow: 'hidden',
  },
  portraitGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
  },
  initials: {
    fontSize: '26px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    position: 'relative',
    zIndex: 1,
  },
  nameBlock: {
    textAlign: 'center',
  },
  charName: {
    fontSize: '18px',
    fontWeight: 'bold',
    letterSpacing: '3px',
  },
  charTitle: {
    fontSize: '10px',
    color: '#555',
    letterSpacing: '2px',
    marginTop: '2px',
  },
  infoBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  infoLabel: {
    fontSize: '8px',
    letterSpacing: '2px',
    color: '#444',
    marginBottom: '2px',
  },
  infoValue: {
    fontSize: '11px',
    color: '#aaa',
    letterSpacing: '1px',
  },
  passive: {
    fontSize: '10px',
    color: '#777',
    lineHeight: '1.5',
  },
  divider: {
    height: '1px',
    background: '#1e1e1e',
    flexShrink: 0,
    margin: '0 0',
  },
  logWrap: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  noChar: {
    color: '#333',
    textAlign: 'center',
    fontSize: '20px',
    padding: '20px 0',
  },
};
