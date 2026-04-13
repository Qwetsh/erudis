import type { TerrainType, DieType } from './types.ts';

/** Nombre maximum de joueurs par partie */
export const MAX_PLAYERS = 10;

/** Taille de l'inventaire de base (+ FORCE) */
export const BASE_INVENTORY_SIZE = 2;

/** Nombre de slots d'équipement */
export const EQUIPMENT_SLOTS = 4;

/** Rayon de vision pour le brouillard de guerre */
export const FOG_VISION_RADIUS = 3;

/** Protection anti-PvP (nombre de tours) */
export const PVP_PROTECTION_TURNS = 3;

/** Nombre de questions dans l'épreuve finale */
export const FINAL_EXAM_QUESTIONS = 7;

/** Questions requises pour réussir l'épreuve finale */
export const FINAL_EXAM_PASS_THRESHOLD = 5;

/** Anti-répétition : nombre de questions exclues */
export const QUESTION_ANTI_REPEAT = 12;

/** Timer PvP par défaut (secondes) */
export const PVP_TIMER_SECONDS = 30;

/** Constante K pour les dégâts PvP */
export const PVP_DAMAGE_K = 3;

/** Pourcentage d'or volé en PvP (min/max) */
export const PVP_GOLD_STEAL_MIN = 0.05;
export const PVP_GOLD_STEAL_MAX = 0.10;

/** Coûts de terrain par défaut */
export const TERRAIN_COSTS: Record<TerrainType, number> = {
  road: 1,
  plain: 1,
  forest: 2,
  swamp: 2,
  mountain: 3,
  impassable: Infinity,
} as const;

/** Types de dés disponibles */
export const DICE_TYPES: readonly DieType[] = ['d4', 'd6', 'd8', 'd10'] as const;

/** Valeur max par type de dé */
export const DIE_MAX: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
} as const;

/** Multiplicateurs par type de question */
export const QUESTION_MULTIPLIERS: Record<string, number> = {
  duo: 2,
  quatre: 4,
  cash: 8,
} as const;

/** Raretés d'objets ordonnées */
export const RARITIES = ['common', 'rare', 'legendary'] as const;

/** Longueur du code de partie */
export const GAME_CODE_LENGTH = 6;

/** Mondes thématiques par matière */
export const WORLDS = {
  bioma: { name: 'Bioma', subject: 'svt', color: '#22c55e' },
  arithmos: { name: 'Arithmos', subject: 'maths', color: '#3b82f6' },
  chronos: { name: 'Chronos', subject: 'history-geo', color: '#f59e0b' },
  lexica: { name: 'Lexica', subject: 'french', color: '#a855f7' },
} as const;
