/**
 * Générateur de bruit Perlin 2D simplifié avec seed reproductible.
 * Basé sur l'algorithme classique de Ken Perlin.
 */

/** Générateur pseudo-aléatoire avec seed */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Crée une table de permutation à partir d'une seed */
function createPermTable(seed: number): number[] {
  const rng = seededRandom(seed);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  return [...perm, ...perm]; // Double pour éviter les débordements
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/**
 * Retourne une valeur de bruit Perlin 2D entre -1 et 1.
 */
export function perlin2D(x: number, y: number, perm: number[]): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const u = fade(xf);
  const v = fade(yf);

  const aa = perm[perm[X] + Y];
  const ab = perm[perm[X] + Y + 1];
  const ba = perm[perm[X + 1] + Y];
  const bb = perm[perm[X + 1] + Y + 1];

  return lerp(
    lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v,
  );
}

/**
 * Bruit Perlin multi-octave (fractal noise) pour plus de détail.
 */
export function fractalNoise(
  x: number,
  y: number,
  perm: number[],
  octaves = 4,
  persistence = 0.5,
  scale = 0.1,
): number {
  let total = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += perlin2D(x * frequency, y * frequency, perm) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxValue; // Normalise entre -1 et 1
}

export { createPermTable, seededRandom };
