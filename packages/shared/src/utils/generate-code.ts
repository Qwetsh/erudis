import { GAME_CODE_LENGTH } from '../constants.ts';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Génère un code de partie aléatoire (6 caractères, sans ambiguïté I/O/0/1) */
export function generateGameCode(): string {
  let code = '';
  for (let i = 0; i < GAME_CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
