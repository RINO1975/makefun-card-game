// Opponent AI. One job: pick the next action for a side, readable and fair.
// Strong policy: lethal first, then good trades, then face. Weak policy plays
// poorly on purpose (used by autoplay to force a win or a loss).
import { otherSide, canPlay, canAttack, playCreature, castSpell, attack } from './state.js';

function readyAttackers(state, side) {
  const out = [];
  state[side].board.forEach((c, i) => {
    if (c.canAttack) out.push({ card: c, index: i });
  });
  return out;
}

function bestCreatureToPlay(state, side) {
  const p = state[side];
  let best = -1;
  let bestScore = -1;
  p.hand.forEach((c, i) => {
    if (c.type !== 'creature') return;
    if (p.ember < c.cost) return;
    if (p.board.length >= 7) return;
    const score = c.cost * 10 + c.atk + c.hp;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

function spellToCast(state, side) {
  const p = state[side];
  const foe = state[otherSide(side)];
  for (let i = 0; i < p.hand.length; i++) {
    const c = p.hand[i];
    if (c.type !== 'spell' || p.ember < c.cost) continue;
    if (c.effect === 'heal' && p.life <= 12) return { handIndex: i, target: null };
    if (c.effect === 'draw' && p.hand.length <= 2) return { handIndex: i, target: null };
    if (c.effect === 'sweep' && foe.board.length >= 2) return { handIndex: i, target: null };
    if (c.effect === 'damage') {
      if (foe.life <= c.amount) return { handIndex: i, target: { kind: 'hero' } };
      let killIdx = -1;
      foe.board.forEach((e, j) => {
        if (e.hp <= c.amount && (killIdx === -1 || e.atk > foe.board[killIdx].atk)) killIdx = j;
      });
      if (killIdx >= 0) return { handIndex: i, target: { kind: 'creature', index: killIdx } };
    }
  }
  return null;
}

function attackToMake(state, side) {
  const ready = readyAttackers(state, side);
  if (ready.length === 0) return null;
  const foe = state[otherSide(side)];
  const totalAtk = ready.reduce((s, r) => s + r.card.atk, 0);
  if (totalAtk >= foe.life) {
    return { boardIndex: ready[0].index, target: { kind: 'hero' } };
  }
  for (const r of ready) {
    let prey = -1;
    foe.board.forEach((e, j) => {
      if (e.hp <= r.card.atk && e.atk <= r.card.atk) {
        if (prey === -1 || e.atk > foe.board[prey].atk) prey = j;
      }
    });
    if (prey >= 0) return { boardIndex: r.index, target: { kind: 'creature', index: prey } };
  }
  return { boardIndex: ready[0].index, target: { kind: 'hero' } };
}

// Pick the single next action for `side`, or null when the turn is over.
// opts.skill: 'strong' (default) or 'weak'.
export function chooseAction(state, side, opts = {}) {
  const skill = opts.skill || 'strong';
  if (skill === 'weak') {
    const p = state[side];
    if (!state[side]._weakPlayed) {
      const idx = bestCreatureToPlay(state, side);
      if (idx >= 0) {
        state[side]._weakPlayed = true;
        return { type: 'play', handIndex: idx };
      }
      state[side]._weakPlayed = true;
    }
    const ready = readyAttackers(state, side);
    if (ready.length > 0) return { type: 'attack', boardIndex: ready[0].index, target: { kind: 'hero' } };
    return null;
  }
  const spell = spellToCast(state, side);
  if (spell) return { type: 'cast', handIndex: spell.handIndex, target: spell.target };
  const creature = bestCreatureToPlay(state, side);
  if (creature >= 0) return { type: 'play', handIndex: creature };
  const attack = attackToMake(state, side);
  if (attack) return { type: 'attack', boardIndex: attack.boardIndex, target: attack.target };
  return null;
}

// Apply one action descriptor to the state. Returns the result object.
export function applyAction(state, side, action) {
  if (!action) return { ok: false };
  if (action.type === 'play') return playCreature(state, side, action.handIndex);
  if (action.type === 'cast') return castSpell(state, side, action.handIndex, action.target);
  if (action.type === 'attack') return attack(state, side, action.boardIndex, action.target);
  return { ok: false };
}
