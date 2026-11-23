// Scripted auto-play. One job: play a full game with no input, using the same
// rules and AI as the interactive game, and report the result in the title.
// ?autoplay=win biases the player to win, ?autoplay=loss biases the other way,
// ?autoplay=random plays both sides straight. Deterministic from the seed.
import { newGame, startTurn, endTurn, checkWinner } from './state.js';
import { chooseAction, applyAction } from './ai.js';

export function runAutoplay(seed, mode) {
  const state = newGame(seed);
  state.screen = 'playing';
  const skills = mode === 'win'
    ? { you: 'strong', foe: 'weak' }
    : mode === 'loss'
      ? { you: 'weak', foe: 'strong' }
      : { you: 'strong', foe: 'strong' };
  startTurn(state, 'you');
  let guard = 0;
  while (state.screen === 'playing' && guard < 600) {
    guard += 1;
    const side = state.active;
    delete state[side]._weakPlayed;
    let acts = 0;
    while (acts < 60) {
      const action = chooseAction(state, side, { skill: skills[side] });
      if (!action) break;
      applyAction(state, side, action);
      acts += 1;
      if (state.screen !== 'playing') break;
    }
    if (state.screen !== 'playing') break;
    endTurn(state);
    checkWinner(state);
  }
  const result = state.screen === 'win' ? 'WIN' : state.screen === 'loss' ? 'LOSS' : 'DRAW';
  document.title = result;
  console.log(`autoplay=${mode} seed=${seed} result=${result} turns=${state.turn} life=${state.you.life}-${state.foe.life}`);
  return { state, result };
}
