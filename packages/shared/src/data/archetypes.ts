import type { Archetype } from '../types.ts';

export type ArchetypeInfo = {
  id: Archetype;
  name: string;
  description: string;
  stats: {
    hp: number;
    atk: number;
    def: number;
    vit: number;
    force: number;
  };
};

export const ARCHETYPES: ArchetypeInfo[] = [
  {
    id: 'explorer',
    name: 'Explorateur',
    description: 'Rapide et agile, réduit le coût des terrains difficiles.',
    stats: { hp: 90, atk: 8, def: 5, vit: 3, force: 1 },
  },
  {
    id: 'tank',
    name: 'Tank',
    description: 'Résistant, encaisse les dégâts et récupère après combat.',
    stats: { hp: 140, atk: 6, def: 9, vit: 0, force: 2 },
  },
  {
    id: 'striker',
    name: 'Frappeur',
    description: 'Puissant en attaque, mise tout sur les dégâts.',
    stats: { hp: 80, atk: 14, def: 3, vit: 1, force: 1 },
  },
  {
    id: 'merchant',
    name: 'Marchand',
    description: 'Malin en commerce, revend au double et a plus d\'inventaire.',
    stats: { hp: 100, atk: 7, def: 5, vit: 1, force: 3 },
  },
  {
    id: 'scholar',
    name: 'Savant',
    description: 'Expert en questions, peut éliminer une mauvaise réponse.',
    stats: { hp: 100, atk: 9, def: 6, vit: 1, force: 1 },
  },
  {
    id: 'scout',
    name: 'Éclaireur',
    description: 'Spécialiste du terrain, traverse les montagnes facilement.',
    stats: { hp: 85, atk: 8, def: 4, vit: 4, force: 1 },
  },
];
