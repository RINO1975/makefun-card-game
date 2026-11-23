// Procedural WebAudio sounds. One job: tiny beeps and stingers, no audio files.
// Everything is guarded so a headless browser without audio never breaks.
let ctx = null;
let muted = false;

function ac() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type = 'sine', vol = 0.08, when = 0) {
  const c = ac();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(c.currentTime + when);
    o.stop(c.currentTime + when + dur + 0.02);
  } catch {
    // Audio is decoration; never break the game.
  }
}

export const sfx = {
  play() {
    tone(520, 0.09, 'triangle', 0.08);
    tone(780, 0.12, 'triangle', 0.06, 0.05);
  },
  attack() {
    tone(220, 0.1, 'sawtooth', 0.07);
    tone(140, 0.14, 'sawtooth', 0.07, 0.06);
  },
  damage() {
    tone(180, 0.12, 'square', 0.05);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.08, i * 0.12));
  },
  loss() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.07, i * 0.13));
  },
  deny() {
    tone(140, 0.08, 'square', 0.04);
  },
  toggleMute() {
    muted = !muted;
    return muted;
  },
  isMuted() {
    return muted;
  },
};
