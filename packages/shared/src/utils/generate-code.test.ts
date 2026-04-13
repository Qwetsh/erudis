import { describe, it, expect } from 'vitest';
import { generateGameCode } from './generate-code.ts';
import { GAME_CODE_LENGTH } from '../constants.ts';

describe('generateGameCode', () => {
  it('génère un code de la bonne longueur', () => {
    const code = generateGameCode();
    expect(code).toHaveLength(GAME_CODE_LENGTH);
  });

  it('ne contient que des caractères non ambigus', () => {
    const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
    for (let i = 0; i < 100; i++) {
      const code = generateGameCode();
      expect(code).toMatch(validChars);
    }
  });

  it('exclut les caractères ambigus (I, O, 0, 1)', () => {
    const codes = Array.from({ length: 500 }, () => generateGameCode()).join('');
    expect(codes).not.toContain('I');
    expect(codes).not.toContain('O');
    expect(codes).not.toContain('0');
    expect(codes).not.toContain('1');
  });

  it('génère des codes différents', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateGameCode()));
    expect(codes.size).toBeGreaterThan(40);
  });
});
