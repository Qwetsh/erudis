import { describe, it, expect } from 'vitest';
import { applyModifiers } from './pipeline.ts';
import type { Modifier, ModifierContext } from './types.ts';

describe('applyModifiers', () => {
  describe('filtrage et tri', () => {
    it('ne s\'applique qu\'aux modifiers du bon trigger', () => {
      const mods: Modifier[] = [
        { trigger: 'ROLL_DICE', priority: 10, condition: null, effect: { type: 'SET', field: 'die', value: 'd10' } },
        { trigger: 'TERRAIN_COST', priority: 10, condition: null, effect: { type: 'SET', field: 'cost', value: 0 } },
      ];
      const ctx: ModifierContext = { die: 'd6' };
      const result = applyModifiers('ROLL_DICE', ctx, mods);
      expect(result.die).toBe('d10');
    });

    it('trie par priorité croissante', () => {
      const mods: Modifier[] = [
        { trigger: 'CALC_PVE_DAMAGE', priority: 20, condition: null, effect: { type: 'MULTIPLY', field: 'damage', value: 2 } },
        { trigger: 'CALC_PVE_DAMAGE', priority: 10, condition: null, effect: { type: 'SET', field: 'damage', value: 5 } },
      ];
      const result = applyModifiers('CALC_PVE_DAMAGE', { damage: 10 }, mods);
      // SET(5) d'abord (priority 10), puis MULTIPLY(2) (priority 20)
      expect(result.damage).toBe(10);
    });
  });

  describe('effet SET', () => {
    it('remplace la valeur', () => {
      const mods: Modifier[] = [
        { trigger: 'ROLL_DICE', priority: 10, condition: null, effect: { type: 'SET', field: 'die', value: 'd10' } },
      ];
      const result = applyModifiers('ROLL_DICE', { die: 'd6' }, mods);
      expect(result.die).toBe('d10');
    });
  });

  describe('effet ADD', () => {
    it('ajoute à la valeur', () => {
      const mods: Modifier[] = [
        { trigger: 'CALC_PVE_DAMAGE', priority: 10, condition: null, effect: { type: 'ADD', field: 'damage', value: 5 } },
      ];
      const result = applyModifiers('CALC_PVE_DAMAGE', { damage: 10 }, mods);
      expect(result.damage).toBe(15);
    });
  });

  describe('effet MULTIPLY', () => {
    it('multiplie la valeur', () => {
      const mods: Modifier[] = [
        { trigger: 'CALC_PVE_DAMAGE', priority: 10, condition: null, effect: { type: 'MULTIPLY', field: 'damage', value: 1.5 } },
      ];
      const result = applyModifiers('CALC_PVE_DAMAGE', { damage: 10 }, mods);
      expect(result.damage).toBe(15);
    });
  });

  describe('effet BLOCK', () => {
    it('bloque et arrête le pipeline', () => {
      const mods: Modifier[] = [
        { trigger: 'ROLL_DICE', priority: 10, condition: null, effect: { type: 'BLOCK', field: '', value: null } },
        { trigger: 'ROLL_DICE', priority: 20, condition: null, effect: { type: 'SET', field: 'die', value: 'd10' } },
      ];
      const result = applyModifiers('ROLL_DICE', { die: 'd6' }, mods);
      expect(result.__blocked).toBe(true);
      expect(result.die).toBe('d6'); // Le SET n'a pas été appliqué
    });
  });

  describe('effet TRIGGER', () => {
    it('enregistre un effet secondaire', () => {
      const mods: Modifier[] = [
        { trigger: 'CALC_PVE_DAMAGE', priority: 10, condition: null, effect: { type: 'TRIGGER', field: '', value: { action: 'heal', amount: 10 } } },
      ];
      const result = applyModifiers('CALC_PVE_DAMAGE', { damage: 10 }, mods);
      expect(result.__triggers).toEqual([{ action: 'heal', amount: 10 }]);
    });
  });

  describe('effet REPLACE', () => {
    it('remplace le contexte', () => {
      const mods: Modifier[] = [
        { trigger: 'ROLL_DICE', priority: 10, condition: null, effect: { type: 'REPLACE', field: '', value: { die: 'd4', bonus: 3 } } },
      ];
      const result = applyModifiers('ROLL_DICE', { die: 'd6' }, mods);
      expect(result.die).toBe('d4');
      expect(result.bonus).toBe(3);
    });
  });

  describe('conditions', () => {
    it('applique le modifier quand la condition est vraie', () => {
      const mods: Modifier[] = [
        {
          trigger: 'TERRAIN_COST',
          priority: 10,
          condition: { field: 'terrain', operator: '==', value: 'forest' },
          effect: { type: 'SET', field: 'cost', value: 1 },
        },
      ];
      const result = applyModifiers('TERRAIN_COST', { terrain: 'forest', cost: 2 }, mods);
      expect(result.cost).toBe(1);
    });

    it('ignore le modifier quand la condition est fausse', () => {
      const mods: Modifier[] = [
        {
          trigger: 'TERRAIN_COST',
          priority: 10,
          condition: { field: 'terrain', operator: '==', value: 'forest' },
          effect: { type: 'SET', field: 'cost', value: 1 },
        },
      ];
      const result = applyModifiers('TERRAIN_COST', { terrain: 'mountain', cost: 3 }, mods);
      expect(result.cost).toBe(3);
    });

    it('supporte les opérateurs de comparaison', () => {
      const mods: Modifier[] = [
        {
          trigger: 'CALC_PVE_DAMAGE',
          priority: 10,
          condition: { field: 'hp', operator: '<', value: 30 },
          effect: { type: 'MULTIPLY', field: 'damage', value: 2 },
        },
      ];
      expect(applyModifiers('CALC_PVE_DAMAGE', { hp: 20, damage: 10 }, mods).damage).toBe(20);
      expect(applyModifiers('CALC_PVE_DAMAGE', { hp: 50, damage: 10 }, mods).damage).toBe(10);
    });
  });

  describe('combinaisons', () => {
    it('chaîne plusieurs modifiers correctement', () => {
      const mods: Modifier[] = [
        { trigger: 'CALC_PVE_DAMAGE', priority: 10, condition: null, effect: { type: 'ADD', field: 'damage', value: 5 } },
        { trigger: 'CALC_PVE_DAMAGE', priority: 20, condition: null, effect: { type: 'MULTIPLY', field: 'damage', value: 2 } },
      ];
      const result = applyModifiers('CALC_PVE_DAMAGE', { damage: 10 }, mods);
      // (10 + 5) * 2 = 30
      expect(result.damage).toBe(30);
    });

    it('ne modifie pas le contexte original', () => {
      const ctx: ModifierContext = { damage: 10 };
      const mods: Modifier[] = [
        { trigger: 'CALC_PVE_DAMAGE', priority: 10, condition: null, effect: { type: 'ADD', field: 'damage', value: 5 } },
      ];
      applyModifiers('CALC_PVE_DAMAGE', ctx, mods);
      expect(ctx.damage).toBe(10);
    });
  });
});
