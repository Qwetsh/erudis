import type { TerrainType, DifficultyZone, POIType } from '@erudis/shared';

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  road: '#c8b88a',
  plain: '#7cb342',
  forest: '#2e7d32',
  swamp: '#5d4037',
  mountain: '#78909c',
  impassable: '#263238',
};

export const ZONE_BORDER_COLORS: Record<DifficultyZone, string> = {
  easy: '#4caf50',
  medium: '#ff9800',
  hard: '#f44336',
  final: '#9c27b0',
};

export const POI_ICONS: Record<POIType, string> = {
  shop: '🏪',
  blacksmith: '⚒️',
  sanctuary: '⛪',
  chest: '📦',
  boss: '💀',
  gate: '🚧',
  village: '🏘️',
  spawn: '🏠',
  finalExam: '🏆',
};
