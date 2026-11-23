// Game state and rules. One job: the duel itself — turns, ember, playing cards,
// combat, winning and losing. No rendering, no input, no sound here.
import { CFG } from './config.js';
import { RNG } from './random.js';
import { buildDeck, drawCard } from './deck.js';

export function otherSide(side) {
  return side === 'you' ? 'foe' : 'you';
}

export function newPlayer(rng) {
  return {
    life: CFG.LIFE,
    maxEmber: 1,
    ember: 1,
    turnsTaken: 0,
    deck: buildDeck(rng),
    hand: [],
    board: [],
    stats: { played: 0, damage: 0 },
  };
}

export function newGame(seed) {
  const rng = new RNG(seed);
  const state = {
    seed,
    rng,
    screen: 'title', // title | playing | win | loss
    turn: 1,
    turnStarted: false,
    active: 'you',
    you: newPlayer(rng),
    foe: newPlayer(rng),
    log: ['Welcome to EMBERFALL DUEL.'],
    selected: null,
    floats: [],
    winner: null,
    stats: { turns: 1, cardsPlayed: 0, damageDealt: 0 },
  };
  for (let i = 0; i < CFG.START_HAND; i++) {
    drawCard(state.you);
    drawCard(state.foe);
  }
  return state;
}

export function log(state, msg) {
  state.log.push(msg);
  if (state.log.length > 5) state.log.shift();
}

export function checkWinner(state) {
  if (state.foe.life <= 0) {
    state.screen = 'win';
    state.winner = 'you';
    state.stats.turns = state.turn;
    return 'you';
  }
  if (state.you.life <= 0) {
    state.screen = 'loss';
    state.winner = 'foe';
    state.stats.turns = state.turn;
    return 'foe';
  }
  return null;
}

export function startTurn(state, side) {
  const p = state[side];
  if (side === 'you') {
    if (state.turnStarted) state.turn += 1;
    state.turnStarted = true;
    state.stats.turns = state.turn;
  }
  if (p.turnsTaken > 0) p.maxEmber = Math.min(CFG.MAX_EMBER, p.maxEmber + 1);
  p.turnsTaken += 1;
  p.ember = p.maxEmber;
  for (const c of p.board) c.canAttack = true;
  const d = drawCard(p);
  const who = side === 'you' ? 'Asha' : 'Vex';
  if (d.fatigue) log(state, `${who} takes 1 fatigue damage — deck is empty.`);
  else if (d.burned) log(state, `${who} burns ${d.burned.name} — hand is full.`);
  else log(state, `${who} draws a card.`);
  state.active = side;
  checkWinner(state);
}

export function canPlay(state, side, handIndex) {
  const p = state[side];
  const card = p.hand[handIndex];
  if (!card) return { ok: false, reason: 'no card' };
  if (p.ember < card.cost) return { ok: false, reason: 'not enough ember' };
  if (card.type === 'creature' && p.board.length >= CFG.BOARD_LIMIT) {
    return { ok: false, reason: 'board is full' };
  }
  return { ok: true, card };
}

export function playCreature(state, side, handIndex) {
  const check = canPlay(state, side, handIndex);
  if (!check.ok || check.card.type !== 'creature') return { ok: false, reason: check.reason || 'not a creature' };
  const p = state[side];
  const card = p.hand.splice(handIndex, 1)[0];
  card.canAttack = false;
  p.ember -= card.cost;
  p.board.push(card);
  p.stats.played += 1;
  if (side === 'you') state.stats.cardsPlayed += 1;
  log(state, `${side === 'you' ? 'Asha' : 'Vex'} plays ${card.name}.`);
  return { ok: true, card };
}

function hurtCreature(board, index, amount) {
  const c = board[index];
  if (!c) return null;
  c.hp -= amount;
  if (c.hp <= 0) {
    board.splice(index, 1);
    return { killed: c };
  }
  return { hurt: c };
}

