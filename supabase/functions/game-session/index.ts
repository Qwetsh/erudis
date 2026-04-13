import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';
import { corsHeaders } from '../_shared/cors.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

const GAME_CODE_LENGTH = 6;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateGameCode(): string {
  let code = '';
  for (let i = 0; i < GAME_CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

type ActionPayload = {
  action: string;
  payload: Record<string, unknown>;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { action, payload } = (await req.json()) as ActionPayload;

    switch (action) {
      case 'CREATE':
        return await handleCreate(supabase, payload);
      case 'JOIN':
        return await handleJoin(supabase, payload);
      case 'START':
        return await handleStart(supabase, payload);
      default:
        return errorResponse('UNKNOWN_ACTION', `Action inconnue: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return errorResponse('INTERNAL_ERROR', message, 500);
  }
});

async function handleCreate(
  supabase: ReturnType<typeof createClient>,
  _payload: Record<string, unknown>,
) {
  // Générer un code unique avec retry
  let code = '';
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    code = generateGameCode();
    const { data: existing } = await supabase
      .from('games')
      .select('id')
      .eq('code', code)
      .single();

    if (!existing) break;
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return errorResponse('CODE_GENERATION_FAILED', 'Impossible de générer un code unique');
  }

  const { data: game, error } = await supabase
    .from('games')
    .insert({
      code,
      phase: 'lobby',
      current_turn: 0,
      active_player_index: 0,
      config: {},
      seed: Math.floor(Math.random() * 2147483647),
    })
    .select()
    .single();

  if (error) {
    return errorResponse('CREATE_FAILED', error.message, 500);
  }

  return jsonResponse({ game });
}

async function handleJoin(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { code, playerName } = payload as { code: string; playerName: string };

  if (!code || !playerName) {
    return errorResponse('INVALID_PAYLOAD', 'code et playerName requis');
  }

  // Vérifier que la partie existe et est en lobby
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (gameError || !game) {
    return errorResponse('GAME_NOT_FOUND', 'Partie introuvable avec ce code');
  }

  if (game.phase !== 'lobby') {
    return errorResponse('GAME_NOT_IN_LOBBY', 'La partie a déjà commencé');
  }

  // Compter les joueurs existants
  const { count } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', game.id);

  if (count !== null && count >= 10) {
    return errorResponse('GAME_FULL', 'La partie est pleine (10 joueurs max)');
  }

  // Créer le joueur
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      name: playerName,
      hp: 100,
      max_hp: 100,
      atk: 10,
      def: 5,
      vit: 0,
      force: 0,
      gold: 0,
      position_q: 0,
      position_r: 0,
      turn_order: (count ?? 0) + 1,
      is_connected: true,
      is_dead: false,
      skip_next_turn: false,
      turns_played: 0,
    })
    .select()
    .single();

  if (playerError) {
    return errorResponse('JOIN_FAILED', playerError.message, 500);
  }

  return jsonResponse({ game, player });
}

async function handleStart(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId } = payload as { gameId: string };

  if (!gameId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId requis');
  }

  // Vérifier que la partie est en lobby
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return errorResponse('GAME_NOT_FOUND', 'Partie introuvable');
  }

  if (game.phase !== 'lobby') {
    return errorResponse('GAME_NOT_IN_LOBBY', 'La partie n\'est pas en lobby');
  }

  // Vérifier qu'il y a au moins 1 joueur connecté
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .eq('is_connected', true);

  if (!players || players.length === 0) {
    return errorResponse('NO_PLAYERS', 'Aucun joueur connecté');
  }

  // Transition lobby → playing
  const { data: updatedGame, error: updateError } = await supabase
    .from('games')
    .update({ phase: 'playing', current_turn: 1 })
    .eq('id', gameId)
    .select()
    .single();

  if (updateError) {
    return errorResponse('START_FAILED', updateError.message, 500);
  }

  return jsonResponse({ game: updatedGame, players });
}
