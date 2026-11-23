// Deck building and drawing. One job: a shuffled 30-card deck per player,
// draws that burn past the hand limit, and fatigue when the deck runs dry.
import { CFG } from './config.js';
import { cardById, DECK_RECIPE } from './cards.js';

let uidCounter = 1;

export function makeCardInstance(def) {
  return {
    uid: uidCounter++,
    id: def.id,
    name: def.name,
    suit: def.suit,
    type: def.type,
    cost: def.cost,
    atk: def.atk || 0,
    hp: def.hp || 0,
    maxHp: def.hp || 0,
    text: def.text,
    effect: def.effect || null,
    amount: def.amount || 0,
    target: def.target || null,
    canAttack: false,
  };
}

// Build a fresh 30-card deck and shuffle it with the given RNG.
export function buildDeck(rng) {
  const deck = [];
  for (const [id, count] of DECK_RECIPE) {
    const def = cardById(id);
    for (let i = 0; i < count; i++) deck.push(makeCardInstance(def));
  }
  rng.shuffle(deck);
  return deck;
}

// Draw one card into a hand. Returns {card} or {burned} or {fatigue}.
// A draw past the hand limit burns the card; an empty deck costs 1 life.
export function drawCard(player) {
  if (player.deck.length === 0) {
    player.life = Math.max(0, player.life - 1);
    return { fatigue: true };
  }
  const card = player.deck.pop();
  if (player.hand.length >= CFG.HAND_LIMIT) return { burned: card };
  player.hand.push(card);
  return { card };
}