export function castSpell(state, side, handIndex, target) {
  const check = canPlay(state, side, handIndex);
  if (!check.ok || check.card.type !== 'spell') return { ok: false, reason: check.reason || 'not a spell' };
  const p = state[side];
  const foe = state[otherSide(side)];
  const card = check.card;
  if (card.effect === 'damage' && !target) return { ok: false, reason: 'needs a target' };
  p.hand.splice(handIndex, 1);
  p.ember -= card.cost;
  p.stats.played += 1;
  if (side === 'you') state.stats.cardsPlayed += 1;
  const who = side === 'you' ? 'Asha' : 'Vex';
  let result = { ok: true, card };
  if (card.effect === 'damage') {
    if (target.kind === 'hero') {
      foe.life = Math.max(0, foe.life - card.amount);
      result.damage = card.amount;
      result.targetKind = 'hero';
      if (side === 'you') state.stats.damageDealt += card.amount;
      log(state, `${who} casts ${card.name} for ${card.amount} damage.`);
    } else {
      const r = hurtCreature(foe.board, target.index, card.amount);
      result.damage = card.amount;
      result.targetKind = 'creature';
      result.killed = r && r.killed ? r.killed.name : null;
      if (side === 'you') state.stats.damageDealt += card.amount;
      log(state, `${who} casts ${card.name} on ${r && r.killed ? r.killed.name : 'a creature'}.`);
    }
  } else if (card.effect === 'heal') {
    p.life = Math.min(CFG.LIFE, p.life + card.amount);
    log(state, `${who} casts ${card.name} and heals ${card.amount}.`);
  } else if (card.effect === 'draw') {
    for (let i = 0; i < card.amount; i++) drawCard(p);
    log(state, `${who} casts ${card.name} and draws ${card.amount}.`);
  } else if (card.effect === 'sweep') {
    let killed = 0;
    for (let i = foe.board.length - 1; i >= 0; i--) {
      const r = hurtCreature(foe.board, i, card.amount);
      if (r && r.killed) killed += 1;
    }
    result.killedCount = killed;
    log(state, `${who} casts ${card.name} — ${killed} creature(s) destroyed.`);
  }
  checkWinner(state);
  return result;
}

export function canAttack(state, side, boardIndex) {
  const c = state[side].board[boardIndex];
  if (!c) return { ok: false, reason: 'no creature' };
  if (!c.canAttack) return { ok: false, reason: 'cannot attack yet' };
  return { ok: true, card: c };
}

export function attack(state, side, boardIndex, target) {
  const check = canAttack(state, side, boardIndex);
  if (!check.ok) return { ok: false, reason: check.reason };
  const p = state[side];
  const foe = state[otherSide(side)];
  const attacker = check.card;
  attacker.canAttack = false;
  const who = side === 'you' ? 'Asha' : 'Vex';
  let result = { ok: true, attacker: attacker.name, damage: attacker.atk };
  if (target.kind === 'hero') {
    foe.life = Math.max(0, foe.life - attacker.atk);
    p.stats.damage += attacker.atk;
    if (side === 'you') state.stats.damageDealt += attacker.atk;
    log(state, `${attacker.name} hits the enemy hero for ${attacker.atk}.`);
  } else {
    const defender = foe.board[target.index];
    if (!defender) return { ok: false, reason: 'no target' };
    const r1 = hurtCreature(foe.board, target.index, attacker.atk);
    const r2 = hurtCreature(p.board, boardIndex, defender.atk);
    result.killed = r1 && r1.killed ? r1.killed.name : null;
    result.attackerDied = !!(r2 && r2.killed);
    p.stats.damage += attacker.atk;
    if (side === 'you') state.stats.damageDealt += attacker.atk;
    log(state, `${attacker.name} attacks ${defender.name}.`);
  }
  checkWinner(state);
  return result;
}

export function endTurn(state) {
  const next = otherSide(state.active);
  startTurn(state, next);
}
