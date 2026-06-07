const weaponResults = {
  pinkerton: (roll) => {
    if (roll === 1) return { damage: 0, debuff: null, debuffTurns: 0 };
    if (roll === 2) return { damage: 0.5, debuff: null, debuffTurns: 0 };
    if (roll === 3) return { damage: 1, debuff: null, debuffTurns: 0 };
    if (roll === 4) return { damage: 1, debuff: 'W', debuffTurns: 1};
    if (roll === 5) return { damage: 1, debuff: 'S', debuffTurns: 1};
    return { damage: 1, debuff: 'P', debuffTurns: 1};
  }
};

module.exports = { weaponResults };
