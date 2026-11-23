// Canvas rendering. One job: draw everything — table, heroes, hands, boards,
// cards, buttons, title and end screens — and report the layout (hit rects)
// the input layer uses.
import { CFG, SUITS } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', bold = false) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// Suit icons, drawn procedurally. Colour AND shape tell suits apart.
export function drawSuitIcon(ctx, suitKey, x, y, s) {
  const suit = SUITS[suitKey];
  ctx.fillStyle = suit.color;
  ctx.strokeStyle = suit.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (suit.icon === 'flame') {
    ctx.moveTo(x, y + s * 0.5);
    ctx.quadraticCurveTo(x - s * 0.55, y + s * 0.1, x - s * 0.15, y - s * 0.35);
    ctx.quadraticCurveTo(x, y - s * 0.6, x + s * 0.1, y - s * 0.25);
    ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.05, x + s * 0.2, y + s * 0.5);
    ctx.quadraticCurveTo(x, y + s * 0.62, x, y + s * 0.5);
  } else if (suit.icon === 'drop') {
    ctx.moveTo(x, y - s * 0.55);
    ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.05, x, y + s * 0.5);
    ctx.quadraticCurveTo(x - s * 0.5, y + s * 0.05, x, y - s * 0.55);
  } else if (suit.icon === 'leaf') {
    ctx.ellipse(x, y, s * 0.5, s * 0.28, -0.6, 0, Math.PI * 2);
  } else {
    ctx.arc(x, y, s * 0.45, 0.5, Math.PI * 1.6);
    ctx.moveTo(x + s * 0.3, y - s * 0.3);
    ctx.arc(x, y, s * 0.22, -0.6, Math.PI * 0.9);
  }
  ctx.fill();
  if (suit.icon === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.4, y + s * 0.25);
    ctx.lineTo(x + s * 0.5, y - s * 0.3);
    ctx.stroke();
  }
}

function drawPips(ctx, x, y, current, max) {
  for (let i = 0; i < max; i++) {
    ctx.beginPath();
    ctx.arc(x + i * 18, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = i < current ? '#ff9d2e' : '#3a3f4a';
    ctx.fill();
    ctx.strokeStyle = '#0c0e12';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function gem(ctx, x, y, r, label, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = '#0c0e12';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, String(label), x, y + 1, r + 2, '#10131a', 'center', true);
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const suit = SUITS[card.suit];
  ctx.save();
  if (opts.dim) ctx.globalAlpha = 0.55;
  if (opts.selected) {
    ctx.shadowColor = '#ffd94a';
    ctx.shadowBlur = 18;
  }
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#1d2733';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = opts.selected ? 4 : 2.5;
  ctx.strokeStyle = opts.selected ? '#ffd94a' : suit.color;
  ctx.stroke();
  ctx.fillStyle = suit.dark;
  roundRect(ctx, x + 3, y + 3, w - 6, 26, 8);
  ctx.fill();
  gem(ctx, x + 17, y + 17, 12, card.cost, '#ffd94a');
  text(ctx, card.name, x + w / 2 + 8, y + 17, 12, '#f2f5f9', 'center', true);
  drawSuitIcon(ctx, card.suit, x + w / 2, y + 58, 26);
  text(ctx, suit.name, x + w / 2, y + 84, 11, suit.light, 'center', true);
  text(ctx, card.type === 'creature' ? 'Creature' : 'Spell', x + w / 2, y + 100, 10, '#9fb0c3');
  wrapText(ctx, card.text, x + 8, y + 116, w - 16, 10, '#c8d3de');
  if (card.type === 'creature') {
    gem(ctx, x + 18, y + h - 16, 12, card.atk, '#e8492f');
    gem(ctx, x + w - 18, y + h - 16, 12, card.hp, '#3da33d');
  }
  ctx.restore();
}

function wrapText(ctx, s, x, y, maxW, size, color) {
  ctx.fillStyle = color;
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = s.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x + maxW / 2, yy);
      line = word;
      yy += 12;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x + maxW / 2, yy);
}

