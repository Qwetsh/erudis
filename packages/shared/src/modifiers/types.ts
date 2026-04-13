/** Actions qui peuvent être modifiées par le pipeline */
export type ModifierAction =
  | 'ROLL_DICE'
  | 'CALC_PVE_DAMAGE'
  | 'CALC_PVE_RECEIVED_DAMAGE'
  | 'CALC_PVP_DAMAGE'
  | 'TERRAIN_COST'
  | 'QUESTION_TIMER';

/** Types d'effets applicables */
export type EffectType = 'SET' | 'ADD' | 'MULTIPLY' | 'REPLACE' | 'BLOCK' | 'TRIGGER';

/** Source d'un modificateur */
export type ModifierSource = 'equipment' | 'passive' | 'consumable' | 'terrain' | 'config';

/** Un effet individuel dans un modifier */
export type ModifierEffect = {
  type: EffectType;
  field: string;
  value: unknown;
};

/** Condition optionnelle pour l'application */
export type ModifierCondition = {
  field: string;
  operator: '==' | '!=' | '<' | '>' | '<=' | '>=';
  value: unknown;
} | null;

/** Un modificateur complet */
export type Modifier = {
  id?: string;
  trigger: ModifierAction;
  priority: number;
  condition: ModifierCondition;
  effect: ModifierEffect;
  source?: ModifierSource;
  sourceId?: string;
};

/** Le contexte passé au pipeline (entrée/sortie) */
export type ModifierContext = Record<string, unknown>;
