// Mouse and keyboard input. One job: turn clicks and keys into game actions.
// It reads the layout render() computed and calls the hooks main.js provides.
import { CFG } from './config.js';
import { canPlay, canAttack, playCreature, castSpell, attack } from './state.js';

function inRect(p, r) {
  return !!r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function attachInput(canvas, state, hooks) {
  const toGame = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * CFG.WIDTH) / rect.width,
      y: ((e.clientY - rect.top) * CFG.HEIGHT) / rect.height,
    };
  };

  canvas.addEventListener('mousemove', (e) => {
    state._mouse = toGame(e);
  });

  canvas.addEventListener('click', (e) => {
    const p = toGame(e);
    const L = state._layout;
    if (!L) return;
    if (state.screen === 'title') {
      if (inRect(p, L.playBtn)) hooks.onStart();
      return;
    }
    if (state.screen === 'win' || state.screen === 'loss') {
      if (inRect(p, L.againBtn)) hooks.onPlayAgain();
      return;
    }
    if (state.active !== 'you') return;
    if (inRect(p, L.endTurnBtn)) {
      hooks.onEndTurn();
      return;
    }
    // A spell is waiting for a target.
    if (state.selected && state.selected.kind === 'spell') {
      const sel = state.selected;
      for (const r of L.boardFoe) {
        if (inRect(p, r)) {
          const res = castSpell(state, 'you', sel.handIndex, { kind: 'creature', index: r.index });
          state.selected = null;
          hooks.onAction('cast', res, r);
          return;
        }
      }
      if (inRect(p, L.heroFoe)) {
        const res = castSpell(state, 'you', sel.handIndex, { kind: 'hero' });
        state.selected = null;
        hooks.onAction('cast', res, L.heroFoe);
        return;
      }
      state.selected = null;
      return;
    }
    // An attacker is waiting for a target.
    if (state.selected && state.selected.kind === 'board-you') {
      const sel = state.selected;
      for (const r of L.boardFoe) {
        if (inRect(p, r)) {
          const res = attack(state, 'you', sel.index, { kind: 'creature', index: r.index });
          state.selected = null;
          hooks.onAction('attack', res, r);
          return;
        }
      }
      if (inRect(p, L.heroFoe)) {
        const res = attack(state, 'you', sel.index, { kind: 'hero' });
        state.selected = null;
        hooks.onAction('attack', res, L.heroFoe);
        return;
      }
      state.selected = null;
      return;
    }
    // Hand cards.
    for (const r of L.hand) {
      if (inRect(p, r)) {
        const check = canPlay(state, 'you', r.index);
        if (!check.ok) {
          hooks.onDeny(check.reason);
          return;
        }
        const card = check.card;
        if (card.type === 'creature') {
          const res = playCreature(state, 'you', r.index);
          hooks.onAction('play', res, r);
        } else if (card.effect === 'damage') {
          state.selected = { kind: 'spell', card, handIndex: r.index };
          hooks.onSelect();
        } else {
          const res = castSpell(state, 'you', r.index, null);
          hooks.onAction('cast', res, r);
        }
        return;
      }
    }
    // Own board creatures: select as attacker.
    for (const r of L.boardYou) {
      if (inRect(p, r)) {
        const check = canAttack(state, 'you', r.index);
        if (!check.ok) {
          hooks.onDeny(check.reason);
          return;
        }
        state.selected = { kind: 'board-you', index: r.index };
        hooks.onSelect();
        return;
      }
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.screen === 'playing' && state.active === 'you') hooks.onEndTurn();
    } else if (e.code === 'Escape') {
      if (state.screen !== 'title') {
        state.screen = 'title';
        state.selected = null;
      }
    } else if (e.code === 'KeyM') {
      hooks.onToggleMute();
    }
  });
}
