import type { HexCoord, TerrainType } from '../types.ts';
import { hexKey } from './coordinates.ts';
import { getNeighbors, hexDistance, hexesInRadius } from './neighbors.ts';
import { findPath, buildCostMap } from './pathfinding.ts';
import { fractalNoise, createPermTable, seededRandom } from './noise.ts';

export type DifficultyZone = 'easy' | 'medium' | 'hard' | 'final';

export type POIType = 'shop' | 'blacksmith' | 'sanctuary' | 'chest' | 'boss' | 'gate' | 'village' | 'spawn' | 'finalExam';

export type HexTile = {
  q: number;
  r: number;
  terrain: TerrainType;
  zone: DifficultyZone;
  poi: POIType | null;
  discovered: boolean;
};

export type MapGenParams = {
  size: number; // rayon de la carte (12-30)
  seed: number;
};

export type GeneratedMap = {
  tiles: HexTile[];
  spawn: HexCoord;
  finalExam: HexCoord;
  seed: number;
  size: number;
};

/**
 * Génère une carte hexagonale procéduralement en 4 passes.
 */
export function generateMap(params: MapGenParams): GeneratedMap {
  const { size, seed } = params;
  const clampedSize = Math.max(6, Math.min(15, Math.floor(size / 2)));
  const perm = createPermTable(seed);
  const rng = seededRandom(seed + 42);

  // Passe 1 : Perlin → terrains
  const tiles = new Map<string, HexTile>();
  const allCoords = hexesInRadius({ q: 0, r: 0 }, clampedSize);

  for (const coord of allCoords) {
    const noise = fractalNoise(coord.q, coord.r, perm, 4, 0.5, 0.15);
    const terrain = noiseToTerrain(noise);
    tiles.set(hexKey(coord), {
      q: coord.q,
      r: coord.r,
      terrain,
      zone: 'easy',
      poi: null,
      discovered: false,
    });
  }

  // Assurer des routes au centre
  tiles.get(hexKey({ q: 0, r: 0 }))!.terrain = 'road';
  for (const n of getNeighbors({ q: 0, r: 0 })) {
    const t = tiles.get(hexKey(n));
    if (t && t.terrain === 'impassable') t.terrain = 'plain';
  }

  // Passe 2 : Zones de difficulté
  const spawn: HexCoord = { q: 0, r: 0 };
  const candidates = allCoords.filter((c) => hexDistance(spawn, c) >= clampedSize - 1);
  const finalExam = candidates.length > 0
    ? candidates[Math.floor(rng() * candidates.length)]
    : { q: clampedSize, r: 0 };

  for (const [, tile] of tiles) {
    const dist = hexDistance(spawn, { q: tile.q, r: tile.r });
    const maxDist = hexDistance(spawn, finalExam);
    const ratio = maxDist > 0 ? dist / maxDist : 0;

    if (ratio < 0.3) tile.zone = 'easy';
    else if (ratio < 0.6) tile.zone = 'medium';
    else if (ratio < 0.85) tile.zone = 'hard';
    else tile.zone = 'final';
  }

  // Passe 3 : POI
  const spawnTile = tiles.get(hexKey(spawn))!;
  spawnTile.poi = 'spawn';
  spawnTile.terrain = 'road';
  spawnTile.discovered = true;

  const finalTile = tiles.get(hexKey(finalExam))!;
  finalTile.poi = 'finalExam';
  finalTile.terrain = 'road';

  // Placer au moins 1 boutique par zone (sauf finale)
  const zoneHexes = groupByZone(tiles);
  for (const zone of ['easy', 'medium', 'hard'] as DifficultyZone[]) {
    const hexes = zoneHexes.get(zone) ?? [];
    const available = hexes.filter((h) => h.poi === null && h.terrain !== 'impassable');
    if (available.length > 0) {
      available[Math.floor(rng() * available.length)].poi = 'shop';
    }
  }

  // Placer des gates entre les zones
  placeGates(tiles, rng);

  // Placer des POI supplémentaires
  placePOIs(tiles, rng);

  // Passe 4 : Validation
  const costMap = buildCostMap(new Map(
    Array.from(tiles.entries()).map(([k, t]) => [k, t.terrain]),
  ));

  const path1 = findPath(spawn, finalExam, costMap);
  if (!path1) {
    // Forcer un chemin en mettant les hex en plaine
    forceConnection(tiles, spawn, finalExam);
  }

  // Dévoiler le rayon 3 autour du spawn
  const spawnVisible = hexesInRadius(spawn, 3);
  for (const coord of spawnVisible) {
    const tile = tiles.get(hexKey(coord));
    if (tile) tile.discovered = true;
  }

  return {
    tiles: Array.from(tiles.values()),
    spawn,
    finalExam,
    seed,
    size: clampedSize * 2,
  };
}

function noiseToTerrain(noise: number): TerrainType {
  if (noise < -0.4) return 'mountain';
  if (noise < -0.15) return 'swamp';
  if (noise < 0.1) return 'forest';
  if (noise < 0.35) return 'plain';
  return 'road';
}

function groupByZone(tiles: Map<string, HexTile>): Map<DifficultyZone, HexTile[]> {
  const groups = new Map<DifficultyZone, HexTile[]>();
  for (const tile of tiles.values()) {
    const arr = groups.get(tile.zone) ?? [];
    arr.push(tile);
    groups.set(tile.zone, arr);
  }
  return groups;
}

function placeGates(
  tiles: Map<string, HexTile>,
  rng: () => number,
) {
  // Placer des gates aux frontières de zones
  for (const tile of tiles.values()) {
    if (tile.poi !== null) continue;
    if (tile.terrain === 'impassable') continue;

    const neighbors = getNeighbors({ q: tile.q, r: tile.r });
    const neighborZones = new Set(
      neighbors
        .map((n) => tiles.get(hexKey(n)))
        .filter((t) => t !== undefined)
        .map((t) => t!.zone),
    );

    // Si cet hex est sur une frontière entre zones
    if (neighborZones.size > 1 && rng() < 0.15) {
      tile.poi = 'gate';
    }
  }
}

function placePOIs(tiles: Map<string, HexTile>, rng: () => number) {
  for (const tile of tiles.values()) {
    if (tile.poi !== null) continue;
    if (tile.terrain === 'impassable') continue;

    const roll = rng();
    if (roll < 0.03) tile.poi = 'chest';
    else if (roll < 0.05) tile.poi = 'sanctuary';
    else if (roll < 0.065 && tile.zone !== 'easy') tile.poi = 'boss';
    else if (roll < 0.075) tile.poi = 'village';
  }
}

function forceConnection(tiles: Map<string, HexTile>, from: HexCoord, to: HexCoord) {
  // Stratégie simple : ligne droite approximative en changeant les terrains
  const steps = hexDistance(from, to);
  let current = { ...from };

  for (let i = 0; i < steps; i++) {
    const neighbors = getNeighbors(current);
    // Choisir le voisin le plus proche de la destination
    let bestNeighbor = neighbors[0];
    let bestDist = Infinity;
    for (const n of neighbors) {
      const d = hexDistance(n, to);
      if (d < bestDist && tiles.has(hexKey(n))) {
        bestDist = d;
        bestNeighbor = n;
      }
    }

    const tile = tiles.get(hexKey(bestNeighbor));
    if (tile && tile.terrain === 'impassable') {
      tile.terrain = 'plain';
    }
    current = bestNeighbor;
  }
}