function drawHero(ctx, name, sub, life, ember, maxEmber, x, y, ring) {
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#232c3a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ring;
  ctx.stroke();
  text(ctx, name[0], x, y + 1, 26, '#f2f5f9', 'center', true);
  text(ctx, name, x + 42, y - 12, 15, '#f2f5f9', 'left', true);
  text(ctx, sub, x + 42, y + 6, 11, '#9fb0c3', 'left');
  text(ctx, `♥ ${life}`, x + 42, y + 26, 20, life <= 10 ? '#ff5c5c' : '#ff8a8a', 'left', true);
  drawPips(ctx, x + 150, y + 26, ember, maxEmber);
}

function button(ctx, r, label, enabled, hover) {
  ctx.save();
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fillStyle = !enabled ? '#2a2f38' : hover ? '#c98a1b' : '#a86f10';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffd94a';
  ctx.stroke();
  text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 1, 17, enabled ? '#fff6d8' : '#8a8f98', 'center', true);
  ctx.restore();
}

// Compute every hit rect for the current screen. Input uses this.
export function layout(state) {
  const L = { hand: [], boardYou: [], boardFoe: [], heroYou: null, heroFoe: null, playBtn: null, endTurnBtn: null, againBtn: null };
  const you = state.you;
  const n = you.hand.length;
  const gap = n > 5 ? -14 : 10;
  const totalW = n * CFG.CARD_W + (n - 1) * gap;
  let hx = (CFG.WIDTH - totalW) / 2 + 60;
  const hy = CFG.HEIGHT - CFG.CARD_H - 14;
  you.hand.forEach((c, i) => {
    L.hand.push({ x: hx, y: hy, w: CFG.CARD_W, h: CFG.CARD_H, index: i });
    hx += CFG.CARD_W + gap;
  });
  const bw = 96;
  const bh = 122;
  const foeN = state.foe.board.length;
  let fx = (CFG.WIDTH - (foeN * bw + (foeN - 1) * 10)) / 2;
  state.foe.board.forEach((c, i) => {
    L.boardFoe.push({ x: fx, y: 132, w: bw, h: bh, index: i });
    fx += bw + 10;
  });
  const youN = you.board.length;
  let yx = (CFG.WIDTH - (youN * bw + (youN - 1) * 10)) / 2;
  you.board.forEach((c, i) => {
    L.boardYou.push({ x: yx, y: 372, w: bw, h: bh, index: i });
    yx += bw + 10;
  });
  L.heroFoe = { x: 560, y: 34, w: 320, h: 64 };
  L.heroYou = { x: 30, y: 640, w: 320, h: 64 };
  L.endTurnBtn = { x: 1080, y: 300, w: 160, h: 48 };
  L.playBtn = { x: 530, y: 430, w: 220, h: 64 };
  L.againBtn = { x: 530, y: 470, w: 220, h: 60 };
  return L;
}

function drawBoardCreature(ctx, card, x, y, w, h, opts = {}) {
  const suit = SUITS[card.suit];
  ctx.save();
  if (opts.glow) {
    ctx.shadowColor = '#7dff8a';
    ctx.shadowBlur = 14;
  }
  roundRect(ctx, x, y, w, h, 9);
  ctx.fillStyle = '#1d2733';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = opts.selected ? 4 : 2;
  ctx.strokeStyle = opts.selected ? '#ffd94a' : suit.color;
  ctx.stroke();
  gem(ctx, x + 15, y + 15, 11, card.cost, '#ffd94a');
  text(ctx, card.name, x + w / 2 + 6, y + 15, 11, '#f2f5f9', 'center', true);
  drawSuitIcon(ctx, card.suit, x + w / 2, y + 52, 22);
  text(ctx, `${card.atk} / ${card.hp}`, x + w / 2, y + 82, 13, '#f2f5f9', 'center', true);
  if (!card.canAttack) text(ctx, '…', x + w / 2, y + 102, 13, '#9fb0c3');
  else text(ctx, 'ready', x + w / 2, y + 102, 10, '#7dff8a');
  ctx.restore();
}

