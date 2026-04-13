/**
 * Générateur de carte côté serveur (Deno Edge Function).
 * Copie du code de packages/shared/hex/map-generator.ts + noise.ts
 * adaptée pour Deno.
 */

type HexCoord = { q: number; r: number };
type TerrainType = 'road' | 'plain' | 'forest' | 'swamp' | 'mountain' | 'impassable';
type DifficultyZone = 'easy' | 'medium' | 'hard' | 'final';
type POIType = 'shop' | 'blacksmith' | 'sanctuary' | 'chest' | 'boss' | 'gate' | 'village' | 'spawn' | 'finalExam';

type HexTile = {
  q: number; r: number; terrain: TerrainType;
  zone: DifficultyZone; poi: POIType | null; discovered: boolean;
};

const TERRAIN_COSTS: Record<TerrainType, number> = {
  road: 1, plain: 1, forest: 2, swamp: 2, mountain: 3, impassable: Infinity,
};

function hexKey(c: HexCoord): string { return `${c.q},${c.r}`; }
function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q; const dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr));
}

function hexesInRadius(center: HexCoord, radius: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  return results;
}

function getNeighbors(c: HexCoord): HexCoord[] {
  return [
    { q: c.q + 1, r: c.r }, { q: c.q + 1, r: c.r - 1 }, { q: c.q, r: c.r - 1 },
    { q: c.q - 1, r: c.r }, { q: c.q - 1, r: c.r + 1 }, { q: c.q, r: c.r + 1 },
  ];
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function createPermTable(seed: number): number[] {
  const rng = seededRandom(seed);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  return [...perm, ...perm];
}

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number) { return a + t * (b - a); }
function grad(hash: number, x: number, y: number) {
  const h = hash & 3;
  const u = h < 2 ? x : y; const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin2D(x: number, y: number, perm: number[]): number {
  const X = Math.floor(x) & 255; const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x); const yf = y - Math.floor(y);
  const u = fade(xf); const v = fade(yf);
  return lerp(
    lerp(grad(perm[perm[X] + Y], xf, yf), grad(perm[perm[X + 1] + Y], xf - 1, yf), u),
    lerp(grad(perm[perm[X] + Y + 1], xf, yf - 1), grad(perm[perm[X + 1] + Y + 1], xf - 1, yf - 1), u), v,
  );
}

function fractalNoise(x: number, y: number, perm: number[]): number {
  let total = 0, amplitude = 1, frequency = 0.15, maxValue = 0;
  for (let i = 0; i < 4; i++) {
    total += perlin2D(x * frequency, y * frequency, perm) * amplitude;
    maxValue += amplitude; amplitude *= 0.5; frequency *= 2;
  }
  return total / maxValue;
}

function noiseToTerrain(noise: number): TerrainType {
  if (noise < -0.4) return 'mountain';
  if (noise < -0.15) return 'swamp';
  if (noise < 0.1) return 'forest';
  if (noise < 0.35) return 'plain';
  return 'road';
}

export function generateMapServer(params: { size: number; seed: number }) {
  const { size, seed } = params;
  const clampedSize = Math.max(6, Math.min(15, Math.floor(size / 2)));
  const perm = createPermTable(seed);
  const rng = seededRandom(seed + 42);

  const tiles = new Map<string, HexTile>();
  const allCoords = hexesInRadius({ q: 0, r: 0 }, clampedSize);

  for (const coord of allCoords) {
    const noise = fractalNoise(coord.q, coord.r, perm);
    tiles.set(hexKey(coord), {
      q: coord.q, r: coord.r, terrain: noiseToTerrain(noise),
      zone: 'easy', poi: null, discovered: false,
    });
  }

  tiles.get(hexKey({ q: 0, r: 0 }))!.terrain = 'road';
  for (const n of getNeighbors({ q: 0, r: 0 })) {
    const t = tiles.get(hexKey(n));
    if (t && t.terrain === 'impassable') t.terrain = 'plain';
  }

  const spawn: HexCoord = { q: 0, r: 0 };
  const candidates = allCoords.filter((c) => hexDistance(spawn, c) >= clampedSize - 1);
  const finalExam = candidates.length > 0
    ? candidates[Math.floor(rng() * candidates.length)]
    : { q: clampedSize, r: 0 };

  for (const tile of tiles.values()) {
    const dist = hexDistance(spawn, { q: tile.q, r: tile.r });
    const maxDist = hexDistance(spawn, finalExam);
    const ratio = maxDist > 0 ? dist / maxDist : 0;
    if (ratio < 0.3) tile.zone = 'easy';
    else if (ratio < 0.6) tile.zone = 'medium';
    else if (ratio < 0.85) tile.zone = 'hard';
    else tile.zone = 'final';
  }

  const spawnTile = tiles.get(hexKey(spawn))!;
  spawnTile.poi = 'spawn'; spawnTile.terrain = 'road'; spawnTile.discovered = true;
  const finalTile = tiles.get(hexKey(finalExam))!;
  finalTile.poi = 'finalExam'; finalTile.terrain = 'road';

  // Boutiques par zone
  for (const zone of ['easy', 'medium', 'hard'] as DifficultyZone[]) {
    const avail = Array.from(tiles.values()).filter((h) => h.zone === zone && h.poi === null && h.terrain !== 'impassable');
    if (avail.length > 0) avail[Math.floor(rng() * avail.length)].poi = 'shop';
  }

  // POI supplémentaires
  for (const tile of tiles.values()) {
    if (tile.poi !== null || tile.terrain === 'impassable') continue;
    const roll = rng();
    if (roll < 0.03) tile.poi = 'chest';
    else if (roll < 0.05) tile.poi = 'sanctuary';
    else if (roll < 0.065 && tile.zone !== 'easy') tile.poi = 'boss';
    else if (roll < 0.075) tile.poi = 'village';
  }

  // Gates aux frontières
  for (const tile of tiles.values()) {
    if (tile.poi !== null || tile.terrain === 'impassable') continue;
    const nZones = new Set(getNeighbors({ q: tile.q, r: tile.r })
      .map((n) => tiles.get(hexKey(n))).filter(Boolean).map((t) => t!.zone));
    if (nZones.size > 1 && rng() < 0.15) tile.poi = 'gate';
  }

  // Dévoiler spawn rayon 3
  for (const coord of hexesInRadius(spawn, 3)) {
    const tile = tiles.get(hexKey(coord));
    if (tile) tile.discovered = true;
  }

  return { tiles: Array.from(tiles.values()), spawn, finalExam, seed, size: clampedSize * 2 };
}
