import { z } from 'zod';
import type { EditorModuleConfig } from '../types';

const eventSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().default(''),
  event_type: z.enum(['positive', 'negative']),
  zone: z.enum(['easy', 'medium', 'hard', 'final']),
  effects: z.unknown().default({}),
});

export const eventsModule: EditorModuleConfig = {
  tableName: 'game_events',
  title: 'Événements',
  schema: eventSchema,
  searchField: 'name',
  defaultValues: {
    name: '',
    description: '',
    event_type: 'positive',
    zone: 'easy',
    effects: {},
  },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'event_type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'positive', label: 'Positif' },
        { value: 'negative', label: 'Négatif' },
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
      name: 'effects',
      label: 'Effets',
      type: 'json',
      placeholder: '{"gold": 20, "heal": 10}',
    },
  ],
};