function drawTable(ctx, state, L, mouse) {
  ctx.fillStyle = '#0e1420';
  ctx.fillRect(0, 0, CFG.WIDTH, CFG.HEIGHT);
  const grad = ctx.createLinearGradient(0, 0, 0, CFG.HEIGHT);
  grad.addColorStop(0, '#14251c');
  grad.addColorStop(0.5, '#1b2f24');
  grad.addColorStop(1, '#14251c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 56, CFG.WIDTH, CFG.HEIGHT - 56);
  ctx.strokeStyle = '#2c3a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.lineTo(CFG.WIDTH, 360);
  ctx.stroke();
  text(ctx, 'EMBERFALL DUEL', 24, 24, 18, '#ffd94a', 'left', true);
  const turnLabel = state.screen === 'playing'
    ? (state.active === 'you' ? 'Your turn — play a card or attack' : 'Vex is thinking…')
    : '';
  text(ctx, turnLabel, CFG.WIDTH / 2, 24, 14, '#c8d3de');
  text(ctx, 'Space: End Turn · Esc: Title · M: Mute', CFG.WIDTH - 24, 24, 12, '#9fb0c3', 'right');
  drawHero(ctx, 'Vex', 'the Frost Warden', state.foe.life, state.foe.ember, state.foe.maxEmber, 590, 66, '#2f7fe8');
  text(ctx, `Vex hand: ${state.foe.hand.length} cards · deck ${state.foe.deck.length}`, 1080, 66, 12, '#9fb0c3', 'right');
  for (let i = 0; i < state.foe.hand.length; i++) {
    const bx = 1000 + i * 26;
    roundRect(ctx, bx, 86, 24, 34, 4);
    ctx.fillStyle = '#2f7fe8';
    ctx.fill();
  }
  state.foe.board.forEach((c, i) => {
    const r = L.boardFoe[i];
    const sel = state.selected && state.selected.kind === 'board-foe' && state.selected.index === i;
    drawBoardCreature(ctx, c, r.x, r.y, r.w, r.h, { selected: sel });
  });
  text(ctx, `Turn ${state.turn}`, 60, 300, 14, '#9fb0c3', 'left');
  state.log.forEach((line, i) => text(ctx, line, 60, 322 + i * 18, 12, '#c8d3de', 'left'));
  const endHover = mouse && L.endTurnBtn && mouse.x >= L.endTurnBtn.x && mouse.x <= L.endTurnBtn.x + L.endTurnBtn.w && mouse.y >= L.endTurnBtn.y && mouse.y <= L.endTurnBtn.y + L.endTurnBtn.h;
  button(ctx, L.endTurnBtn, 'End Turn', state.active === 'you' && state.screen === 'playing', endHover);
  state.you.board.forEach((c, i) => {
    const r = L.boardYou[i];
    const sel = state.selected && state.selected.kind === 'board-you' && state.selected.index === i;
    drawBoardCreature(ctx, c, r.x, r.y, r.w, r.h, { selected: sel, glow: c.canAttack && state.active === 'you' });
  });
  const hoverIdx = mouse ? hitHand(L, mouse) : -1;
  state.you.hand.forEach((c, i) => {
    const r = L.hand[i];
    const y = i === hoverIdx ? r.y - 14 : r.y;
    const sel = state.selected && state.selected.kind === 'hand' && state.selected.index === i;
    const affordable = state.you.ember >= c.cost;
    drawCardFace(ctx, c, r.x, y, r.w, r.h, { selected: sel, dim: !affordable && state.active === 'you' });
  });
  drawHero(ctx, 'Asha', 'the Ember Knight', state.you.life, state.you.ember, state.you.maxEmber, 60, 668, '#e8492f');
  if (state.selected && state.selected.kind === 'spell') {
    text(ctx, `Choose a target for ${state.selected.card.name} — click an enemy creature or Vex`, CFG.WIDTH / 2, 352, 14, '#ffd94a', 'center', true);
  }
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, f.ttl);
    text(ctx, f.text, f.x, f.y, 22, f.color, 'center', true);
    ctx.globalAlpha = 1;
  }
}

