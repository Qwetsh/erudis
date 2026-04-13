import type { StateCreator } from 'zustand';
import type { HexTile } from '../hex/map-generator.ts';
import type { HexCoord, TurnPhase } from '../types.ts';

export type MapSlice = {
  tiles: HexTile[];
  turnPhase: TurnPhase | null;
  movementBudget: number;
  diceResult: number | null;
  reachableHexes: Set<string>;

  setTiles: (tiles: HexTile[]) => void;
  updateTile: (q: number, r: number, updates: Partial<HexTile>) => void;
  revealTiles: (coords: HexCoord[]) => void;
  setTurnPhase: (phase: TurnPhase) => void;
  setDiceResult: (result: number, budget: number) => void;
  setReachableHexes: (hexes: Set<string>) => void;
  clearMovement: () => void;
};

export const createMapSlice: StateCreator<MapSlice> = (set) => ({
  tiles: [],
  turnPhase: null,
  movementBudget: 0,
  diceResult: null,
  reachableHexes: new Set(),

  setTiles: (tiles) => set({ tiles }),

  updateTile: (q, r, updates) =>
    set((s) => ({
      tiles: s.tiles.map((t) =>
        t.q === q && t.r === r ? { ...t, ...updates } : t,
      ),
    })),

  revealTiles: (coords) =>
    set((s) => {
      const keys = new Set(coords.map((c) => `${c.q},${c.r}`));
      return {
        tiles: s.tiles.map((t) =>
          keys.has(`${t.q},${t.r}`) ? { ...t, discovered: true } : t,
        ),
      };
    }),

  setTurnPhase: (phase) => set({ turnPhase: phase }),

  setDiceResult: (result, budget) =>
    set({ diceResult: result, movementBudget: budget }),

  setReachableHexes: (hexes) => set({ reachableHexes: hexes }),

  clearMovement: () =>
    set({ diceResult: null, movementBudget: 0, reachableHexes: new Set() }),
});
