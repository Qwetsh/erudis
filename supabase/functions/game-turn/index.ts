import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';
import { corsHeaders } from '../_shared/cors.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

const DIE_MAX: Record<string, number> = { d4: 4, d6: 6, d8: 8, d10: 10 };
const FOG_VISION_RADIUS = 3;

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
      case 'ROLL_DICE':
        return await handleRollDice(supabase, payload);
      case 'MOVE':
        return await handleMove(supabase, payload);
      case 'AMBUSH_ANSWER':
        return await handleAmbushAnswer(supabase, payload);
      case 'RESOLVE_ENCOUNTER':
        return await handleResolveEncounter(supabase, payload);
      case 'HANDLE_DEATH':
        return await handleDeath(supabase, payload);
      case 'START_EXAM':
        return await handleStartExam(supabase, payload);
      case 'ANSWER_EXAM':
        return await handleAnswerExam(supabase, payload);
      case 'OPEN_CHEST':
        return await handleOpenChest(supabase, payload);
      case 'RESOLVE_GATE':
        return await handleResolveGate(supabase, payload);
      case 'TRIGGER_EVENT':
        return await handleTriggerEvent(supabase, payload);
      case 'USE_PORTAL':
        return await handleUsePortal(supabase, payload);
      default:
        return errorResponse('UNKNOWN_ACTION', `Action inconnue: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return errorResponse('INTERNAL_ERROR', message, 500);
  }
});

async function handleRollDice(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, playerId } = payload as { gameId: string; playerId: string };

  if (!gameId || !playerId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId et playerId requis');
  }

  // Vérifier que c'est bien le tour du joueur
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!game || game.phase !== 'playing') {
    return errorResponse('INVALID_STATE', 'La partie n\'est pas en cours');
  }

  // Déterminer le dé (par défaut d6, modifiable via modifier pipeline)
  const dieType = 'd6';
  const maxValue = DIE_MAX[dieType];
  const roll = Math.floor(Math.random() * maxValue) + 1;

  // Récupérer le bonus VIT du joueur
  const { data: player } = await supabase
    .from('players')
    .select('vit')
    .eq('id', playerId)
    .single();

  const vitBonus = player?.vit ?? 0;
  const totalMovement = roll + vitBonus;

  return jsonResponse({
    dieType,
    roll,
    vitBonus,
    totalMovement,
  });
}

async function handleMove(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, playerId, targetQ, targetR } = payload as {
    gameId: string;
    playerId: string;
    targetQ: number;
    targetR: number;
  };

  if (!gameId || !playerId || targetQ === undefined || targetR === undefined) {
    return errorResponse('INVALID_PAYLOAD', 'gameId, playerId, targetQ, targetR requis');
  }

  // Mettre à jour la position du joueur
  const { error: moveError } = await supabase
    .from('players')
    .update({
      position_q: targetQ,
      position_r: targetR,
    })
    .eq('id', playerId);

  if (moveError) {
    return errorResponse('MOVE_FAILED', moveError.message, 500);
  }

  // Dévoiler le brouillard autour de la nouvelle position
  const hexesToReveal = hexesInRadius({ q: targetQ, r: targetR }, FOG_VISION_RADIUS);

  for (const hex of hexesToReveal) {
    await supabase
      .from('map_hexes')
      .update({ discovered: true })
      .eq('game_id', gameId)
      .eq('q', hex.q)
      .eq('r', hex.r)
      .eq('discovered', false);
  }

  // Vérifier le contenu de la case d'arrivée
  const { data: landingHex } = await supabase
    .from('map_hexes')
    .select('*')
    .eq('game_id', gameId)
    .eq('q', targetQ)
    .eq('r', targetR)
    .single();

  const hasInteraction = landingHex?.poi !== null && landingHex?.poi !== 'spawn';

  // Vérifier s'il y a une embuscade ou rencontre narrative sur cette case
  const { data: hexEncounter } = await supabase
    .from('hex_encounters')
    .select('*, encounters(*)')
    .eq('game_id', gameId)
    .eq('q', targetQ)
    .eq('r', targetR)
    .eq('resolved', false)
    .single();

  let encounter = null;
  if (hexEncounter) {
    const enc = (hexEncounter as any).encounters;
    encounter = {
      hexEncounterId: hexEncounter.id,
      type: enc.encounter_type,
      name: enc.name,
      description: enc.description,
      ambushPenalty: enc.ambush_penalty,
      choices: enc.choices,
    };
  }

  return jsonResponse({
    position: { q: targetQ, r: targetR },
    revealedCount: hexesToReveal.length,
    hasInteraction,
    poi: landingHex?.poi ?? null,
    encounter,
  });
}

async function handleAmbushAnswer(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, hexEncounterId, isCorrect } = payload as {
    playerId: string;
    hexEncounterId: string;
    isCorrect: boolean;
  };

  if (!playerId || !hexEncounterId) {
    return errorResponse('INVALID_PAYLOAD', 'playerId et hexEncounterId requis');
  }

  const { data: hexEnc } = await supabase
    .from('hex_encounters')
    .select('*, encounters(*)')
    .eq('id', hexEncounterId)
    .single();

  if (!hexEnc) return errorResponse('ENCOUNTER_NOT_FOUND', 'Rencontre introuvable');

  const encounter = (hexEnc as any).encounters;

  // Marquer comme résolu
  await supabase
    .from('hex_encounters')
    .update({ resolved: true, resolved_by: playerId, resolved_at: new Date().toISOString() })
    .eq('id', hexEncounterId);

  if (isCorrect) {
    return jsonResponse({ survived: true, penalty: null });
  }

  // Échec : appliquer la pénalité
  const penalty = encounter.ambush_penalty ?? {};
  const hpLoss = penalty.hp_loss ?? 0;
  const goldLoss = penalty.gold_loss ?? 0;

  const { data: player } = await supabase
    .from('players')
    .select('hp, gold')
    .eq('id', playerId)
    .single();

  if (player) {
    await supabase
      .from('players')
      .update({
        hp: Math.max(0, player.hp - hpLoss),
        gold: Math.max(0, player.gold - goldLoss),
      })
      .eq('id', playerId);
  }

  return jsonResponse({
    survived: false,
    penalty: { hpLoss, goldLoss },
    playerHp: player ? Math.max(0, player.hp - hpLoss) : 0,
    playerGold: player ? Math.max(0, player.gold - goldLoss) : 0,
  });
}

async function handleResolveEncounter(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, hexEncounterId, choiceIndex } = payload as {
    playerId: string;
    hexEncounterId: string;
    choiceIndex: number;
  };

  if (!playerId || !hexEncounterId || choiceIndex === undefined) {
    return errorResponse('INVALID_PAYLOAD', 'playerId, hexEncounterId et choiceIndex requis');
  }

  const { data: hexEnc } = await supabase
    .from('hex_encounters')
    .select('*, encounters(*)')
    .eq('id', hexEncounterId)
    .single();

  if (!hexEnc) return errorResponse('ENCOUNTER_NOT_FOUND', 'Rencontre introuvable');

  const encounter = (hexEnc as any).encounters;
  const choices = encounter.choices ?? [];

  if (choiceIndex < 0 || choiceIndex >= choices.length) {
    return errorResponse('INVALID_CHOICE', 'Choix invalide');
  }

  const choice = choices[choiceIndex];
  const consequence = choice.consequence;

  // Marquer comme résolu
  await supabase
    .from('hex_encounters')
    .update({ resolved: true, resolved_by: playerId, resolved_at: new Date().toISOString() })
    .eq('id', hexEncounterId);

  // Appliquer la conséquence
  const { data: player } = await supabase
    .from('players')
    .select('hp, gold, hp_max')
    .eq('id', playerId)
    .single();

  if (!player) return errorResponse('PLAYER_NOT_FOUND', 'Joueur introuvable');

  let newHp = player.hp;
  let newGold = player.gold;

  if (consequence.type === 'reward' || consequence.type === 'penalty') {
    if (consequence.gold) {
      newGold = Math.max(0, newGold + consequence.gold);
    }
    if (consequence.heal) {
      newHp = Math.min(player.hp_max ?? 100, newHp + consequence.heal);
    }
    if (consequence.hp_loss) {
      newHp = Math.max(0, newHp - consequence.hp_loss);
    }

    await supabase
      .from('players')
      .update({ hp: newHp, gold: newGold })
      .eq('id', playerId);
  }

  return jsonResponse({
    choiceLabel: choice.label,
    consequence: {
      type: consequence.type,
      description: consequence.description,
      combat: consequence.type === 'combat' ? {
        monsterHp: consequence.monster_hp,
        monsterAtk: consequence.monster_atk,
      } : null,
    },
    playerHp: newHp,
    playerGold: newGold,
  });
}

const EVENT_POSITIVE_RATIO = 0.7;
const FINAL_EXAM_QUESTIONS = 7;
const FINAL_EXAM_PASS_THRESHOLD = 5;

async function handleDeath(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId } = payload as { playerId: string };

  if (!playerId) {
    return errorResponse('INVALID_PAYLOAD', 'playerId requis');
  }

  const { data: player } = await supabase
    .from('players')
    .select('hp_max, spawn_q, spawn_r')
    .eq('id', playerId)
    .single();

  if (!player) return errorResponse('PLAYER_NOT_FOUND', 'Joueur introuvable');

  // Respawn : 100% PV max, position spawn, skip prochain tour
  await supabase
    .from('players')
    .update({
      hp: player.hp_max,
      position_q: player.spawn_q,
      position_r: player.spawn_r,
      skip_next_turn: true,
    })
    .eq('id', playerId);

  return jsonResponse({
    respawned: true,
    hp: player.hp_max,
    position: { q: player.spawn_q, r: player.spawn_r },
    skipNextTurn: true,
  });
}

async function handleStartExam(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, playerId } = payload as { gameId: string; playerId: string };

  if (!gameId || !playerId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId et playerId requis');
  }

  // Vérifier que le joueur est bien en zone finale
  const { data: player } = await supabase
    .from('players')
    .select('position_q, position_r')
    .eq('id', playerId)
    .single();

  if (!player) return errorResponse('PLAYER_NOT_FOUND', 'Joueur introuvable');

  const { data: hex } = await supabase
    .from('map_hexes')
    .select('zone, poi')
    .eq('game_id', gameId)
    .eq('q', player.position_q)
    .eq('r', player.position_r)
    .single();

  if (!hex || hex.zone !== 'final' || hex.poi !== 'exam') {
    return errorResponse('NOT_FINAL_ZONE', 'Vous devez être sur la case de l\'Épreuve du Brevet');
  }

  // Créer la tentative d'examen
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .insert({
      game_id: gameId,
      player_id: playerId,
      questions_total: FINAL_EXAM_QUESTIONS,
    })
    .select()
    .single();

  return jsonResponse({
    examStarted: true,
    attemptId: attempt?.id,
    totalQuestions: FINAL_EXAM_QUESTIONS,
    passThreshold: FINAL_EXAM_PASS_THRESHOLD,
  });
}

async function handleAnswerExam(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, attemptId, questionId, isCorrect } = payload as {
    playerId: string;
    attemptId: string;
    questionId: string;
    isCorrect: boolean;
  };

  if (!playerId || !attemptId || !questionId) {
    return errorResponse('INVALID_PAYLOAD', 'playerId, attemptId et questionId requis');
  }

  // Enregistrer dans l'historique
  await supabase.from('player_question_history').insert({
    player_id: playerId,
    question_id: questionId,
    answered_correctly: isCorrect,
  });

  // Mettre à jour la tentative
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('id', attemptId)
    .single();

  if (!attempt) return errorResponse('ATTEMPT_NOT_FOUND', 'Tentative introuvable');

  const newCorrect = attempt.questions_correct + (isCorrect ? 1 : 0);
  const newAnswered = attempt.questions_answered + 1;
  const examComplete = newAnswered >= attempt.questions_total;

  let passed: boolean | null = null;
  if (examComplete) {
    passed = newCorrect >= FINAL_EXAM_PASS_THRESHOLD;
  }

  await supabase
    .from('exam_attempts')
    .update({
      questions_correct: newCorrect,
      questions_answered: newAnswered,
      passed: passed,
      ...(examComplete ? { finished_at: new Date().toISOString() } : {}),
    })
    .eq('id', attemptId);

  // Si échoué, infliger des dégâts
  if (examComplete && !passed) {
    const { data: player } = await supabase
      .from('players')
      .select('hp')
      .eq('id', playerId)
      .single();

    if (player) {
      const damage = 20;
      const newHp = Math.max(0, player.hp - damage);
      await supabase.from('players').update({ hp: newHp }).eq('id', playerId);
    }
  }

  // Si réussi, marquer le jeu comme terminé
  if (examComplete && passed) {
    const { data: player } = await supabase
      .from('players')
      .select('game_id')
      .eq('id', playerId)
      .single();

    if (player) {
      await supabase
        .from('games')
        .update({ phase: 'gameOver', winner_id: playerId })
        .eq('id', player.game_id);
    }
  }

  return jsonResponse({
    isCorrect,
    questionsCorrect: newCorrect,
    questionsAnswered: newAnswered,
    totalQuestions: attempt.questions_total,
    examComplete,
    passed,
    gameOver: examComplete && passed,
  });
}

async function handleUsePortal(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, playerId, q, r } = payload as {
    gameId: string;
    playerId: string;
    q: number;
    r: number;
  };

  if (!gameId || !playerId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId et playerId requis');
  }

  const { data: portal } = await supabase
    .from('portals')
    .select('*')
    .eq('game_id', gameId)
    .eq('from_q', q)
    .eq('from_r', r)
    .single();

  if (!portal) return errorResponse('PORTAL_NOT_FOUND', 'Portail introuvable');

  // Téléporter le joueur
  await supabase
    .from('players')
    .update({ position_q: portal.to_q, position_r: portal.to_r })
    .eq('id', playerId);

  return jsonResponse({
    teleported: true,
    toWorld: portal.to_world,
    position: { q: portal.to_q, r: portal.to_r },
  });
}

async function handleOpenChest(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, playerId, q, r } = payload as {
    gameId: string;
    playerId: string;
    q: number;
    r: number;
  };

  if (!gameId || !playerId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId et playerId requis');
  }

  // Vérifier que le coffre existe et n'est pas ouvert
  const { data: chest } = await supabase
    .from('chests')
    .select('*')
    .eq('game_id', gameId)
    .eq('q', q)
    .eq('r', r)
    .single();

  if (!chest) return errorResponse('CHEST_NOT_FOUND', 'Coffre introuvable');
  if (chest.opened) return errorResponse('CHEST_ALREADY_OPENED', 'Ce coffre a déjà été ouvert');

  // Déterminer la zone pour la table de loot
  const { data: hex } = await supabase
    .from('map_hexes')
    .select('zone')
    .eq('game_id', gameId)
    .eq('q', q)
    .eq('r', r)
    .single();

  const zone = hex?.zone ?? 'easy';

  // Chercher une table de loot pour cette zone
  const { data: lootTable } = await supabase
    .from('loot_tables')
    .select('*')
    .eq('zone', zone)
    .limit(1)
    .single();

  // Générer le loot
  let goldReward = 0;
  let itemReward = null;
  const isLegendary = false;

  if (lootTable && lootTable.entries) {
    const entries = lootTable.entries as Array<{ type: string; value: number; item_id?: string; weight: number; rarity?: string }>;
    const totalWeight = entries.reduce((sum: number, e: { weight: number }) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) {
        if (entry.type === 'gold') {
          goldReward = entry.value;
        } else if (entry.type === 'item' && entry.item_id) {
          itemReward = entry.item_id;
        }
        break;
      }
    }
  } else {
    // Loot par défaut basé sur la zone
    const zoneGold: Record<string, number> = { easy: 15, medium: 30, hard: 50, final: 75 };
    goldReward = zoneGold[zone] ?? 15;
  }

  // Marquer le coffre comme ouvert
  await supabase
    .from('chests')
    .update({ opened: true, opened_by: playerId, opened_at: new Date().toISOString() })
    .eq('id', chest.id);

  // Donner l'or
  if (goldReward > 0) {
    const { data: player } = await supabase
      .from('players')
      .select('gold')
      .eq('id', playerId)
      .single();

    if (player) {
      await supabase
        .from('players')
        .update({ gold: player.gold + goldReward })
        .eq('id', playerId);
    }
  }

  // Donner l'item
  if (itemReward) {
    await supabase.from('player_inventory').insert({
      player_id: playerId,
      item_id: itemReward,
      is_equipped: false,
      quantity: 1,
    });
  }

  return jsonResponse({
    opened: true,
    goldReward,
    itemReward,
    isLegendary,
  });
}

async function handleResolveGate(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, playerId, q, r, resolution } = payload as {
    gameId: string;
    playerId: string;
    q: number;
    r: number;
    resolution: 'gold' | 'combat';
  };

  if (!gameId || !playerId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId et playerId requis');
  }

  const { data: gate } = await supabase
    .from('gates')
    .select('*')
    .eq('game_id', gameId)
    .eq('q', q)
    .eq('r', r)
    .single();

  if (!gate) return errorResponse('GATE_NOT_FOUND', 'Gate introuvable');

  // Vérifier si déjà résolue par ce joueur
  const resolvedBy = (gate.resolved_by as string[]) ?? [];
  if (resolvedBy.includes(playerId)) {
    return jsonResponse({ alreadyResolved: true, toZone: gate.to_zone });
  }

  if (resolution === 'gold') {
    const { data: player } = await supabase
      .from('players')
      .select('gold')
      .eq('id', playerId)
      .single();

    if (!player || player.gold < gate.gold_cost) {
      return errorResponse('NOT_ENOUGH_GOLD', `Il faut ${gate.gold_cost} or pour passer`);
    }

    await supabase
      .from('players')
      .update({ gold: player.gold - gate.gold_cost })
      .eq('id', playerId);

    // Marquer comme résolu
    await supabase
      .from('gates')
      .update({ resolved_by: [...resolvedBy, playerId] })
      .eq('id', gate.id);

    return jsonResponse({ resolved: true, method: 'gold', toZone: gate.to_zone });
  }

  if (resolution === 'combat') {
    // Retourner les infos de combat, le client devra lancer un START_PVE
    return jsonResponse({
      resolved: false,
      method: 'combat',
      monsterHp: gate.combat_monster_hp,
      monsterAtk: gate.combat_monster_atk,
      gateId: gate.id,
      toZone: gate.to_zone,
    });
  }

  return errorResponse('INVALID_RESOLUTION', 'Résolution invalide (gold ou combat)');
}

async function handleTriggerEvent(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, playerId } = payload as {
    gameId: string;
    playerId: string;
  };

  if (!gameId || !playerId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId et playerId requis');
  }

  // Déterminer la zone du joueur
  const { data: player } = await supabase
    .from('players')
    .select('position_q, position_r, hp, gold, hp_max')
    .eq('id', playerId)
    .single();

  if (!player) return errorResponse('PLAYER_NOT_FOUND', 'Joueur introuvable');

  const { data: hex } = await supabase
    .from('map_hexes')
    .select('zone')
    .eq('game_id', gameId)
    .eq('q', player.position_q)
    .eq('r', player.position_r)
    .single();

  const zone = hex?.zone ?? 'easy';

  // Déterminer positif ou négatif (70/30)
  const isPositive = Math.random() < EVENT_POSITIVE_RATIO;
  const eventType = isPositive ? 'positive' : 'negative';

  // Tirer un événement aléatoire
  const { data: events } = await supabase
    .from('game_events')
    .select('*')
    .eq('zone', zone)
    .eq('event_type', eventType);

  if (!events || events.length === 0) {
    return jsonResponse({ eventTriggered: false, reason: 'Aucun événement disponible' });
  }

  const event = events[Math.floor(Math.random() * events.length)];
  const effects = event.effects as Record<string, number>;

  // Appliquer les effets
  let newHp = player.hp;
  let newGold = player.gold;

  if (effects.gold) {
    newGold = Math.max(0, newGold + effects.gold);
  }
  if (effects.heal) {
    newHp = Math.min(player.hp_max ?? 100, newHp + effects.heal);
  }
  if (effects.hp_loss) {
    newHp = Math.max(0, newHp - effects.hp_loss);
  }

  await supabase
    .from('players')
    .update({ hp: newHp, gold: newGold })
    .eq('id', playerId);

  return jsonResponse({
    eventTriggered: true,
    event: {
      name: event.name,
      description: event.description,
      type: event.event_type,
      effects,
    },
    playerHp: newHp,
    playerGold: newGold,
  });
}

// Helper hex
type HexCoord = { q: number; r: number };

function hexesInRadius(center: HexCoord, radius: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  return results;
}
