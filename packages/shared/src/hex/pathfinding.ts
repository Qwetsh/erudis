import type { HexCoord, TerrainType } from '../types.ts';
import { TERRAIN_COSTS } from '../constants.ts';
import { getNeighbors } from './neighbors.ts';
import { hexKey } from './coordinates.ts';

export type HexCostMap = Map<string, number>;

/** Crée une cost map à partir d'une carte de terrains */
export function buildCostMap(terrain: Map<string, TerrainType>): HexCostMap {
  const costMap: HexCostMap = new Map();
  for (const [key, type] of terrain) {
    costMap.set(key, TERRAIN_COSTS[type]);
  }
  return costMap;
}

/**
 * Trouve tous les hex atteignables depuis `origin` avec un `budget` de déplacement.
 * Utilise l'algorithme de Dijkstra adapté aux hex.
 * Retourne une Map<hexKey, coût pour y arriver>.
 */
export function findReachable(
  origin: HexCoord,
  budget: number,
  costMap: HexCostMap,
): Map<string, number> {
  const visited = new Map<string, number>();
  const frontier: Array<{ coord: HexCoord; cost: number }> = [{ coord: origin, cost: 0 }];

  visited.set(hexKey(origin), 0);

  while (frontier.length > 0) {
    // Tri par coût croissant (priority queue simplifiée)
    frontier.sort((a, b) => a.cost - b.cost);
    const current = frontier.shift()!;

    for (const neighbor of getNeighbors(current.coord)) {
      const key = hexKey(neighbor);
      const moveCost = costMap.get(key);

      // Hex inexistant sur la carte ou infranchissable
      if (moveCost === undefined || moveCost === Infinity) continue;

      const totalCost = current.cost + moveCost;
      if (totalCost > budget) continue;

      const previousCost = visited.get(key);
      if (previousCost !== undefined && previousCost <= totalCost) continue;

      visited.set(key, totalCost);
      frontier.push({ coord: neighbor, cost: totalCost });
    }
  }

  return visited;
}

/**
 * Trouve le chemin le plus court entre `origin` et `target`.
 * Retourne le chemin (array de HexCoord incluant origin et target), ou null si aucun chemin.
 */
export function findPath(
  origin: HexCoord,
  target: HexCoord,
  costMap: HexCostMap,
): HexCoord[] | null {
  const originKey = hexKey(origin);
  const targetKey = hexKey(target);

  if (originKey === targetKey) return [origin];

  const visited = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const frontier: Array<{ coord: HexCoord; cost: number }> = [{ coord: origin, cost: 0 }];

  visited.set(originKey, 0);

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.cost - b.cost);
    const current = frontier.shift()!;
    const currentKey = hexKey(current.coord);

    if (currentKey === targetKey) {
      // Reconstruire le chemin
      const path: HexCoord[] = [];
      let key = targetKey;
      while (key !== originKey) {
        const [q, r] = key.split(',').map(Number);
        path.unshift({ q, r });
        const prev = cameFrom.get(key);
        if (!prev) return null;
        key = prev;
      }
      path.unshift(origin);
      return path;
    }

    for (const neighbor of getNeighbors(current.coord)) {
      const key = hexKey(neighbor);
      const moveCost = costMap.get(key);

      if (moveCost === undefined || moveCost === Infinity) continue;

      const totalCost = current.cost + moveCost;
      const previousCost = visited.get(key);
      if (previousCost !== undefined && previousCost <= totalCost) continue;

      visited.set(key, totalCost);
      cameFrom.set(key, currentKey);
      frontier.push({ coord: neighbor, cost: totalCost });
    }
  }

  return null;
}
