const weaponResults = {
  pinkerton: (roll) => {
    if (roll === 1) return { damage: 0, debuff: null };
    if (roll <= 3) return { damage: 0.5, debuff: null };
    if (roll === 4) return { damage: 0.5, debuff: 'W' };
    if (roll === 5) return { damage: 0.5, debuff: 'S' };
    return { damage: 1, debuff: 'P' };
  }
};

module.exports = { weaponResults };
