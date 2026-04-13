import { z } from 'zod';
import type { EditorModuleConfig } from '../types';

const encounterSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  encounter_type: z.enum(['ambush', 'narrative']),
  zone: z.enum(['easy', 'medium', 'hard', 'final']),
  description: z.string().default(''),
  ambush_penalty: z.unknown().default({}),
  choices: z.unknown().default([]),
  spawn_chance: z.number().min(0).max(1),
});

export const encountersModule: EditorModuleConfig = {
  tableName: 'encounters',
  title: 'Rencontres',
  schema: encounterSchema,
  searchField: 'name',
  defaultValues: {
    name: '',
    encounter_type: 'ambush',
    zone: 'easy',
    description: '',
    ambush_penalty: {},
    choices: [],
    spawn_chance: 0.3,
  },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    {
      name: 'encounter_type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'ambush', label: 'Embuscade' },
        { value: 'narrative', label: 'Narrative' },
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
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'ambush_penalty', label: 'Pénalité embuscade', type: 'json', placeholder: '{"hp_loss": 10, "gold_loss": 20}' },
    { name: 'choices', label: 'Choix narratifs', type: 'json', placeholder: '[{"label": "...", "consequence": {...}}]' },
    { name: 'spawn_chance', label: 'Chance d\'apparition (0-1)', type: 'number' },
  ],
};
