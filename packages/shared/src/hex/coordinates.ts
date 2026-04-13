import type { HexCoord } from '../types.ts';

/** Taille d'un hex (rayon du flat-top hexagone) */
const DEFAULT_HEX_SIZE = 32;

/** Convertit des coordonnées axiales (q, r) en pixels (centre du hex) — flat-top */
export function hexToPixel(coord: HexCoord, size = DEFAULT_HEX_SIZE): { x: number; y: number } {
  const x = size * (3 / 2 * coord.q);
  const y = size * (Math.sqrt(3) / 2 * coord.q + Math.sqrt(3) * coord.r);
  return { x, y };
}

/** Convertit des coordonnées pixel en coordonnées axiales fractionnaires */
export function pixelToHex(x: number, y: number, size = DEFAULT_HEX_SIZE): HexCoord {
  const q = (2 / 3 * x) / size;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / size;
  return hexRound(q, r);
}

/** Arrondit des coordonnées fractionnaires au hex le plus proche */
function hexRound(qFrac: number, rFrac: number): HexCoord {
  const sFrac = -qFrac - rFrac;

  let q = Math.round(qFrac);
  let r = Math.round(rFrac);
  const s = Math.round(sFrac);

  const qDiff = Math.abs(q - qFrac);
  const rDiff = Math.abs(r - rFrac);
  const sDiff = Math.abs(s - sFrac);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }

  return { q, r };
}

/** Vérifie si deux hex sont identiques */
export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

/** Crée une clé string unique pour un hex (utile pour Maps/Sets) */
export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}
