import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createPlayerSlice } from './player-slice.ts';
import type { PlayerSlice } from './player-slice.ts';

function createTestStore() {
  return create<PlayerSlice>()((...a) => ({
    ...createPlayerSlice(...a),
  }));
}

describe('playerSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('initialise avec un état vide', () => {
    const state = store.getState();
    expect(state.playerId).toBeNull();
    expect(state.gameId).toBeNull();
    expect(state.selectedArchetype).toBeNull();
  });

  it('setPlayer définit les infos du joueur', () => {
    store.getState().setPlayer('p1', 'Alice');
    expect(store.getState().playerId).toBe('p1');
    expect(store.getState().playerName).toBe('Alice');
  });

  it('setGameInfo définit les infos de la partie', () => {
    store.getState().setGameInfo('g1', 'ABC123', 'lobby');
    expect(store.getState().gameId).toBe('g1');
    expect(store.getState().gameCode).toBe('ABC123');
    expect(store.getState().phase).toBe('lobby');
  });

  it('selectArchetype sélectionne un archétype', () => {
    store.getState().selectArchetype('tank');
    expect(store.getState().selectedArchetype).toBe('tank');
  });

  it('setCharacterId définit l\'id du personnage', () => {
    store.getState().setCharacterId('char-1');
    expect(store.getState().characterId).toBe('char-1');
  });

  it('reset remet l\'état initial', () => {
    store.getState().setPlayer('p1', 'Alice');
    store.getState().selectArchetype('striker');
    store.getState().reset();
    expect(store.getState().playerId).toBeNull();
    expect(store.getState().selectedArchetype).toBeNull();
  });
});
