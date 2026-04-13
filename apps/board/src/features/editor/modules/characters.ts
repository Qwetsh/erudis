import { z } from 'zod';
import type { EditorModuleConfig } from '../types';

const characterSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  archetype: z.enum(['explorer', 'tank', 'striker', 'merchant', 'scholar', 'scout']),
  subject: z.enum(['svt', 'maths', 'history-geo', 'french']),
  hp: z.number().min(1),
  atk: z.number().min(0),
  def: z.number().min(0),
  vit: z.number().min(0),
  force: z.number().min(0),
  passive_name: z.string().default(''),
  passive_description: z.string().default(''),
  passive_modifier: z.unknown().default([]),
});

export const charactersModule: EditorModuleConfig = {
  tableName: 'characters',
  title: 'Personnages',
  schema: characterSchema,
  searchField: 'name',
  defaultValues: {
    name: '',
    archetype: 'explorer',
    subject: 'svt',
    hp: 100,
    atk: 8,
    def: 5,
    vit: 1,
    force: 1,
    passive_name: '',
    passive_description: '',
    passive_modifier: [],
  },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    {
      name: 'archetype',
      label: 'Archétype',
      type: 'select',
      options: [
        { value: 'explorer', label: 'Explorateur' },
        { value: 'tank', label: 'Tank' },
        { value: 'striker', label: 'Frappeur' },
        { value: 'merchant', label: 'Marchand' },
        { value: 'scholar', label: 'Savant' },
        { value: 'scout', label: 'Éclaireur' },
      ],
    },
    {
      name: 'subject',
      label: 'Matière',
      type: 'select',
      options: [
        { value: 'svt', label: 'SVT' },
        { value: 'maths', label: 'Maths' },
        { value: 'history-geo', label: 'Histoire-Géo' },
        { value: 'french', label: 'Français' },
      ],
    },
    { name: 'hp', label: 'PV', type: 'number' },
    { name: 'atk', label: 'ATK', type: 'number' },
    { name: 'def', label: 'DEF', type: 'number' },
    { name: 'vit', label: 'VIT', type: 'number' },
    { name: 'force', label: 'FORCE', type: 'number' },
    { name: 'passive_name', label: 'Nom du passif', type: 'text' },
    { name: 'passive_description', label: 'Description du passif', type: 'textarea' },
    { name: 'passive_modifier', label: 'Modifier du passif (JSON)', type: 'json' },
  ],
};
