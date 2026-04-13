import { useEffect, useState } from 'react';
import { supabase, type PlayerRow, ARCHETYPES, getNeighbors } from '@erudis/shared';
import { usePlayerStore } from '../../store/use-player-store';

const db = supabase as any;

type HexTile = {
  q: number;
  r: number;
  terrain: string;
  zone: string;
  poi: string | null;
  discovered: boolean;
};

const DIRECTION_LABELS = ['E', 'NE', 'NO', 'O', 'SO', 'SE'] as const;

export function PlayerGameScreen() {
  const playerId = usePlayerStore((s) => s.playerId);
  const playerName = usePlayerStore((s) => s.playerName);
  const gameId = usePlayerStore((s) => s.gameId);
  const gameCode = usePlayerStore((s) => s.gameCode);
  const selectedArchetype = usePlayerStore((s) => s.selectedArchetype);
  const setPhase = usePlayerStore((s) => s.setPhase);

  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [tiles, setTiles] = useState<HexTile[]>([]);
  const [movePoints, setMovePoints] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [moving, setMoving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [turnPhase, setTurnPhase] = useState<'waiting' | 'rollDice' | 'movement' | 'done'>('waiting');

  const archetypeInfo = selectedArchetype
    ? ARCHETYPES.find((a) => a.id === selectedArchetype) ?? null
    : null;

  // Charger les données initiales
  useEffect(() => {
    if (!gameId || !playerId) return;

    async function load() {
      const [{ data: playerData }, { data: tilesData }, { data: gameData }, { data: playersData }] = await Promise.all([
        db.from('players').select('*').eq('id', playerId).single(),
        db.from('map_hexes').select('*').eq('game_id', gameId),
        db.from('games').select('*').eq('id', gameId).single(),
        db.from('players').select('*').eq('game_id', gameId).order('created_at'),
      ]);

      if (playerData) setPlayer(playerData as PlayerRow);
      if (tilesData) setTiles(tilesData as HexTile[]);
      if (playersData) setPlayers(playersData as PlayerRow[]);
      if (gameData) {
        setCurrentTurn(gameData.current_turn);
        setActivePlayerIndex(gameData.current_player_index);
      }
    }

    load();
  }, [gameId, playerId]);

  // Déterminer si c'est mon tour
  useEffect(() => {
    if (!playerId || players.length === 0) return;
    const myIndex = players.findIndex((p) => p.id === playerId);
    const isMyTurn = myIndex === activePlayerIndex;
    setTurnPhase(isMyTurn ? 'rollDice' : 'waiting');
  }, [playerId, players, activePlayerIndex]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!gameCode || !gameId || !playerId) return;

    const channel = supabase
      .channel(`game:${gameCode}:player:${playerId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'players', filter: `id=eq.${playerId}` },
        (payload: { new: Record<string, unknown> }) => {
          setPlayer(payload.new as unknown as PlayerRow);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload: { new: Record<string, unknown> }) => {
          const g = payload.new as { current_turn: number; current_player_index: number; phase: string };
          setCurrentTurn(g.current_turn);
          setActivePlayerIndex(g.current_player_index);
          if (g.phase === 'gameOver') setPhase('gameOver');
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'map_hexes', filter: `game_id=eq.${gameId}` },
        (payload: { new: Record<string, unknown> }) => {
          const hex = payload.new as unknown as HexTile;
          setTiles((prev) => prev.map((t) => (t.q === hex.q && t.r === hex.r ? hex : t)));
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameCode, gameId, playerId, setPhase]);

  // Lancer le dé
  async function rollDice() {
    if (!player) return;
    setRolling(true);
    const vit = player.vit ?? 0;
    const roll = Math.floor(Math.random() * 6) + 1;
    const total = roll + vit;
    setMovePoints(total);
    setMessage(`Dé: ${roll}${vit > 0 ? ` + ${vit} VIT` : ''} = ${total} déplacements`);
    setTurnPhase('movement');
    setRolling(false);
  }

  // Se déplacer dans une direction
  async function move(dirIndex: number) {
    if (!player || movePoints <= 0 || moving) return;
    setMoving(true);

    const neighbors = getNeighbors({ q: player.position_q, r: player.position_r });
    const target = neighbors[dirIndex];

    // Vérifier si la case existe et est accessible
    const tile = tiles.find((t) => t.q === target.q && t.r === target.r);
    if (!tile) {
      setMessage('Impossible — hors de la carte');
      setMoving(false);
      return;
    }
    if (tile.terrain === 'impassable') {
      setMessage('Terrain infranchissable !');
      setMoving(false);
      return;
    }

    // Coût de déplacement
    const cost = tile.terrain === 'mountain' ? 2 : 1;
    if (movePoints < cost) {
      setMessage(`Pas assez de points (coût: ${cost})`);
      setMoving(false);
      return;
    }

    // Update position en DB
    const { error } = await db
      .from('players')
      .update({ position_q: target.q, position_r: target.r })
      .eq('id', player.id);

    if (error) {
      setMessage(`Erreur: ${error.message}`);
      setMoving(false);
      return;
    }

    // Révéler le brouillard (3 cases autour)
    const toReveal = tiles.filter(
      (t) => !t.discovered && hexDist(t, target) <= 3,
    );
    if (toReveal.length > 0) {
      for (const t of toReveal) {
        await db.from('map_hexes')
          .update({ discovered: true })
          .eq('game_id', gameId)
          .eq('q', t.q)
          .eq('r', t.r);
      }
    }

    setMovePoints((prev) => prev - cost);
    setPlayer((prev) => prev ? { ...prev, position_q: target.q, position_r: target.r } : prev);

    // Message selon le terrain/POI
    const terrainNames: Record<string, string> = {
      road: 'Chemin', plain: 'Plaine', forest: 'Forêt',
      swamp: 'Marais', mountain: 'Montagne', lake: 'Lac',
    };
    let msg = terrainNames[tile.terrain] ?? tile.terrain;
    if (tile.poi) msg += ` — ${tile.poi}`;
    setMessage(msg);
    setMoving(false);
  }

  // Fin de tour
  async function endTurn() {
    if (!gameId || !playerId) return;

    // Passer au joueur suivant
    const nextIndex = (activePlayerIndex + 1) % players.length;
    const nextTurn = nextIndex === 0 ? currentTurn + 1 : currentTurn;

    await db.from('games').update({
      current_player_index: nextIndex,
      current_turn: nextTurn,
    }).eq('id', gameId);

    // Incrémenter turns_played
    await db.from('players').update({
      turns_played: (player?.turns_played ?? 0) + 1,
    }).eq('id', playerId);

    setMovePoints(0);
    setMessage(null);

    // Si le prochain joueur est moi-même (solo ou rotation complète), relancer directement
    const myIndex = players.findIndex((p) => p.id === playerId);
    if (nextIndex === myIndex) {
      setCurrentTurn(nextTurn);
      setTurnPhase('rollDice');
    } else {
      setTurnPhase('waiting');
    }
  }

  if (!player) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p>Chargement...</p>
      </div>
    );
  }

  const isMyTurn = turnPhase !== 'waiting';
  const hpPercent = player.hp_max > 0 ? Math.round((player.hp / player.hp_max) * 100) : 0;

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      {/* Header — Stats */}
      <div className="flex items-center gap-3 bg-gray-800 px-4 py-3">
        <div className="flex-1">
          <p className="text-lg font-bold">{playerName}</p>
          <p className="text-xs text-gray-400">{archetypeInfo?.name ?? ''} — Tour {currentTurn}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-yellow-400">{player.gold} or</span>
        </div>
      </div>

      {/* Barre de PV */}
      <div className="mx-4 mt-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>PV</span>
          <span>{player.hp}/{player.hp_max}</span>
        </div>
        <div className="h-3 rounded-full bg-gray-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Stats compactes */}
      <div className="flex justify-around mx-4 mt-2 text-center text-xs">
        <Stat label="ATK" value={player.atk} color="text-red-400" />
        <Stat label="DEF" value={player.def} color="text-blue-400" />
        <Stat label="VIT" value={player.vit} color="text-green-400" />
        <Stat label="FOR" value={player.force} color="text-purple-400" />
      </div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        {!isMyTurn && (
          <div className="text-center">
            <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-gray-600 border-t-indigo-400" />
            <p className="mt-3 text-lg text-gray-400">En attente de ton tour...</p>
            <p className="text-sm text-gray-500">
              C'est au tour de {players[activePlayerIndex]?.name ?? '...'}
            </p>
          </div>
        )}

        {turnPhase === 'rollDice' && (
          <div className="text-center">
            <p className="text-xl font-bold text-indigo-300 mb-4">C'est ton tour !</p>
            <button
              onClick={rollDice}
              disabled={rolling}
              className="rounded-2xl bg-indigo-600 px-10 py-5 text-2xl font-bold transition-colors hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
            >
              {rolling ? '...' : 'Lancer le dé'}
            </button>
          </div>
        )}

        {turnPhase === 'movement' && (
          <>
            <p className="text-lg font-semibold text-indigo-300">
              Déplacements restants : {movePoints}
            </p>

            {/* Rose des vents hexagonale */}
            <div className="relative w-52 h-52">
              {DIRECTION_LABELS.map((label, i) => {
                const angle = (i * 60 - 90) * (Math.PI / 180);
                const x = 50 + 38 * Math.cos(angle);
                const y = 50 + 38 * Math.sin(angle);
                return (
                  <button
                    key={label}
                    onClick={() => move(i)}
                    disabled={moving || movePoints <= 0}
                    className="absolute w-14 h-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-700 font-bold text-sm transition-colors hover:bg-indigo-600 active:scale-90 disabled:opacity-30"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    {label}
                  </button>
                );
              })}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs">
                {player.position_q},{player.position_r}
              </div>
            </div>

            <button
              onClick={endTurn}
              className="mt-2 rounded-xl bg-gray-700 px-8 py-3 font-semibold transition-colors hover:bg-gray-600"
            >
              Fin du tour
            </button>
          </>
        )}
      </div>

      {/* Message en bas */}
      {message && (
        <div className="mx-4 mb-4 rounded-lg bg-gray-800 px-4 py-3 text-center text-sm text-gray-300">
          {message}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg bg-gray-800 px-3 py-1.5">
      <p className="text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function hexDist(a: { q: number; r: number }, b: { q: number; r: number }): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr));
}
