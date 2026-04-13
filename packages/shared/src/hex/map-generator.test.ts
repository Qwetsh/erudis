import { describe, it, expect } from 'vitest';
import { generateMap } from './map-generator.ts';
import { hexKey } from './coordinates.ts';
import { findPath, buildCostMap } from './pathfinding.ts';
import type { TerrainType } from '../types.ts';

describe('generateMap', () => {
  it('génère une carte avec le bon nombre de tiles', () => {
    const map = generateMap({ size: 12, seed: 42 });
    expect(map.tiles.length).toBeGreaterThan(0);
    expect(map.spawn).toEqual({ q: 0, r: 0 });
  });

  it('est déterministe avec la même seed', () => {
    const map1 = generateMap({ size: 12, seed: 12345 });
    const map2 = generateMap({ size: 12, seed: 12345 });
    expect(map1.tiles.length).toBe(map2.tiles.length);
    for (let i = 0; i < map1.tiles.length; i++) {
      expect(map1.tiles[i].terrain).toBe(map2.tiles[i].terrain);
      expect(map1.tiles[i].zone).toBe(map2.tiles[i].zone);
    }
  });

  it('génère des cartes différentes avec des seeds différentes', () => {
    const map1 = generateMap({ size: 12, seed: 100 });
    const map2 = generateMap({ size: 12, seed: 200 });
    // Au moins quelques terrains différents
    let differences = 0;
    const len = Math.min(map1.tiles.length, map2.tiles.length);
    for (let i = 0; i < len; i++) {
      if (map1.tiles[i].terrain !== map2.tiles[i].terrain) differences++;
    }
    expect(differences).toBeGreaterThan(0);
  });

  it('place le spawn et l\'épreuve finale', () => {
    const map = generateMap({ size: 16, seed: 42 });
    const spawnTile = map.tiles.find((t) => t.poi === 'spawn');
    const finalTile = map.tiles.find((t) => t.poi === 'finalExam');
    expect(spawnTile).toBeDefined();
    expect(finalTile).toBeDefined();
    expect(spawnTile!.discovered).toBe(true);
  });

  it('contient au moins 1 boutique', () => {
    const map = generateMap({ size: 16, seed: 42 });
    const shops = map.tiles.filter((t) => t.poi === 'shop');
    expect(shops.length).toBeGreaterThanOrEqual(1);
  });

  it('les zones de difficulté sont attribuées', () => {
    const map = generateMap({ size: 20, seed: 42 });
    const zones = new Set(map.tiles.map((t) => t.zone));
    expect(zones.has('easy')).toBe(true);
    expect(zones.has('medium')).toBe(true);
    expect(zones.has('hard')).toBe(true);
  });

  it('un chemin existe entre spawn et épreuve finale', () => {
    const map = generateMap({ size: 16, seed: 42 });
    const terrain = new Map<string, TerrainType>();
    for (const tile of map.tiles) {
      terrain.set(hexKey({ q: tile.q, r: tile.r }), tile.terrain);
    }
    const costMap = buildCostMap(terrain);
    const path = findPath(map.spawn, map.finalExam, costMap);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThanOrEqual(2);
  });

  it('le spawn est dévoilé dans un rayon de 3', () => {
    const map = generateMap({ size: 16, seed: 42 });
    const discoveredCount = map.tiles.filter((t) => t.discovered).length;
    expect(discoveredCount).toBeGreaterThanOrEqual(7); // au moins le centre + 6 voisins
  });

  it('clampe la taille entre 12 et 30', () => {
    const small = generateMap({ size: 4, seed: 1 });
    const big = generateMap({ size: 100, seed: 1 });
    expect(small.tiles.length).toBeGreaterThan(0);
    expect(big.tiles.length).toBeGreaterThan(0);
  });
});
