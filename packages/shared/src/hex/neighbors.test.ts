import { describe, it, expect } from 'vitest';
import { getNeighbors, hexDistance, hexesInRadius } from './neighbors.ts';

describe('getNeighbors', () => {
  it('retourne exactement 6 voisins', () => {
    const neighbors = getNeighbors({ q: 0, r: 0 });
    expect(neighbors).toHaveLength(6);
  });

  it('les voisins de l\'origine sont corrects', () => {
    const neighbors = getNeighbors({ q: 0, r: 0 });
    const expected = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
    ];
    expect(neighbors).toEqual(expected);
  });

  it('fonctionne pour un hex quelconque', () => {
    const neighbors = getNeighbors({ q: 2, r: 3 });
    expect(neighbors).toHaveLength(6);
    // Chaque voisin est à distance 1
    for (const n of neighbors) {
      expect(hexDistance({ q: 2, r: 3 }, n)).toBe(1);
    }
  });
});

describe('hexDistance', () => {
  it('distance de soi-même est 0', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
  });

  it('distance d\'un voisin est 1', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
  });

  it('distance le long d\'un axe', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: 0 })).toBe(3);
  });

  it('distance diagonale', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
  });

  it('est symétrique', () => {
    const a = { q: 1, r: 3 };
    const b = { q: -2, r: 5 };
    expect(hexDistance(a, b)).toBe(hexDistance(b, a));
  });
});

describe('hexesInRadius', () => {
  it('rayon 0 retourne seulement le centre', () => {
    const hexes = hexesInRadius({ q: 0, r: 0 }, 0);
    expect(hexes).toHaveLength(1);
    expect(hexes[0]).toEqual({ q: 0, r: 0 });
  });

  it('rayon 1 retourne 7 hex (centre + 6 voisins)', () => {
    const hexes = hexesInRadius({ q: 0, r: 0 }, 1);
    expect(hexes).toHaveLength(7);
  });

  it('rayon 2 retourne 19 hex', () => {
    const hexes = hexesInRadius({ q: 0, r: 0 }, 2);
    expect(hexes).toHaveLength(19);
  });

  it('rayon 3 retourne 37 hex', () => {
    const hexes = hexesInRadius({ q: 0, r: 0 }, 3);
    expect(hexes).toHaveLength(37);
  });
});
