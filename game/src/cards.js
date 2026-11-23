// Card definitions for EMBERFALL DUEL. One job: what every card is.
// A creature stays on the table; a spell resolves at once when played.
export const CARDS = [
  { id: 'ember-imp', name: 'Ember Imp', suit: 'ember', type: 'creature', cost: 1, atk: 2, hp: 1, text: 'A quick spark.' },
  { id: 'tide-sprite', name: 'Tide Sprite', suit: 'tide', type: 'creature', cost: 1, atk: 1, hp: 2, text: 'Slippery.' },
  { id: 'thorn-sprout', name: 'Thorn Sprout', suit: 'thorn', type: 'creature', cost: 2, atk: 2, hp: 3, text: 'Grows back.' },
  { id: 'gale-falcon', name: 'Gale Falcon', suit: 'gale', type: 'creature', cost: 2, atk: 3, hp: 2, text: 'Strikes from above.' },
  { id: 'flame-drake', name: 'Flame Drake', suit: 'ember', type: 'creature', cost: 4, atk: 5, hp: 4, text: 'Breathes fire.' },
  { id: 'wave-serpent', name: 'Wave Serpent', suit: 'tide', type: 'creature', cost: 3, atk: 4, hp: 3, text: 'Coils and crushes.' },
  { id: 'briar-wolf', name: 'Briar Wolf', suit: 'thorn', type: 'creature', cost: 3, atk: 4, hp: 4, text: 'Runs with the pack.' },
  { id: 'storm-roc', name: 'Storm Roc', suit: 'gale', type: 'creature', cost: 4, atk: 4, hp: 5, text: 'Rides the storm.' },
  { id: 'fireball', name: 'Fireball', suit: 'ember', type: 'spell', cost: 2, text: 'Deal 3 damage to any target.', effect: 'damage', amount: 3, target: 'any' },
  { id: 'healing-rain', name: 'Healing Rain', suit: 'thorn', type: 'spell', cost: 2, text: 'Restore 5 life to your hero.', effect: 'heal', amount: 5, target: 'self' },
  { id: 'insight', name: 'Arcane Insight', suit: 'tide', type: 'spell', cost: 1, text: 'Draw 2 cards.', effect: 'draw', amount: 2, target: 'self' },
  { id: 'cyclone', name: 'Cyclone', suit: 'gale', type: 'spell', cost: 3, text: 'Deal 2 damage to all enemy creatures.', effect: 'sweep', amount: 2, target: 'all-enemy' },
];

export function cardById(id) {
  return CARDS.find((c) => c.id === id);
}

// Deck recipe: [card id, copies]. Sums to CFG.DECK_SIZE (30).
export const DECK_RECIPE = [
  ['ember-imp', 3],
  ['tide-sprite', 3],
  ['thorn-sprout', 3],
  ['gale-falcon', 2],
  ['flame-drake', 2],
  ['wave-serpent', 2],
  ['briar-wolf', 2],
  ['storm-roc', 2],
  ['fireball', 3],
  ['healing-rain', 2],
  ['insight', 3],
  ['cyclone', 3],
];
