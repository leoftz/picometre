// Deterministic pseudo-random numbers, so a given seed always yields the same curve (P-36).

/** 32-bit FNV-1a hash of a string. */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32: small, fast, good enough for Monte Carlo sampling (not for cryptography). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal deviate (Box–Muller). */
export function standardNormal(random: () => number): number {
  const u1 = 1 - random(); // in (0, 1], avoids log(0)
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Independent stream for (seed, a, b): lets each draw and each drink get stable deviates. */
export function streamFor(seed: number, a: number, b = 0): () => number {
  return mulberry32(seed ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 1, 0x85ebca77));
}
