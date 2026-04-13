import { z } from 'zod';
import type { EditorModuleConfig } from '../types';

const itemSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().default(''),
  item_type: z.enum(['equipment', 'consumable']),
  equip_slot: z.string().nullable().optional(),
  rarity: z.enum(['common', 'rare', 'legendary']),
  use_context: z.string().nullable().optional(),
  stats: z.unknown().default({}),
  modifiers: z.unknown().default([]),
  buy_price: z.number().min(0),
  sell_price: z.number().min(0),
});

export const itemsModule: EditorModuleConfig = {
  tableName: 'items',
  title: 'Objets',
  schema: itemSchema,
  searchField: 'name',
  defaultValues: {
    name: '',
    description: '',
    item_type: 'equipment',
    equip_slot: null,
    rarity: 'common',
    use_context: null,
    stats: {},
    modifiers: [],
    buy_price: 10,
    sell_price: 5,
  },
  fields: [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'item_type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'equipment', label: 'Équipement' },
        { value: 'consumable', label: 'Consommable' },
      ],
    },
    {
      name: 'equip_slot',
      label: 'Slot',
      type: 'select',
      options: [
        { value: '', label: 'Aucun' },
        { value: 'head', label: 'Tête' },
        { value: 'body', label: 'Corps' },
        { value: 'tool', label: 'Outil' },
        { value: 'accessory', label: 'Accessoire' },
      ],
    },
    {
      name: 'rarity',
      label: 'Rareté',
      type: 'select',
      options: [
        { value: 'common', label: 'Commun' },
        { value: 'rare', label: 'Rare' },
        { value: 'legendary', label: 'Légendaire' },
      ],
    },
    {
      name: 'use_context',
      label: 'Contexte d\'utilisation',
      type: 'select',
      options: [
        { value: '', label: 'Aucun' },
        { value: 'combat', label: 'Combat' },
        { value: 'map_own_turn', label: 'Carte (son tour)' },
        { value: 'anytime', label: 'N\'importe quand' },
      ],
    },
    { name: 'stats', label: 'Stats', type: 'json' },
    { name: 'modifiers', label: 'Modifiers', type: 'json' },
    { name: 'buy_price', label: 'Prix d\'achat', type: 'number' },
    { name: 'sell_price', label: 'Prix de revente', type: 'number' },
  ],
};
