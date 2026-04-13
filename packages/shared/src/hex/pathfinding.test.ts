import { describe, it, expect } from 'vitest';
import { findReachable, findPath, buildCostMap } from './pathfinding.ts';
import { hexKey } from './coordinates.ts';
import type { TerrainType } from '../types.ts';
import type { HexCostMap } from './pathfinding.ts';

/** Helper : crée une petite carte de test */
function createTestMap(): { terrain: Map<string, TerrainType>; costMap: HexCostMap } {
  const terrain = new Map<string, TerrainType>();

  // Grille 5x5 centrée sur 0,0
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
      terrain.set(hexKey({ q, r }), 'plain');
    }
  }

  // Quelques terrains variés
  terrain.set(hexKey({ q: 1, r: 0 }), 'forest');    // coût 2
  terrain.set(hexKey({ q: 2, r: 0 }), 'mountain');   // coût 3
  terrain.set(hexKey({ q: 0, r: -1 }), 'road');      // coût 1
  terrain.set(hexKey({ q: -1, r: 0 }), 'impassable'); // infranchissable

  const costMap = buildCostMap(terrain);
  return { terrain, costMap };
}

describe('findReachable', () => {
  it('avec budget 0, seule l\'origine est atteignable', () => {
    const { costMap } = createTestMap();
    const reachable = findReachable({ q: 0, r: 0 }, 0, costMap);
    expect(reachable.size).toBe(1);
    expect(reachable.has(hexKey({ q: 0, r: 0 }))).toBe(true);
  });

  it('avec budget 1, les voisins plaine/route sont atteignables', () => {
    const { costMap } = createTestMap();
    const reachable = findReachable({ q: 0, r: 0 }, 1, costMap);

    // Voisins plaine/route coûtent 1, atteignables
    expect(reachable.has(hexKey({ q: 0, r: 1 }))).toBe(true);
    expect(reachable.has(hexKey({ q: 0, r: -1 }))).toBe(true); // road
    // Forêt coûte 2, pas atteignable avec budget 1
    expect(reachable.has(hexKey({ q: 1, r: 0 }))).toBe(false);
    // Infranchissable jamais atteignable
    expect(reachable.has(hexKey({ q: -1, r: 0 }))).toBe(false);
  });

  it('avec budget 2, la forêt est atteignable', () => {
    const { costMap } = createTestMap();
    const reachable = findReachable({ q: 0, r: 0 }, 2, costMap);
    expect(reachable.has(hexKey({ q: 1, r: 0 }))).toBe(true); // forest, coût 2
    expect(reachable.get(hexKey({ q: 1, r: 0 }))).toBe(2);
  });

  it('n\'inclut jamais les hex infranchissables', () => {
    const { costMap } = createTestMap();
    const reachable = findReachable({ q: 0, r: 0 }, 100, costMap);
    expect(reachable.has(hexKey({ q: -1, r: 0 }))).toBe(false);
  });

  it('n\'inclut pas les hex hors de la carte', () => {
    const { costMap } = createTestMap();
    const reachable = findReachable({ q: 0, r: 0 }, 100, costMap);
    // Hex très loin, pas dans la costMap
    expect(reachable.has(hexKey({ q: 10, r: 10 }))).toBe(false);
  });
});

describe('findPath', () => {
  it('chemin vers soi-même', () => {
    const { costMap } = createTestMap();
    const path = findPath({ q: 0, r: 0 }, { q: 0, r: 0 }, costMap);
    expect(path).toEqual([{ q: 0, r: 0 }]);
  });

  it('chemin vers un voisin direct', () => {
    const { costMap } = createTestMap();
    const path = findPath({ q: 0, r: 0 }, { q: 0, r: 1 }, costMap);
    expect(path).not.toBeNull();
    expect(path!.length).toBe(2);
    expect(path![0]).toEqual({ q: 0, r: 0 });
    expect(path![1]).toEqual({ q: 0, r: 1 });
  });

  it('contourne les obstacles infranchissables', () => {
    const { costMap } = createTestMap();
    // (-1,0) est infranchissable, le chemin vers (-2,0) doit contourner
    const path = findPath({ q: 0, r: 0 }, { q: -2, r: 0 }, costMap);
    expect(path).not.toBeNull();
    // Le chemin ne passe pas par (-1,0)
    const passesThrough = path!.some((p) => p.q === -1 && p.r === 0);
    expect(passesThrough).toBe(false);
  });

  it('retourne null si pas de chemin', () => {
    // Carte avec seulement l'origine, entourée de rien
    const costMap = new Map<string, number>();
    costMap.set(hexKey({ q: 0, r: 0 }), 1);
    const path = findPath({ q: 0, r: 0 }, { q: 5, r: 5 }, costMap);
    expect(path).toBeNull();
  });

  it('préfère le chemin le moins coûteux', () => {
    const { costMap } = createTestMap();
    // Chemin vers (1,0) = forêt coût 2
    // vs (0,-1) + (1,-1) = route + plaine coût 2
    const path = findPath({ q: 0, r: 0 }, { q: 1, r: -1 }, costMap);
    expect(path).not.toBeNull();
    // Le coût total du chemin devrait être optimal
    let totalCost = 0;
    for (let i = 1; i < path!.length; i++) {
      totalCost += costMap.get(hexKey(path![i])) ?? 0;
    }
    // route(1) + plaine(1) = 2, ou directement plaine(1)
    expect(totalCost).toBeLessThanOrEqual(2);
  });
});

describe('buildCostMap', () => {
  it('convertit correctement les terrains en coûts', () => {
    const terrain = new Map<string, TerrainType>();
    terrain.set('0,0', 'road');
    terrain.set('1,0', 'forest');
    terrain.set('2,0', 'impassable');

    const costMap = buildCostMap(terrain);
    expect(costMap.get('0,0')).toBe(1);
    expect(costMap.get('1,0')).toBe(2);
    expect(costMap.get('2,0')).toBe(Infinity);
  });
});
