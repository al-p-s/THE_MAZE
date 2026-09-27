// Active classes available for random player assignment
// (Excluding werewolf and amazon until their special mechanics are ready)
const AVAILABLE_CLASSES = [
  'pinkerton',
  'reaper',
  'witch',
  'obsessed',
  'succubus',
  'cutie',
];

const CLASS_CONFIG = {
  pinkerton: { health: 3, ammo: 2, bombs: 1 },
  reaper: { health: 3, ammo: 2, bombs: 1 },
  witch: { health: 3, ammo: 2, bombs: 1 },
  obsessed: { health: 3, ammo: 2, bombs: 1 },
  succubus: { health: 3, ammo: 2, bombs: 1 },
  cutie: { health: 3, ammo: 2, bombs: 1 },
  amazon: { health: 3, ammo: 2, bombs: 1 },
  werewolf: { health: 3, ammo: 2, bombs: 1 },
};

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRandomClass(pool = AVAILABLE_CLASSES) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function assignRandomClasses(count, pool = AVAILABLE_CLASSES) {
  const result = [];
  let available = [];
  for (let i = 0; i < count; i++) {
    if (available.length === 0) {
      available = shuffle(pool);
    }
    result.push(available.pop());
  }
  return result;
}

// Таблицы броска кубика (1..6) для оружия каждого класса.
// Каждая функция принимает результат броска roll (1..6)
// и возвращает { damage, debuff, debuffTurns }.
// Возможные debuff:
//   'W' — ранение (wound)
//   'S' — оглушение (stun)
//   'P' — яд/паралич (poison/paralysis)
//   null — без дебаффа
const weaponResults = {
  // Eugene — Pistole
  pinkerton: (roll) => {
    if (roll === 1) return { damage: 0, debuff: 'W', debuffTurns: 1 };
    if (roll === 2) return { damage: 0.5, debuff: 'W', debuffTurns: 1 };
    if (roll === 3) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 4) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 5) return { damage: 1, debuff: 'S', debuffTurns: 1 };
    return { damage: 1, debuff: 'P', debuffTurns: 1 };
  },

  // Luther — Dagger
  reaper: (roll) => {
    if (roll === 1) return { damage: 0, debuff: 'W', debuffTurns: 1 };
    if (roll === 2) return { damage: 0.5, debuff: 'W', debuffTurns: 1 };
    if (roll === 3) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 4) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 5) return { damage: 1, debuff: 'S', debuffTurns: 1 };
    return { damage: 1, debuff: 'P', debuffTurns: 1 };
  },

  // Vivian — Magic
  witch: (roll) => {
    if (roll === 1) return { damage: 0, debuff: 'W', debuffTurns: 1 };
    if (roll === 2) return { damage: 0.5, debuff: 'W', debuffTurns: 1 };
    if (roll === 3) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 4) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 5) return { damage: 1, debuff: 'S', debuffTurns: 1 };
    return { damage: 1, debuff: 'P', debuffTurns: 1 };
  },

  // Klaus — Explosive pistol
  obsessed: (roll) => {
    if (roll === 1) return { damage: 0, debuff: 'W', debuffTurns: 1 };
    if (roll === 2) return { damage: 0.5, debuff: 'W', debuffTurns: 1 };
    if (roll === 3) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 4) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 5) return { damage: 1, debuff: 'S', debuffTurns: 1 };
    return { damage: 1, debuff: 'P', debuffTurns: 1 };
  },

  // Lilith — Dual pistols
  succubus: (roll) => {
    if (roll === 1) return { damage: 0, debuff: 'W', debuffTurns: 1 };
    if (roll === 2) return { damage: 0.5, debuff: 'W', debuffTurns: 1 };
    if (roll === 3) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 4) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 5) return { damage: 1, debuff: 'S', debuffTurns: 1 };
    return { damage: 1, debuff: 'P', debuffTurns: 1 };
  },

  // Charlotte — Revolver
  cutie: (roll) => {
    if (roll === 1) return { damage: 0, debuff: 'W', debuffTurns: 1 };
    if (roll === 2) return { damage: 0.5, debuff: 'W', debuffTurns: 1 };
    if (roll === 3) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 4) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 5) return { damage: 1, debuff: 'S', debuffTurns: 1 };
    return { damage: 1, debuff: 'P', debuffTurns: 1 };
  },

  // Athena — Grenade-gun
  amazon: (roll) => {
    if (roll === 1) return { damage: 0, debuff: 'W', debuffTurns: 1 };
    if (roll === 2) return { damage: 0.5, debuff: 'W', debuffTurns: 1 };
    if (roll === 3) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 4) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 5) return { damage: 1, debuff: 'S', debuffTurns: 1 };
    return { damage: 1, debuff: 'P', debuffTurns: 1 };
  },

  // Fenrir — Claws / Blunderbuss
  werewolf: (roll) => {
    if (roll === 1) return { damage: 0, debuff: 'W', debuffTurns: 1 };
    if (roll === 2) return { damage: 0.5, debuff: 'W', debuffTurns: 1 };
    if (roll === 3) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 4) return { damage: 1, debuff: 'W', debuffTurns: 1 };
    if (roll === 5) return { damage: 1, debuff: 'S', debuffTurns: 1 };
    return { damage: 1, debuff: 'P', debuffTurns: 1 };
  },
};

// Прокси на случай непредвиденных обращений: вернёт pinkerton как fallback
const safeWeaponResults = new Proxy(weaponResults, {
  get(target, prop) {
    return target[prop] || target.pinkerton;
  }
});

module.exports = {
  AVAILABLE_CLASSES,
  CLASS_CONFIG,
  getRandomClass,
  assignRandomClasses,
  weaponResults: safeWeaponResults,
};
