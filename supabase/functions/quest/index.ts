import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';
import { corsHeaders } from '../_shared/cors.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

type ActionPayload = { action: string; payload: Record<string, unknown> };

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
      case 'LIST_AVAILABLE':
        return await handleListAvailable(supabase, payload);
      case 'ACCEPT':
        return await handleAccept(supabase, payload);
      case 'UPDATE_PROGRESS':
        return await handleUpdateProgress(supabase, payload);
      case 'VALIDATE':
        return await handleValidate(supabase, payload);
      case 'FIND_CLUE':
        return await handleFindClue(supabase, payload);
      case 'SHARE_CLUE':
        return await handleShareClue(supabase, payload);
      case 'SOLVE_ESCAPE':
        return await handleSolveEscape(supabase, payload);
      default:
        return errorResponse('UNKNOWN_ACTION', `Action inconnue: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return errorResponse('INTERNAL_ERROR', message, 500);
  }
});

async function handleListAvailable(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, zone } = payload as { playerId: string; zone?: string };

  // Récupérer les quêtes déjà acceptées par le joueur
  const { data: activeQuests } = await supabase
    .from('player_quests')
    .select('quest_id')
    .eq('player_id', playerId)
    .in('status', ['active', 'completed']);

  const excludeIds = (activeQuests ?? []).map((pq: { quest_id: string }) => pq.quest_id);

  let query = supabase.from('quests').select('*').eq('active', true);
  if (zone) query = query.eq('zone', zone);

  const { data: quests } = await query;

  const available = (quests ?? []).filter(
    (q: { id: string }) => !excludeIds.includes(q.id),
  );

  return jsonResponse({ quests: available });
}

async function handleAccept(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, questId, gameId } = payload as {
    playerId: string;
    questId: string;
    gameId: string;
  };

  if (!playerId || !questId || !gameId) {
    return errorResponse('INVALID_PAYLOAD', 'playerId, questId et gameId requis');
  }

  // Vérifier que la quête n'est pas déjà acceptée
  const { data: existing } = await supabase
    .from('player_quests')
    .select('id')
    .eq('player_id', playerId)
    .eq('quest_id', questId)
    .eq('status', 'active')
    .single();

  if (existing) {
    return errorResponse('ALREADY_ACCEPTED', 'Quête déjà acceptée');
  }

  const { data: playerQuest } = await supabase
    .from('player_quests')
    .insert({
      player_id: playerId,
      quest_id: questId,
      game_id: gameId,
      progress: {},
      status: 'active',
    })
    .select()
    .single();

  return jsonResponse({ accepted: true, playerQuestId: playerQuest?.id });
}

async function handleUpdateProgress(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, playerQuestId, objectiveType, increment } = payload as {
    playerId: string;
    playerQuestId: string;
    objectiveType: string;
    increment: number;
  };

  if (!playerId || !playerQuestId || !objectiveType) {
    return errorResponse('INVALID_PAYLOAD', 'playerId, playerQuestId et objectiveType requis');
  }

  const { data: pq } = await supabase
    .from('player_quests')
    .select('*, quests(*)')
    .eq('id', playerQuestId)
    .eq('player_id', playerId)
    .eq('status', 'active')
    .single();

  if (!pq) return errorResponse('QUEST_NOT_FOUND', 'Quête active introuvable');

  const progress = (pq.progress as Record<string, number>) ?? {};
  progress[objectiveType] = (progress[objectiveType] ?? 0) + (increment ?? 1);

  await supabase
    .from('player_quests')
    .update({ progress })
    .eq('id', playerQuestId);

  // Vérifier si tous les objectifs sont remplis
  const quest = (pq as any).quests;
  const objectives = (quest.objectives ?? []) as Array<{ type: string; count: number }>;
  const allComplete = objectives.every(
    (obj) => (progress[obj.type] ?? 0) >= obj.count,
  );

  return jsonResponse({ progress, allComplete });
}

async function handleValidate(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, playerQuestId } = payload as {
    playerId: string;
    playerQuestId: string;
  };

  if (!playerId || !playerQuestId) {
    return errorResponse('INVALID_PAYLOAD', 'playerId et playerQuestId requis');
  }

  const { data: pq } = await supabase
    .from('player_quests')
    .select('*, quests(*)')
    .eq('id', playerQuestId)
    .eq('player_id', playerId)
    .eq('status', 'active')
    .single();

  if (!pq) return errorResponse('QUEST_NOT_FOUND', 'Quête active introuvable');

  const quest = (pq as any).quests;
  const objectives = (quest.objectives ?? []) as Array<{ type: string; count: number }>;
  const progress = (pq.progress as Record<string, number>) ?? {};

  const allComplete = objectives.every(
    (obj) => (progress[obj.type] ?? 0) >= obj.count,
  );

  if (!allComplete) {
    return errorResponse('OBJECTIVES_INCOMPLETE', 'Tous les objectifs ne sont pas remplis');
  }

  // Distribuer les récompenses
  const rewards = quest.rewards as { gold?: number; item_id?: string };

  if (rewards.gold) {
    const { data: player } = await supabase
      .from('players')
      .select('gold')
      .eq('id', playerId)
      .single();

    if (player) {
      await supabase
        .from('players')
        .update({ gold: player.gold + rewards.gold })
        .eq('id', playerId);
    }
  }

  if (rewards.item_id) {
    await supabase.from('player_inventory').insert({
      player_id: playerId,
      item_id: rewards.item_id,
      is_equipped: false,
      quantity: 1,
    });
  }

  // Marquer comme complétée
  await supabase
    .from('player_quests')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', playerQuestId);

  return jsonResponse({ completed: true, rewards });
}

async function handleFindClue(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, questId, clueIndex, clueData } = payload as {
    playerId: string;
    questId: string;
    clueIndex: number;
    clueData: Record<string, unknown>;
  };

  if (!playerId || !questId || clueIndex === undefined) {
    return errorResponse('INVALID_PAYLOAD', 'playerId, questId et clueIndex requis');
  }

  // Vérifier si l'indice est déjà trouvé
  const { data: existing } = await supabase
    .from('player_clues')
    .select('id')
    .eq('player_id', playerId)
    .eq('quest_id', questId)
    .eq('clue_index', clueIndex)
    .single();

  if (existing) {
    return jsonResponse({ alreadyFound: true });
  }

  await supabase.from('player_clues').insert({
    player_id: playerId,
    quest_id: questId,
    clue_index: clueIndex,
    clue_data: clueData ?? {},
  });

  return jsonResponse({ found: true, clueIndex });
}

async function handleShareClue(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, clueId, targetPlayerId } = payload as {
    playerId: string;
    clueId: string;
    targetPlayerId: string;
  };

  if (!playerId || !clueId || !targetPlayerId) {
    return errorResponse('INVALID_PAYLOAD', 'playerId, clueId et targetPlayerId requis');
  }

  const { data: clue } = await supabase
    .from('player_clues')
    .select('*')
    .eq('id', clueId)
    .eq('player_id', playerId)
    .single();

  if (!clue) return errorResponse('CLUE_NOT_FOUND', 'Indice introuvable');

  // Marquer comme partagé
  await supabase
    .from('player_clues')
    .update({ shared: true })
    .eq('id', clueId);

  // Dupliquer pour le destinataire
  await supabase.from('player_clues').insert({
    player_id: targetPlayerId,
    quest_id: clue.quest_id,
    clue_index: clue.clue_index,
    clue_data: clue.clue_data,
  });

  return jsonResponse({ shared: true });
}

async function handleSolveEscape(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, questId, solution } = payload as {
    playerId: string;
    questId: string;
    solution: string;
  };

  if (!playerId || !questId || !solution) {
    return errorResponse('INVALID_PAYLOAD', 'playerId, questId et solution requis');
  }

  const { data: quest } = await supabase
    .from('quests')
    .select('*')
    .eq('id', questId)
    .eq('quest_type', 'escape_game')
    .single();

  if (!quest) return errorResponse('QUEST_NOT_FOUND', 'Quête escape game introuvable');

  const escapeData = quest.escape_data as { solution?: string; rewards?: { gold?: number; item_id?: string } } | null;
  if (!escapeData) return errorResponse('NO_ESCAPE_DATA', 'Données escape game manquantes');

  if (solution.toLowerCase().trim() !== (escapeData.solution ?? '').toLowerCase().trim()) {
    return jsonResponse({ solved: false, message: 'Solution incorrecte' });
  }

  // Distribuer les récompenses
  const rewards = escapeData.rewards ?? quest.rewards;

  if (rewards && (rewards as any).gold) {
    const { data: player } = await supabase
      .from('players')
      .select('gold')
      .eq('id', playerId)
      .single();

    if (player) {
      await supabase
        .from('players')
        .update({ gold: player.gold + (rewards as any).gold })
        .eq('id', playerId);
    }
  }

  // Marquer la quête comme complétée
  await supabase
    .from('player_quests')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('player_id', playerId)
    .eq('quest_id', questId)
    .eq('status', 'active');

  return jsonResponse({ solved: true, rewards });
}
