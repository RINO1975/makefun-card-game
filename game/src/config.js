// EMBERFALL DUEL — tuning constants. One job: every number the game uses.
export const CFG = {
  WIDTH: 1280,
  HEIGHT: 720,
  LIFE: 30,
  MAX_EMBER: 10,
  START_HAND: 3,
  HAND_LIMIT: 7,
  DECK_SIZE: 30,
  BOARD_LIMIT: 7,
  CARD_W: 112,
  CARD_H: 152,
  MINI_W: 64,
  MINI_H: 88,
};

// The four suits, told apart by colour AND shape. Never by text alone.
export const SUITS = {
  ember: { name: 'Ember', color: '#e8492f', dark: '#7d1a0c', light: '#ff8a5c', icon: 'flame' },
  tide: { name: 'Tide', color: '#2f7fe8', dark: '#0d3a7d', light: '#7cc0ff', icon: 'drop' },
  thorn: { name: 'Thorn', color: '#3da33d', dark: '#145214', light: '#8ee08e', icon: 'leaf' },
  gale: { name: 'Gale', color: '#e8a92f', dark: '#7d5a0c', light: '#ffd97c', icon: 'swirl' },
};

export const SUIT_KEYS = ['ember', 'tide', 'thorn', 'gale'];
