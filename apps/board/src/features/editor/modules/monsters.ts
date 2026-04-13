import { z } from 'zod';
import type { EditorModuleConfig } from '../types';

const monsterSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  hp: z.number().min(1),
  atk: z.number().min(0),
  zone: z.enum(['easy', 'medium', 'hard', 'final']),
  subject: z.string().nullable().optional(),
  loot_gold: z.number().min(0),
  loot_table: z.unknown().default([]),
  modifiers: z.unknown().default([]),
});

export const monstersModule: EditorModuleConfig = {
  tableName: 'monsters',
  title: 'Monstres',
  schema: monsterSchema,
  searchField: 'name',
  defaultValues: {
    name: '',
    hp: 50,
    atk: 8,
    zone: 'easy',
    subject: null,
    loot_gold: 10,
    loot_table: [],
    modifiers: [],
  },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'hp', label: 'Points de vie', type: 'number', required: true },
    { name: 'atk', label: 'Attaque', type: 'number', required: true },
    {
      name: 'zone',
      label: 'Zone',
      type: 'select',
      options: [
        { value: 'easy', label: 'Facile' },
        { value: 'medium', label: 'Moyenne' },
        { value: 'hard', label: 'Difficile' },
        { value: 'final', label: 'Finale' },
      ],
    },
    {
      name: 'subject',
      label: 'Matière',
      type: 'select',
      options: [
        { value: '', label: 'Aucune' },
        { value: 'svt', label: 'SVT' },
        { value: 'maths', label: 'Maths' },
        { value: 'history-geo', label: 'Histoire-Géo' },
        { value: 'french', label: 'Français' },
      ],
    },
    { name: 'loot_gold', label: 'Or de loot', type: 'number' },
    { name: 'loot_table', label: 'Table de loot', type: 'json' },
    { name: 'modifiers', label: 'Modifiers', type: 'json' },
  ],
};
