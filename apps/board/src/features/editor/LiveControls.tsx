import { useState, useEffect } from 'react';
import { supabase } from '@erudis/shared';

const db = supabase as any;

type Player = {
  id: string;
  name: string;
  hp: number;
  hp_max: number;
  gold: number;
  position_q: number;
  position_r: number;
};

export function LiveControls({ gameId }: { gameId: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [spectatorMode, setSpectatorMode] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await db
        .from('players')
        .select('id, name, hp, hp_max, gold, position_q, position_r')
        .eq('game_id', gameId);
      setPlayers((data as Player[]) ?? []);
    };

    fetchPlayers();

    const channel = supabase
      .channel(`game:${gameId}:admin`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` }, () => {
        fetchPlayers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId]);

  const updateGamePhase = async (phase: string) => {
    await db.from('games').update({ phase }).eq('id', gameId);
  };

  const updatePlayer = async (playerId: string, updates: Partial<Player>) => {
    await db.from('players').update(updates).eq('id', playerId);
  };

  const kickPlayer = async (playerId: string) => {
    await db.from('players').delete().eq('id', playerId);
  };

  const teleportPlayer = async (playerId: string, q: number, r: number) => {
    await updatePlayer(playerId, { position_q: q, position_r: r } as Partial<Player>);
  };

  const selected = players.find((p) => p.id === selectedPlayer);

  return (
    <div className="flex flex-col gap-4">
      {/* Contrôles de partie */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => updateGamePhase('paused')}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded"
        >
          Pause
        </button>
        <button
          onClick={() => updateGamePhase('playing')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded"
        >
          Reprendre
        </button>
        <button
          onClick={() => updateGamePhase('gameOver')}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded"
        >
          Arrêter
        </button>
        <button
          onClick={() => setSpectatorMode(!spectatorMode)}
          className={`px-4 py-2 rounded ${
            spectatorMode ? 'bg-purple-600' : 'bg-zinc-700'
          }`}
        >
          {spectatorMode ? 'Mode Spectateur ON' : 'Mode Spectateur OFF'}
        </button>
      </div>

      {/* Liste des joueurs */}
      <div className="grid grid-cols-2 gap-2">
        {players.map((player) => (
          <div
            key={player.id}
            onClick={() => setSelectedPlayer(player.id)}
            className={`p-3 rounded cursor-pointer ${
              selectedPlayer === player.id
                ? 'bg-blue-600/30 border border-blue-500'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            <p className="font-medium">{player.name}</p>
            <p className="text-sm text-zinc-400">
              PV: {player.hp}/{player.hp_max} | Or: {player.gold} | Pos: ({player.position_q},{player.position_r})
            </p>
          </div>
        ))}
      </div>

      {/* Actions sur joueur sélectionné */}
      {selected && (
        <div className="bg-zinc-800 p-4 rounded border border-zinc-700 flex flex-col gap-3">
          <h3 className="font-semibold">{selected.name}</h3>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => updatePlayer(selected.id, { hp: selected.hp_max })}
              className="px-3 py-1 bg-emerald-600 rounded text-sm"
            >
              Soigner max
            </button>
            <button
              onClick={() => updatePlayer(selected.id, { gold: selected.gold + 100 } as Partial<Player>)}
              className="px-3 py-1 bg-yellow-600 rounded text-sm"
            >
              +100 Or
            </button>
            <button
              onClick={() => teleportPlayer(selected.id, 0, 0)}
              className="px-3 py-1 bg-blue-600 rounded text-sm"
            >
              Téléporter spawn
            </button>
            <button
              onClick={() => kickPlayer(selected.id)}
              className="px-3 py-1 bg-red-600 rounded text-sm"
            >
              Kick
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-sm text-zinc-400">PV:</label>
            <input
              type="number"
              className="w-20 px-2 py-1 bg-zinc-700 rounded text-sm"
              value={selected.hp}
              onChange={(e) =>
                updatePlayer(selected.id, { hp: Number(e.target.value) })
              }
            />
            <label className="text-sm text-zinc-400">Or:</label>
            <input
              type="number"
              className="w-20 px-2 py-1 bg-zinc-700 rounded text-sm"
              value={selected.gold}
              onChange={(e) =>
                updatePlayer(selected.id, { gold: Number(e.target.value) } as Partial<Player>)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
