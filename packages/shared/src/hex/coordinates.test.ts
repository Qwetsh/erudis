import { describe, it, expect } from 'vitest';
import { hexToPixel, pixelToHex, hexEquals, hexKey } from './coordinates.ts';

describe('hexToPixel / pixelToHex', () => {
  it('convertit l\'origine correctement', () => {
    const pixel = hexToPixel({ q: 0, r: 0 });
    expect(pixel.x).toBe(0);
    expect(pixel.y).toBe(0);
  });

  it('aller-retour hex → pixel → hex', () => {
    const coords = [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: -1, r: 1 },
      { q: 3, r: -2 },
      { q: -5, r: 3 },
    ];
    for (const coord of coords) {
      const pixel = hexToPixel(coord);
      const back = pixelToHex(pixel.x, pixel.y);
      expect(back).toEqual(coord);
    }
  });
});

describe('hexEquals', () => {
  it('retourne true pour des hex identiques', () => {
    expect(hexEquals({ q: 1, r: 2 }, { q: 1, r: 2 })).toBe(true);
  });

  it('retourne false pour des hex différents', () => {
    expect(hexEquals({ q: 1, r: 2 }, { q: 1, r: 3 })).toBe(false);
  });
});

describe('hexKey', () => {
  it('produit une clé unique', () => {
    expect(hexKey({ q: 3, r: -1 })).toBe('3,-1');
  });

  it('des hex différents ont des clés différentes', () => {
    expect(hexKey({ q: 1, r: 2 })).not.toBe(hexKey({ q: 2, r: 1 }));
  });
});
