import { z } from 'zod';
import type { EditorModuleConfig } from '../types';

const questSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().default(''),
  quest_type: z.enum(['classic', 'escape_game']),
  objectives: z.unknown().default([]),
  rewards: z.unknown().default({}),
  zone: z.enum(['easy', 'medium', 'hard', 'final']),
  escape_data: z.unknown().nullable().optional(),
  active: z.boolean().default(true),
});

export const questsModule: EditorModuleConfig = {
  tableName: 'quests',
  title: 'Quêtes',
  schema: questSchema,
  searchField: 'name',
  defaultValues: {
    name: '',
    description: '',
    quest_type: 'classic',
    objectives: [],
    rewards: {},
    zone: 'easy',
    escape_data: null,
    active: true,
  },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'quest_type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'classic', label: 'Classique' },
        { value: 'escape_game', label: 'Escape Game' },
      ],
    },
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
      name: 'objectives',
      label: 'Objectifs',
      type: 'json',
      placeholder: '[{"type": "kill", "target": "slime", "count": 3}]',
    },
    {
      name: 'rewards',
      label: 'Récompenses',
      type: 'json',
      placeholder: '{"gold": 50}',
    },
    { name: 'escape_data', label: 'Données Escape Game', type: 'json' },
    { name: 'active', label: 'Active', type: 'boolean' },
  ],
};
