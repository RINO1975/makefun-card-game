// Boot, game loop and state machine. One job: start the game from the URL,
// run the AI turn step by step, and keep the screen drawing.
import { CFG } from './config.js';
import { newGame, startTurn, endTurn } from './state.js';
import { render, addFloat } from './render.js';
import { attachInput } from './input.js';
import { applyShot } from './shots.js';
import { runAutoplay } from './autoplay.js';
import { chooseAction, applyAction } from './ai.js';
import { sfx } from './audio.js';

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 1) || 1;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

let state = null;
let aiToken = 0;

function announce(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function targetRect(state, side, action) {
  const L = state._layout;
  if (!L || !action || !action.target) return null;
  const t = action.target;
  if (t.kind === 'hero') return side === 'you' ? L.heroFoe : L.heroYou;
  const row = side === 'you' ? L.boardFoe : L.boardYou;
  return row[t.index] || null;
}

function showFloats(state, side, action, result) {
  if (!result || !result.ok || !result.damage) return;
  const r = targetRect(state, side, action);
  if (!r) return;
  addFloat(state, r.x + r.w / 2, r.y + r.h / 2, `-${result.damage}`, '#ff5c5c');
  sfx.damage();
}

function runAiTurn() {
  const token = ++aiToken;
  const step = () => {
    if (token !== aiToken) return;
    if (!state || state.screen !== 'playing' || state.active !== 'foe') return;
    const action = chooseAction(state, 'foe', { skill: 'strong' });
    if (!action) {
      endTurn(state);
      return;
    }
    const res = applyAction(state, 'foe', action);
    if (res.ok) {
      if (action.type === 'play') sfx.play();
      if (action.type === 'attack') sfx.attack();
      showFloats(state, 'foe', action, res);
    }
    if (state.screen === 'playing' && state.active === 'foe') setTimeout(step, 450);
  };
  setTimeout(step, 600);
}

function startPlaying() {
  aiToken += 1;
  const fresh = newGame(seed);
  // Keep the SAME object identity: the input handler closed over the
  // title-screen state object, so replacing it would leave every click
  // reading the stale title screen. Copy the fresh game in place instead.
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, fresh);
  state.screen = 'playing';
  startTurn(state, 'you');
  announce('Your turn. Play a card or attack.');
}

function loop() {
  if (!state) return;
  render(ctx, state, state._mouse || { x: -1, y: -1 });
  if (state.screen === 'win' && !state._stinger) {
    state._stinger = true;
    sfx.win();
    announce('Victory!');
  }
  if (state.screen === 'loss' && !state._stinger) {
    state._stinger = true;
    sfx.loss();
    announce('Defeat.');
  }
  requestAnimationFrame(loop);
}

const shot = params.get('shot');
const autoplay = params.get('autoplay');
if (autoplay) {
  const { state: s, result } = runAutoplay(seed, autoplay);
  state = s;
  render(ctx, state, { x: -1, y: -1 });
  announce(`Autoplay finished: ${result}.`);
} else if (shot) {
  state = applyShot(seed, shot);
  render(ctx, state, { x: -1, y: -1 });
  announce(`Screenshot state: ${shot}.`);
} else {
  state = newGame(seed);
  state.screen = 'title';
  attachInput(canvas, state, {
    onStart() {
      startPlaying();
    },
    onPlayAgain() {
      startPlaying();
    },
    onEndTurn() {
      if (state.screen !== 'playing' || state.active !== 'you') return;
      state.selected = null;
      endTurn(state);
      if (state.screen === 'playing' && state.active === 'foe') runAiTurn();
    },
    onAction(type, result, rect) {
      if (!result || !result.ok) return;
      if (type === 'play') sfx.play();
      if (type === 'attack') sfx.attack();
      if (type === 'cast') sfx.play();
      if (result.damage && rect) {
        addFloat(state, rect.x + rect.w / 2, rect.y + rect.h / 2, `-${result.damage}`, '#ff5c5c');
        sfx.damage();
      }
    },
    onSelect() {
      sfx.play();
    },
    onDeny(reason) {
      sfx.deny();
      if (state.log) state.log.push(reason);
    },
    onToggleMute() {
      const m = sfx.toggleMute();
      announce(m ? 'Muted.' : 'Sound on.');
    },
  });
  window.__emberfall = { get state() { return state; } };
  requestAnimationFrame(loop);
}
