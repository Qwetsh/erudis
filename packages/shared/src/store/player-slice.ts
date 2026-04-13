import type { StateCreator } from 'zustand';
import type { GamePhase, Archetype } from '../types.ts';

export type PlayerSlice = {
  playerId: string | null;
  playerName: string | null;
  gameId: string | null;
  gameCode: string | null;
  phase: GamePhase | null;
  selectedArchetype: Archetype | null;
  characterId: string | null;

  setPlayer: (playerId: string, playerName: string) => void;
  setGameInfo: (gameId: string, gameCode: string, phase: GamePhase) => void;
  setPhase: (phase: GamePhase) => void;
  selectArchetype: (archetype: Archetype) => void;
  setCharacterId: (characterId: string) => void;
  reset: () => void;
};

const initialState = {
  playerId: null,
  playerName: null,
  gameId: null,
  gameCode: null,
  phase: null,
  selectedArchetype: null,
  characterId: null,
};

export const createPlayerSlice: StateCreator<PlayerSlice> = (set) => ({
  ...initialState,

  setPlayer: (playerId, playerName) =>
    set({ playerId, playerName }),

  setGameInfo: (gameId, gameCode, phase) =>
    set({ gameId, gameCode, phase }),

  setPhase: (phase) =>
    set({ phase }),

  selectArchetype: (archetype) =>
    set({ selectedArchetype: archetype }),

  setCharacterId: (characterId) =>
    set({ characterId }),

  reset: () => set(initialState),
});
