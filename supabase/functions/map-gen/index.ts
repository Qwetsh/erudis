import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';
import { corsHeaders } from '../_shared/cors.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

// Import du générateur de carte — copie simplifiée du code shared
// En production, ce code serait synchronisé depuis packages/shared
import { generateMapServer } from './generate.ts';

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
      case 'GENERATE':
        return await handleGenerate(supabase, payload);
      default:
        return errorResponse('UNKNOWN_ACTION', `Action inconnue: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return errorResponse('INTERNAL_ERROR', message, 500);
  }
});

async function handleGenerate(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, size, seed } = payload as {
    gameId: string;
    size?: number;
    seed?: number;
  };

  if (!gameId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId requis');
  }

  // Vérifier que la partie existe
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, seed')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return errorResponse('GAME_NOT_FOUND', 'Partie introuvable');
  }

  const mapSeed = seed ?? game.seed;
  const mapSize = size ?? 16;

  // Générer la carte
  const map = generateMapServer({ size: mapSize, seed: mapSeed });

  // Supprimer les hex existants de cette partie
  await supabase.from('map_hexes').delete().eq('game_id', gameId);

  // Insérer les nouveaux hex par batches
  const batchSize = 100;
  const rows = map.tiles.map((tile: { q: number; r: number; terrain: string; zone: string; poi: string | null; discovered: boolean }) => ({
    game_id: gameId,
    q: tile.q,
    r: tile.r,
    terrain: tile.terrain,
    zone: tile.zone,
    poi: tile.poi,
    discovered: tile.discovered,
    content: {},
  }));

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('map_hexes').insert(batch);
    if (error) {
      return errorResponse('INSERT_FAILED', error.message, 500);
    }
  }

  return jsonResponse({
    spawn: map.spawn,
    finalExam: map.finalExam,
    tileCount: map.tiles.length,
    seed: mapSeed,
  });
}
