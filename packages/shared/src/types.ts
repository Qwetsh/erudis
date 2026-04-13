/** Coordonnées axiales hex (q, r) */
export type HexCoord = {
  q: number;
  r: number;
};

/** Types de terrain avec coûts de déplacement */
export type TerrainType = 'road' | 'plain' | 'forest' | 'swamp' | 'mountain' | 'impassable';

/** Archétypes de personnages */
export type Archetype = 'explorer' | 'tank' | 'striker' | 'merchant' | 'scholar' | 'scout';

/** Matières scolaires */
export type Subject = 'svt' | 'maths' | 'history-geo' | 'french';

/** Raretés d'objets */
export type Rarity = 'common' | 'rare' | 'legendary';

/** Slots d'équipement */
export type EquipSlot = 'head' | 'body' | 'tool' | 'accessory';

/** Phases de jeu (XState) */
export type GamePhase = 'lobby' | 'playing' | 'gameOver';

/** Phases du tour */
export type TurnPhase = 'rollDice' | 'movement' | 'interaction' | 'combat' | 'endTurn';

/** Types de dé */
export type DieType = 'd4' | 'd6' | 'd8' | 'd10';

/** Difficulté des questions */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** Type de question */
export type QuestionType = 'duo' | 'quatre' | 'cash';

/** Result Object — pattern serveur */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/** Action envoyée à une Edge Function */
export type EdgeAction<T = unknown> = {
  action: string;
  payload: T;
};
