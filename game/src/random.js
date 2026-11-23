// Seeded RNG (mulberry32). One job: deterministic randomness for shuffles,
// draws and AI picks, so a seed reproduces a game exactly.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.next = mulberry32(this.seed);
  }
  // Float in [0, 1).
  float() {
    return this.next();
  }
  // Integer in [0, n).
  int(n) {
    return Math.floor(this.next() * n);
  }
  // Pick one element.
  pick(arr) {
    return arr[this.int(arr.length)];
  }
  // Fisher-Yates shuffle, in place, driven by this RNG.
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }
}
