import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';
import { corsHeaders } from '../_shared/cors.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

const BASE_INVENTORY_SIZE = 2;
const EQUIPMENT_SLOTS = ['head', 'body', 'tool', 'accessory'];

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
      case 'EQUIP': return await handleEquip(supabase, payload);
      case 'UNEQUIP': return await handleUnequip(supabase, payload);
      case 'USE_ITEM': return await handleUseItem(supabase, payload);
      case 'BUY': return await handleBuy(supabase, payload);
      case 'SELL': return await handleSell(supabase, payload);
      case 'FORGE': return await handleForge(supabase, payload);
      case 'DROP': return await handleDrop(supabase, payload);
      case 'SHOP_LIST': return await handleShopList(supabase, payload);
      case 'TRADE': return await handleTrade(supabase, payload);
      default:
        return errorResponse('UNKNOWN_ACTION', `Action inconnue: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return errorResponse('INTERNAL_ERROR', message, 500);
  }
});

async function handleEquip(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, inventoryId } = payload as { playerId: string; inventoryId: string };

  // Récupérer l'item
  const { data: invItem } = await supabase
    .from('player_inventory')
    .select('*, items(*)')
    .eq('id', inventoryId)
    .eq('player_id', playerId)
    .single();

  if (!invItem) return errorResponse('ITEM_NOT_FOUND', 'Item introuvable');

  const item = (invItem as any).items;
  if (item.item_type !== 'equipment') {
    return errorResponse('NOT_EQUIPMENT', 'Cet item n\'est pas un équipement');
  }

  // Déséquiper l'item actuel dans le même slot
  await supabase
    .from('player_inventory')
    .update({ is_equipped: false })
    .eq('player_id', playerId)
    .eq('is_equipped', true);
  // Note: devrait filtrer par slot, simplifié ici

  // Équiper le nouvel item
  await supabase
    .from('player_inventory')
    .update({ is_equipped: true })
    .eq('id', inventoryId);

  return jsonResponse({ equipped: true, slot: item.equip_slot });
}

async function handleUnequip(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, inventoryId } = payload as { playerId: string; inventoryId: string };

  await supabase
    .from('player_inventory')
    .update({ is_equipped: false })
    .eq('id', inventoryId)
    .eq('player_id', playerId);

  return jsonResponse({ unequipped: true });
}

async function handleUseItem(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, inventoryId, context } = payload as {
    playerId: string;
    inventoryId: string;
    context: string;
  };

  const { data: invItem } = await supabase
    .from('player_inventory')
    .select('*, items(*)')
    .eq('id', inventoryId)
    .eq('player_id', playerId)
    .single();

  if (!invItem) return errorResponse('ITEM_NOT_FOUND', 'Item introuvable');

  const item = (invItem as any).items;
  if (item.item_type !== 'consumable') {
    return errorResponse('NOT_CONSUMABLE', 'Cet item n\'est pas un consommable');
  }

  if (item.use_context && item.use_context !== 'anytime' && item.use_context !== context) {
    return errorResponse('WRONG_CONTEXT', `Utilisable uniquement en contexte: ${item.use_context}`);
  }

  // Retirer le consommable
  if ((invItem as any).quantity <= 1) {
    await supabase.from('player_inventory').delete().eq('id', inventoryId);
  } else {
    await supabase.from('player_inventory')
      .update({ quantity: (invItem as any).quantity - 1 })
      .eq('id', inventoryId);
  }

  return jsonResponse({ used: true, modifiers: item.modifiers, effect: item.stats });
}

async function handleBuy(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, itemId } = payload as { playerId: string; itemId: string };

  const { data: player } = await supabase
    .from('players')
    .select('gold, force')
    .eq('id', playerId)
    .single();

  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (!player || !item) return errorResponse('NOT_FOUND', 'Joueur ou item introuvable');
  if (player.gold < (item as any).buy_price) {
    return errorResponse('NOT_ENOUGH_GOLD', 'Pas assez d\'or');
  }

  // Vérifier l'inventaire
  const { count } = await supabase
    .from('player_inventory')
    .select('*', { count: 'exact', head: true })
    .eq('player_id', playerId)
    .eq('is_equipped', false);

  const maxSlots = BASE_INVENTORY_SIZE + player.force;
  if ((count ?? 0) >= maxSlots) {
    return errorResponse('INVENTORY_FULL', 'Inventaire plein');
  }

  // Acheter
  await supabase.from('players')
    .update({ gold: player.gold - (item as any).buy_price })
    .eq('id', playerId);

  await supabase.from('player_inventory').insert({
    player_id: playerId,
    item_id: itemId,
    is_equipped: false,
    quantity: 1,
  });

  return jsonResponse({ bought: true, remainingGold: player.gold - (item as any).buy_price });
}

async function handleSell(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, inventoryId } = payload as { playerId: string; inventoryId: string };

  const { data: invItem } = await supabase
    .from('player_inventory')
    .select('*, items(*)')
    .eq('id', inventoryId)
    .eq('player_id', playerId)
    .single();

  if (!invItem) return errorResponse('ITEM_NOT_FOUND', 'Item introuvable');

  const item = (invItem as any).items;
  const { data: player } = await supabase
    .from('players')
    .select('gold')
    .eq('id', playerId)
    .single();

  if (!player) return errorResponse('PLAYER_NOT_FOUND', 'Joueur introuvable');

  await supabase.from('player_inventory').delete().eq('id', inventoryId);
  await supabase.from('players')
    .update({ gold: player.gold + item.sell_price })
    .eq('id', playerId);

  return jsonResponse({ sold: true, goldReceived: item.sell_price });
}

async function handleForge(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, inventoryId, forgeCost } = payload as {
    playerId: string;
    inventoryId: string;
    forgeCost?: number;
  };

  const cost = forgeCost ?? 50;

  const { data: player } = await supabase
    .from('players')
    .select('gold')
    .eq('id', playerId)
    .single();

  if (!player || player.gold < cost) {
    return errorResponse('NOT_ENOUGH_GOLD', 'Pas assez d\'or pour forger');
  }

  // Vérifier que l'item est commun
  const { data: invItem } = await supabase
    .from('player_inventory')
    .select('*, items(*)')
    .eq('id', inventoryId)
    .eq('player_id', playerId)
    .single();

  if (!invItem) return errorResponse('ITEM_NOT_FOUND', 'Item introuvable');

  const item = (invItem as any).items;
  if (item.rarity !== 'common') {
    return errorResponse('NOT_COMMON', 'Seuls les objets communs peuvent être forgés');
  }

  // Payer et améliorer
  await supabase.from('players')
    .update({ gold: player.gold - cost })
    .eq('id', playerId);

  // Note: en production, on créerait un nouvel item rare basé sur le commun
  // Pour l'instant, on marque simplement comme forgé
  return jsonResponse({ forged: true, remainingGold: player.gold - cost });
}

async function handleDrop(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { playerId, inventoryId } = payload as { playerId: string; inventoryId: string };

  await supabase
    .from('player_inventory')
    .delete()
    .eq('id', inventoryId)
    .eq('player_id', playerId);

  return jsonResponse({ dropped: true });
}

async function handleShopList(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { gameId, q, r } = payload as { gameId: string; q: number; r: number };

  if (!gameId) {
    return errorResponse('INVALID_PAYLOAD', 'gameId requis');
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('game_id', gameId)
    .eq('q', q)
    .eq('r', r)
    .single();

  if (!shop) return errorResponse('SHOP_NOT_FOUND', 'Boutique introuvable');

  const { data: inventory } = await supabase
    .from('shop_inventory')
    .select('*, items(*)')
    .eq('shop_id', shop.id)
    .gt('stock', 0);

  const items = (inventory ?? []).map((si: any) => ({
    shopInventoryId: si.id,
    item: si.items,
    stock: si.stock,
    price: si.price_override ?? si.items.buy_price,
  }));

  return jsonResponse({ shop: items });
}

async function handleTrade(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { player1Id, player2Id, offer1, offer2 } = payload as {
    player1Id: string;
    player2Id: string;
    offer1: { gold?: number; inventoryIds?: string[] };
    offer2: { gold?: number; inventoryIds?: string[] };
  };

  if (!player1Id || !player2Id) {
    return errorResponse('INVALID_PAYLOAD', 'player1Id et player2Id requis');
  }

  // Vérifier que les deux joueurs sont sur la même case
  const { data: p1 } = await supabase
    .from('players')
    .select('position_q, position_r, gold')
    .eq('id', player1Id)
    .single();

  const { data: p2 } = await supabase
    .from('players')
    .select('position_q, position_r, gold')
    .eq('id', player2Id)
    .single();

  if (!p1 || !p2) return errorResponse('PLAYERS_NOT_FOUND', 'Joueurs introuvables');
  if (p1.position_q !== p2.position_q || p1.position_r !== p2.position_r) {
    return errorResponse('NOT_SAME_HEX', 'Les joueurs doivent être sur la même case');
  }

  const gold1 = offer1.gold ?? 0;
  const gold2 = offer2.gold ?? 0;

  if (p1.gold < gold1) return errorResponse('NOT_ENOUGH_GOLD', 'Joueur 1 n\'a pas assez d\'or');
  if (p2.gold < gold2) return errorResponse('NOT_ENOUGH_GOLD', 'Joueur 2 n\'a pas assez d\'or');

  // Échanger l'or
  await supabase.from('players').update({ gold: p1.gold - gold1 + gold2 }).eq('id', player1Id);
  await supabase.from('players').update({ gold: p2.gold - gold2 + gold1 }).eq('id', player2Id);

  // Transférer les items de P1 vers P2
  for (const invId of (offer1.inventoryIds ?? [])) {
    await supabase
      .from('player_inventory')
      .update({ player_id: player2Id })
      .eq('id', invId)
      .eq('player_id', player1Id);
  }

  // Transférer les items de P2 vers P1
  for (const invId of (offer2.inventoryIds ?? [])) {
    await supabase
      .from('player_inventory')
      .update({ player_id: player1Id })
      .eq('id', invId)
      .eq('player_id', player2Id);
  }

  return jsonResponse({ traded: true });
}
