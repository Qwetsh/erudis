import type { StateCreator } from 'zustand';
import type { GamePhase } from '../types.ts';
import type { PlayerRow } from '../supabase/types.ts';

export type GameSlice = {
  gameId: string | null;
  gameCode: string | null;
  phase: GamePhase | null;
  players: PlayerRow[];
  currentTurn: number;
  activePlayerIndex: number;

  setGame: (gameId: string, gameCode: string, phase: GamePhase) => void;
  setPhase: (phase: GamePhase) => void;
  setPlayers: (players: PlayerRow[]) => void;
  addPlayer: (player: PlayerRow) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<PlayerRow>) => void;
  setTurn: (turn: number, activeIndex: number) => void;
  reset: () => void;
};

const initialState = {
  gameId: null,
  gameCode: null,
  phase: null,
  players: [],
  currentTurn: 0,
  activePlayerIndex: 0,
};

export const createGameSlice: StateCreator<GameSlice> = (set) => ({
  ...initialState,

  setGame: (gameId, gameCode, phase) =>
    set({ gameId, gameCode, phase }),

  setPhase: (phase) =>
    set({ phase }),

  setPlayers: (players) =>
    set({ players }),

  addPlayer: (player) =>
    set((s) => ({ players: [...s.players, player] })),

  removePlayer: (playerId) =>
    set((s) => ({ players: s.players.filter((p) => p.id !== playerId) })),

  updatePlayer: (playerId, updates) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p
      ),
    })),

  setTurn: (currentTurn, activePlayerIndex) =>
    set({ currentTurn, activePlayerIndex }),

  reset: () => set(initialState),
});
