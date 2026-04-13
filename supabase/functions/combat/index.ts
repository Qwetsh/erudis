import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';
import { corsHeaders } from '../_shared/cors.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

const QUESTION_ANTI_REPEAT = 12;
const PVP_TIMER_SECONDS = 30;
const PVP_DAMAGE_K = 3;
const PVP_GOLD_STEAL_MIN = 0.05;
const PVP_GOLD_STEAL_MAX = 0.10;

const QUESTION_MULTIPLIERS: Record<string, number> = { duo: 2, quatre: 4, cash: 8 };

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
      case 'START_PVE':
        return await handleStartPvE(supabase, payload);
      case 'ANSWER_PVE':
        return await handleAnswerPvE(supabase, payload);
      case 'START_PVP':
        return await handleStartPvP(supabase, payload);
      case 'ANSWER_PVP':
        return await handleAnswerPvP(supabase, payload);
      case 'PICK_QUESTION':
        return await handlePickQuestion(supabase, payload);
      default:
        return errorResponse('UNKNOWN_ACTION', `Action inconnue: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return errorResponse('INTERNAL_ERROR', message, 500);
  }
});

async function handlePickQuestion(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, subject, difficulty, questionType } = payload as {
    playerId: string;
    subject?: string;
    difficulty?: string;
    questionType?: string;
  };

  if (!playerId) {
    return errorResponse('INVALID_PAYLOAD', 'playerId requis');
  }

  // Récupérer les IDs des questions récentes de ce joueur
  const { data: recentHistory } = await supabase
    .from('player_question_history')
    .select('question_id')
    .eq('player_id', playerId)
    .order('answered_at', { ascending: false })
    .limit(QUESTION_ANTI_REPEAT);

  const excludeIds = (recentHistory ?? []).map((h: { question_id: string }) => h.question_id);

  // Construire la requête
  let query = supabase.from('questions').select('*');
  if (subject) query = query.eq('subject', subject);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (questionType) query = query.eq('question_type', questionType);

  const { data: questions } = await query;

  if (!questions || questions.length === 0) {
    return errorResponse('NO_QUESTIONS', 'Aucune question disponible');
  }

  // Filtrer les questions récentes
  const available = questions.filter(
    (q: { id: string }) => !excludeIds.includes(q.id),
  );

  // Si toutes exclues, prendre n'importe laquelle
  const pool = available.length > 0 ? available : questions;
  const question = pool[Math.floor(Math.random() * pool.length)];

  return jsonResponse({ question });
}

async function handleStartPvE(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, playerId, monsterHp, monsterAtk } = payload as {
    gameId: string;
    playerId: string;
    monsterHp?: number;
    monsterAtk?: number;
  };

  if (!gameId || !playerId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId et playerId requis');
  }

  const hp = monsterHp ?? 50;
  const atk = monsterAtk ?? 8;

  return jsonResponse({
    combatType: 'pve',
    monsterHp: hp,
    monsterMaxHp: hp,
    monsterAtk: atk,
    availableQuestionTypes: ['duo', 'quatre', 'cash'],
  });
}

async function handleAnswerPvE(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, questionId, answerIndex, isCorrect, questionType, monsterHp, monsterAtk } =
    payload as {
      playerId: string;
      questionId: string;
      answerIndex: number;
      isCorrect: boolean;
      questionType: string;
      monsterHp: number;
      monsterAtk: number;
    };

  if (!playerId || !questionId) {
    return errorResponse('INVALID_PAYLOAD', 'playerId et questionId requis');
  }

  // Enregistrer dans l'historique
  await supabase.from('player_question_history').insert({
    player_id: playerId,
    question_id: questionId,
    answered_correctly: isCorrect,
  });

  // Récupérer les stats du joueur
  const { data: player } = await supabase
    .from('players')
    .select('atk, def, hp')
    .eq('id', playerId)
    .single();

  if (!player) {
    return errorResponse('PLAYER_NOT_FOUND', 'Joueur introuvable');
  }

  let damage = 0;
  let playerDamage = 0;
  let newMonsterHp = monsterHp;
  let newPlayerHp = player.hp;

  if (isCorrect) {
    // Dégâts au monstre : ATK × multiplicateur
    const multiplier = QUESTION_MULTIPLIERS[questionType] ?? 2;
    damage = player.atk * multiplier;
    newMonsterHp = Math.max(0, monsterHp - damage);
  } else {
    // Dégâts reçus : max(1, ATK_PNJ - DEF)
    playerDamage = Math.max(1, monsterAtk - player.def);
    newPlayerHp = Math.max(0, player.hp - playerDamage);

    // Mettre à jour les PV du joueur
    await supabase
      .from('players')
      .update({ hp: newPlayerHp })
      .eq('id', playerId);
  }

  const combatOver = newMonsterHp <= 0 || newPlayerHp <= 0;

  return jsonResponse({
    isCorrect,
    damage,
    playerDamage,
    monsterHp: newMonsterHp,
    playerHp: newPlayerHp,
    combatOver,
    playerDead: newPlayerHp <= 0,
    monsterDead: newMonsterHp <= 0,
  });
}

async function handleStartPvP(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, attackerId, defenderId } = payload as {
    gameId: string;
    attackerId: string;
    defenderId: string;
  };

  if (!gameId || !attackerId || !defenderId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId, attackerId, defenderId requis');
  }

  // Vérifier la protection anti-PvP
  const { data: attacker } = await supabase
    .from('players')
    .select('turns_played')
    .eq('id', attackerId)
    .single();

  if (attacker && attacker.turns_played < 3) {
    return errorResponse('PVP_PROTECTED', 'Protection anti-PvP active (3 premiers tours)');
  }

  return jsonResponse({
    combatType: 'pvp',
    timerSeconds: PVP_TIMER_SECONDS,
    attackerId,
    defenderId,
    fightBar: 0, // 0 = centre, négatif = avantage défenseur, positif = avantage attaquant
  });
}

async function handleAnswerPvP(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, winnerId, loserId, fightBar } = payload as {
    gameId: string;
    winnerId: string;
    loserId: string;
    fightBar: number;
  };

  if (!gameId || !winnerId || !loserId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId, winnerId, loserId requis');
  }

  const { data: winner } = await supabase
    .from('players')
    .select('atk, def, gold')
    .eq('id', winnerId)
    .single();

  const { data: loser } = await supabase
    .from('players')
    .select('atk, def, hp, gold')
    .eq('id', loserId)
    .single();

  if (!winner || !loser) {
    return errorResponse('PLAYERS_NOT_FOUND', 'Joueurs introuvables');
  }

  // Dégâts : max(1, floor(ATK × écart × K × (1 - DEF/10)))
  const ecart = Math.abs(fightBar);
  const damage = Math.max(1, Math.floor(winner.atk * ecart * PVP_DAMAGE_K * (1 - loser.def / 10)));
  const newLoserHp = Math.max(0, loser.hp - damage);

  // Vol d'or : 5-10% de l'or du perdant
  const stealPercent = PVP_GOLD_STEAL_MIN + Math.random() * (PVP_GOLD_STEAL_MAX - PVP_GOLD_STEAL_MIN);
  const stolenGold = Math.floor(loser.gold * stealPercent);

  // Mise à jour
  await supabase.from('players').update({ hp: newLoserHp, gold: loser.gold - stolenGold }).eq('id', loserId);
  await supabase.from('players').update({ gold: winner.gold + stolenGold }).eq('id', winnerId);

  return jsonResponse({
    damage,
    stolenGold,
    loserHp: newLoserHp,
    loserDead: newLoserHp <= 0,
  });
}
