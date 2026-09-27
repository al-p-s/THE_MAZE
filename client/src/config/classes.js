export const CLASS_DATA = {
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
      'WIP',
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
      'WIP',
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
      'WIP',
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
      'WIP',
    ],
  },
  cutie: {
    name: 'Charlotte',
    title: 'Cutie',
    portrait: '/portraits/08_cutie.png',
    initials: 'CR',
    color: '#9200d6',
    weapon: 'Revolver',
    passives: [
      'WIP',
    ],
  },
};

export const CLASS_SPRITES = {
  pinkerton: {
    top: '/sprites_96/pinkerton/02_back.png',
    bottom: '/sprites_96/pinkerton/02_front.png',
    left: '/sprites_96/pinkerton/02_left.png',
    right: '/sprites_96/pinkerton/02_right.png',
    top_left: '/sprites_96/pinkerton/02_back_left.png',
    top_right: '/sprites_96/pinkerton/02_back_right.png',
    bottom_left: '/sprites_96/pinkerton/02_front_left.png',
    bottom_right: '/sprites_96/pinkerton/02_front_right.png',
  },
  reaper: {
    top: '/sprites_96/reaper/01_back.png',
    bottom: '/sprites_96/reaper/01_front.png',
    left: '/sprites_96/reaper/01_left.png',
    right: '/sprites_96/reaper/01_right.png',
    top_left: '/sprites_96/reaper/01_back_left.png',
    top_right: '/sprites_96/reaper/01_back_right.png',
    bottom_left: '/sprites_96/reaper/01_front_left.png',
    bottom_right: '/sprites_96/reaper/01_front_right.png',
  },
  witch: {
    top: '/sprites_96/witch/03_back.png',
    bottom: '/sprites_96/witch/03_front.png',
    left: '/sprites_96/witch/03_left.png',
    right: '/sprites_96/witch/03_right.png',
    top_left: '/sprites_96/witch/03_back_left.png',
    top_right: '/sprites_96/witch/03_back_right.png',
    bottom_left: '/sprites_96/witch/03_front_left.png',
    bottom_right: '/sprites_96/witch/03_front_right.png',
  },
  obsessed: {
    top: '/sprites_96/obsessed/04_back.png',
    bottom: '/sprites_96/obsessed/04_front.png',
    left: '/sprites_96/obsessed/04_left.png',
    right: '/sprites_96/obsessed/04_right.png',
    top_left: '/sprites_96/obsessed/04_back_left.png',
    top_right: '/sprites_96/obsessed/04_back_right.png',
    bottom_left: '/sprites_96/obsessed/04_front_left.png',
    bottom_right: '/sprites_96/obsessed/04_front_right.png',
  },
  succubus: {
    top: '/sprites_96/succubus/06_back.png',
    bottom: '/sprites_96/succubus/06_front.png',
    left: '/sprites_96/succubus/06_left.png',
    right: '/sprites_96/succubus/06_right.png',
    top_left: '/sprites_96/succubus/06_back_left.png',
    top_right: '/sprites_96/succubus/06_back_right.png',
    bottom_left: '/sprites_96/succubus/06_front_left.png',
    bottom_right: '/sprites_96/succubus/06_front_right.png',
  },
  cutie: {
    top: '/sprites_96/cutie/08_back.png',
    bottom: '/sprites_96/cutie/08_front.png',
    left: '/sprites_96/cutie/08_left.png',
    right: '/sprites_96/cutie/08_right.png',
    top_left: '/sprites_96/cutie/08_back_left.png',
    top_right: '/sprites_96/cutie/08_back_right.png',
    bottom_left: '/sprites_96/cutie/08_front_left.png',
    bottom_right: '/sprites_96/cutie/08_front_right.png',
  },
};

export function getClassData(className) {
  return CLASS_DATA[className] ?? CLASS_DATA.pinkerton;
}

