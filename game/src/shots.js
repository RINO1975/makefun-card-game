// Deterministic screenshot states. One job: put the game into the exact state
// a ?shot= URL asks for (title, table, win, loss), reproducibly from a seed.
// The normal game path never uses these; they only set up screenshots.
import { newGame, startTurn } from './state.js';

function takeCreatures(state, side, count, ready) {
  const p = state[side];
  let taken = 0;
  for (let i = p.deck.length - 1; i >= 0 && taken < count; i--) {
    if (p.deck[i].type === 'creature') {
      const c = p.deck.splice(i, 1)[0];
      c.canAttack = ready;
      p.board.push(c);
      taken += 1;
    }
  }
  return taken;
}

function fillHand(state, side, count) {
  const p = state[side];
  while (p.hand.length < count && p.deck.length > 0) p.hand.push(p.deck.pop());
}

function setupTable(state) {
  state.screen = 'playing';
  state.turn = 4;
  state.active = 'you';
  state.you.life = 24;
  state.foe.life = 18;
  state.you.maxEmber = 5;
  state.you.ember = 5;
  state.foe.maxEmber = 6;
  state.foe.ember = 3;
  takeCreatures(state, 'you', 3, true);
  if (state.you.board[2]) state.you.board[2].canAttack = false;
  takeCreatures(state, 'foe', 2, false);
  fillHand(state, 'you', 5);
  fillHand(state, 'foe', 6);
  state.log = [
    'Asha plays Briar Wolf.',
    'Vex plays Wave Serpent.',
    'Flame Drake hits Vex for 5.',
    'Turn 4 — your move.',
  ];
}

// Build a fresh game and put it into the requested shot state.
export function applyShot(seed, shot) {
  const state = newGame(seed);
  if (shot === 'title') {
    state.screen = 'title';
    return state;
  }
  if (shot === 'table') {
    setupTable(state);
    return state;
  }
  if (shot === 'win') {
    setupTable(state);
    state.foe.life = 0;
    state.screen = 'win';
    state.winner = 'you';
    state.stats = { turns: 9, cardsPlayed: 14, damageDealt: 31 };
    return state;
  }
  if (shot === 'loss') {
    setupTable(state);
    state.you.life = 0;
    state.screen = 'loss';
    state.winner = 'foe';
    state.stats = { turns: 8, cardsPlayed: 11, damageDealt: 22 };
    return state;
  }
  state.screen = 'title';
  return state;
}
