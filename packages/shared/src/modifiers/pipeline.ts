import type { Modifier, ModifierContext, ModifierAction, ModifierCondition } from './types.ts';

/**
 * Applique tous les modificateurs pertinents au contexte.
 * Les modifiers sont filtrés par trigger, évalués par condition,
 * triés par priorité (croissante), et appliqués séquentiellement.
 *
 * @returns Le contexte modifié. Si un modifier BLOCK est rencontré, `context.__blocked = true`.
 */
export function applyModifiers(
  action: ModifierAction,
  context: ModifierContext,
  modifiers: Modifier[],
): ModifierContext {
  // Filtrer par trigger
  const relevant = modifiers.filter((m) => m.trigger === action);

  // Trier par priorité croissante
  relevant.sort((a, b) => a.priority - b.priority);

  let result = { ...context };

  for (const modifier of relevant) {
    // Évaluer la condition
    if (modifier.condition && !evaluateCondition(modifier.condition, result)) {
      continue;
    }

    // Appliquer l'effet
    result = applyEffect(result, modifier.effect);

    // Si bloqué, arrêter
    if (result.__blocked) break;
  }

  return result;
}

function evaluateCondition(condition: ModifierCondition, context: ModifierContext): boolean {
  if (!condition) return true;

  const { field, operator, value } = condition;
  const fieldValue = context[field];

  switch (operator) {
    case '==': return fieldValue === value;
    case '!=': return fieldValue !== value;
    case '<': return (fieldValue as number) < (value as number);
    case '>': return (fieldValue as number) > (value as number);
    case '<=': return (fieldValue as number) <= (value as number);
    case '>=': return (fieldValue as number) >= (value as number);
    default: return true;
  }
}

function applyEffect(
  context: ModifierContext,
  effect: { type: string; field: string; value: unknown },
): ModifierContext {
  const result = { ...context };

  switch (effect.type) {
    case 'SET':
      result[effect.field] = effect.value;
      break;

    case 'ADD':
      result[effect.field] = (result[effect.field] as number) + (effect.value as number);
      break;

    case 'MULTIPLY':
      result[effect.field] = (result[effect.field] as number) * (effect.value as number);
      break;

    case 'REPLACE':
      // Remplace tout le contexte par la valeur
      if (typeof effect.value === 'object' && effect.value !== null) {
        Object.assign(result, effect.value);
      }
      break;

    case 'BLOCK':
      result.__blocked = true;
      break;

    case 'TRIGGER':
      // Enregistre un effet secondaire à traiter
      const triggers = (result.__triggers as unknown[]) ?? [];
      triggers.push(effect.value);
      result.__triggers = triggers;
      break;
  }

  return result;
}