function hitHand(L, mouse) {
  for (let i = L.hand.length - 1; i >= 0; i--) {
    const r = L.hand[i];
    if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y - 14 && mouse.y <= r.y + r.h) return i;
  }
  return -1;
}

function drawTitle(ctx, state, L, mouse) {
  ctx.fillStyle = '#0e1420';
  ctx.fillRect(0, 0, CFG.WIDTH, CFG.HEIGHT);
  const grad = ctx.createRadialGradient(640, 300, 40, 640, 300, 520);
  grad.addColorStop(0, '#3a1c0c');
  grad.addColorStop(1, '#0e1420');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CFG.WIDTH, CFG.HEIGHT);
  drawSuitIcon(ctx, 'ember', 640, 108, 54);
  text(ctx, 'EMBERFALL DUEL', 640, 190, 64, '#ffd94a', 'center', true);
  text(ctx, 'A tactical duel card battler — Asha, the Ember Knight, vs Vex, the Frost Warden', 640, 240, 17, '#c8d3de');
  const hover = mouse && mouse.x >= L.playBtn.x && mouse.x <= L.playBtn.x + L.playBtn.w && mouse.y >= L.playBtn.y && mouse.y <= L.playBtn.y + L.playBtn.h;
  button(ctx, L.playBtn, '▶  Play', true, hover);
  roundRect(ctx, 340, 520, 600, 130, 12);
  ctx.fillStyle = '#141c28';
  ctx.fill();
  ctx.strokeStyle = '#2c3a4a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, 'How to play', 640, 542, 15, '#ffd94a', 'center', true);
  const rules = [
    'Life 30 each. Ember starts at 1, +1 each turn, max 10.',
    'Click a card to play it (costs ember). Click your creature, then an enemy to attack.',
    'Creatures cannot attack the turn they are played. Press End Turn (or Space).',
    'Reduce Vex to 0 life to win. Suits: Ember, Tide, Thorn, Gale.',
  ];
  rules.forEach((r, i) => text(ctx, r, 640, 566 + i * 20, 13, '#c8d3de'));
  text(ctx, 'An original game by rino1975 for make.fun', 640, 690, 13, '#9fb0c3');
}

function drawEnd(ctx, state, L, mouse) {
  drawTable(ctx, state, L, mouse);
  ctx.fillStyle = 'rgba(8, 10, 16, 0.82)';
  ctx.fillRect(0, 0, CFG.WIDTH, CFG.HEIGHT);
  const win = state.screen === 'win';
  text(ctx, win ? 'VICTORY' : 'DEFEAT', 640, 240, 72, win ? '#ffd94a' : '#ff5c5c', 'center', true);
  text(ctx, win ? 'Vex falls. Asha holds the ember.' : 'Vex takes the duel. The ember fades.', 640, 300, 18, '#c8d3de');
  text(ctx, `Turns played: ${state.stats.turns}`, 640, 350, 16, '#f2f5f9');
  text(ctx, `Cards played: ${state.stats.cardsPlayed}`, 640, 378, 16, '#f2f5f9');
  text(ctx, `Damage dealt: ${state.stats.damageDealt}`, 640, 406, 16, '#f2f5f9');
  const hover = mouse && mouse.x >= L.againBtn.x && mouse.x <= L.againBtn.x + L.againBtn.w && mouse.y >= L.againBtn.y && mouse.y <= L.againBtn.y + L.againBtn.h;
  button(ctx, L.againBtn, 'Play Again', true, hover);
}

// Main entry: draw the current screen. Returns the layout for input.
export function render(ctx, state, mouse) {
  const L = layout(state);
  state._layout = L;
  if (state.screen === 'title') drawTitle(ctx, state, L, mouse);
  else if (state.screen === 'win' || state.screen === 'loss') drawEnd(ctx, state, L, mouse);
  else drawTable(ctx, state, L, mouse);
  for (const f of state.floats) {
    f.y -= 0.6;
    f.ttl -= 0.012;
  }
  state.floats = state.floats.filter((f) => f.ttl > 0);
  return L;
}

export function addFloat(state, x, y, text, color) {
  state.floats.push({ x, y, text, color, ttl: 1 });
}
