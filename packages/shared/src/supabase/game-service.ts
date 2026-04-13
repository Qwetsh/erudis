/**
 * Service client-side pour les opérations de jeu.
 * Remplace les Edge Functions (non déployées) en faisant
 * les mêmes opérations directement via le client Supabase.
 */
import { supabase } from './client.ts';
import { generateGameCode } from '../utils/generate-code.ts';
import { generateMap } from '../hex/map-generator.ts';
import type { Result } from '../types.ts';

// =================== GAME SESSION ===================

export async function createGame(): Promise<Result<{ game: Record<string, unknown> }>> {
  let code = '';
  let attempts = 0;
  const db = supabase as any;

  while (attempts < 10) {
    code = generateGameCode();
    const { data: existing } = await db
      .from('games')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (!existing) break;
    attempts++;
  }

  if (attempts >= 10) {
    return { success: false, error: { code: 'CODE_GENERATION_FAILED', message: 'Impossible de générer un code unique' } };
  }

  const seed = Math.floor(Math.random() * 2147483647);

  const { data: game, error } = await db
    .from('games')
    .insert({
      code,
      phase: 'lobby',
      current_turn: 0,
      current_player_index: 0,
      config: { seed },
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: { code: 'CREATE_FAILED', message: error.message } };
  }

  return { success: true, data: { game } };
}

export async function joinGame(code: string, playerName: string): Promise<Result<{ game: Record<string, unknown>; player: Record<string, unknown> }>> {
  if (!code || !playerName) {
    return { success: false, error: { code: 'INVALID_PAYLOAD', message: 'code et playerName requis' } };
  }

  const db = supabase as any;

  const { data: game, error: gameError } = await db
    .from('games')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (gameError || !game) {
    return { success: false, error: { code: 'GAME_NOT_FOUND', message: 'Partie introuvable avec ce code' } };
  }

  if (game.phase !== 'lobby') {
    return { success: false, error: { code: 'GAME_NOT_IN_LOBBY', message: 'La partie a déjà commencé' } };
  }

  const { count } = await db
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', game.id);

  if (count !== null && count >= 10) {
    return { success: false, error: { code: 'GAME_FULL', message: 'La partie est pleine (10 joueurs max)' } };
  }

  const { data: player, error: playerError } = await db
    .from('players')
    .insert({
      game_id: game.id,
      name: playerName,
      hp: 100,
      hp_max: 100,
      atk: 10,
      def: 5,
      vit: 0,
      force: 0,
      gold: 0,
      position_q: 0,
      position_r: 0,
      spawn_q: 0,
      spawn_r: 0,
      is_connected: true,
      skip_next_turn: false,
      turns_played: 0,
    })
    .select()
    .single();

  if (playerError) {
    return { success: false, error: { code: 'JOIN_FAILED', message: playerError.message } };
  }

  return { success: true, data: { game, player } };
}

export async function startGame(gameId: string): Promise<Result<{ game: Record<string, unknown>; players: Record<string, unknown>[] }>> {
  if (!gameId) {
    return { success: false, error: { code: 'INVALID_PAYLOAD', message: 'gameId requis' } };
  }

  const db = supabase as any;

  const { data: game, error: gameError } = await db
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return { success: false, error: { code: 'GAME_NOT_FOUND', message: 'Partie introuvable' } };
  }

  if (game.phase !== 'lobby') {
    return { success: false, error: { code: 'GAME_NOT_IN_LOBBY', message: 'La partie n\'est pas en lobby' } };
  }

  const { data: players } = await db
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .eq('is_connected', true);

  if (!players || players.length === 0) {
    return { success: false, error: { code: 'NO_PLAYERS', message: 'Aucun joueur connecté' } };
  }

  // Seed depuis config ou valeur par défaut
  const seed = (game.config as any)?.seed ?? Math.floor(Math.random() * 2147483647);
  const mapResult = generateMap({ size: 16, seed });

  // Supprimer les hex existants
  await db.from('map_hexes').delete().eq('game_id', gameId);

  // Insérer les hex par batch (sans colonne content)
  const batchSize = 100;
  const rows = mapResult.tiles.map((tile) => ({
    game_id: gameId,
    q: tile.q,
    r: tile.r,
    terrain: tile.terrain,
    zone: tile.zone,
    poi: tile.poi,
    discovered: tile.discovered,
  }));

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await db.from('map_hexes').insert(batch);
    if (error) {
      return { success: false, error: { code: 'MAP_INSERT_FAILED', message: error.message } };
    }
  }

  // Transition lobby → playing
  const { data: updatedGame, error: updateError } = await db
    .from('games')
    .update({ phase: 'playing', current_turn: 1 })
    .eq('id', gameId)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: { code: 'START_FAILED', message: updateError.message } };
  }

  return { success: true, data: { game: updatedGame, players } };
}
