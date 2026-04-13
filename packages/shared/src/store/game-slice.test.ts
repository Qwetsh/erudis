import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createGameSlice } from './game-slice.ts';
import type { GameSlice } from './game-slice.ts';
import type { PlayerRow } from '../supabase/types.ts';

function createTestStore() {
  return create<GameSlice>()((...a) => ({
    ...createGameSlice(...a),
  }));
}

function mockPlayer(overrides: Partial<PlayerRow> = {}): PlayerRow {
  return {
    id: crypto.randomUUID(),
    game_id: 'game-1',
    name: 'TestPlayer',
    character_id: null,
    archetype: null,
    hp: 100,
    hp_max: 100,
    atk: 10,
    def: 5,
    vit: 0,
    force: 0,
    gold: 0,
    position_q: 0,
    position_r: 0,
    is_connected: true,
    skip_next_turn: false,
    turns_played: 0,
    spawn_q: 0,
    spawn_r: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('gameSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('initialise avec un état vide', () => {
    const state = store.getState();
    expect(state.gameId).toBeNull();
    expect(state.gameCode).toBeNull();
    expect(state.phase).toBeNull();
    expect(state.players).toEqual([]);
  });

  it('setGame définit les infos de la partie', () => {
    store.getState().setGame('id-1', 'ABC123', 'lobby');
    const state = store.getState();
    expect(state.gameId).toBe('id-1');
    expect(state.gameCode).toBe('ABC123');
    expect(state.phase).toBe('lobby');
  });

  it('setPhase change la phase', () => {
    store.getState().setGame('id-1', 'ABC123', 'lobby');
    store.getState().setPhase('playing');
    expect(store.getState().phase).toBe('playing');
  });

  it('addPlayer ajoute un joueur', () => {
    const player = mockPlayer({ name: 'Alice' });
    store.getState().addPlayer(player);
    expect(store.getState().players).toHaveLength(1);
    expect(store.getState().players[0].name).toBe('Alice');
  });

  it('removePlayer retire un joueur', () => {
    const p1 = mockPlayer({ name: 'Alice' });
    const p2 = mockPlayer({ name: 'Bob' });
    store.getState().setPlayers([p1, p2]);
    store.getState().removePlayer(p1.id);
    expect(store.getState().players).toHaveLength(1);
    expect(store.getState().players[0].name).toBe('Bob');
  });

  it('updatePlayer met à jour un joueur', () => {
    const player = mockPlayer({ name: 'Alice', hp: 100 });
    store.getState().addPlayer(player);
    store.getState().updatePlayer(player.id, { hp: 50 });
    expect(store.getState().players[0].hp).toBe(50);
  });

  it('setTurn met à jour le tour', () => {
    store.getState().setTurn(3, 2);
    expect(store.getState().currentTurn).toBe(3);
    expect(store.getState().activePlayerIndex).toBe(2);
  });

  it('reset remet l\'état initial', () => {
    store.getState().setGame('id-1', 'ABC123', 'playing');
    store.getState().addPlayer(mockPlayer());
    store.getState().reset();
    const state = store.getState();
    expect(state.gameId).toBeNull();
    expect(state.players).toEqual([]);
  });
});
