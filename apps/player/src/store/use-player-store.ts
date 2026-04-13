import { create } from 'zustand';
import { createPlayerSlice, type PlayerSlice } from '@erudis/shared';

export const usePlayerStore = create<PlayerSlice>()((...a) => ({
  ...createPlayerSlice(...a),
}));
