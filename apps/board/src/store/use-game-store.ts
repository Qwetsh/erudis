import { create } from 'zustand';
import { createGameSlice, type GameSlice } from '@erudis/shared';

export const useGameStore = create<GameSlice>()((...a) => ({
  ...createGameSlice(...a),
}));
