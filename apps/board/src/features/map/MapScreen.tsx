import { useEffect, useState } from 'react';
import { supabase, type HexTile, type PlayerRow } from '@erudis/shared';
import { useGameStore } from '../../store/use-game-store';
import { HexMap } from './HexMap';

export function MapScreen() {
  const gameId = useGameStore((s) => s.gameId);
  const gameCode = useGameStore((s) => s.gameCode);
  const players = useGameStore((s) => s.players);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const [tiles, setTiles] = useState<HexTile[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger la carte
  useEffect(() => {
    if (!gameId) return;

    async function loadMap() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('map_hexes')
        .select('*')
        .eq('game_id', gameId);

      if (data && data.length > 0) {
        setTiles(data.map((row: Record<string, unknown>) => ({
          q: row.q as number,
          r: row.r as number,
          terrain: row.terrain as string,
          zone: row.zone as string,
          poi: row.poi as string | null,
          discovered: row.discovered as boolean,
        })) as HexTile[]);
      }
      setLoading(false);
    }

    loadMap();
  }, [gameId]);

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    if (!gameCode || !gameId) return;

    const channel = supabase
      .channel(`game:${gameCode}:board:map`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'map_hexes',
          filter: `game_id=eq.${gameId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const updated = payload.new as unknown as { q: number; r: number; discovered: boolean };
          setTiles((prev) =>
            prev.map((t) =>
              t.q === updated.q && t.r === updated.r
                ? { ...t, discovered: updated.discovered }
                : t,
            ),
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const updated = payload.new as unknown as PlayerRow;
          updatePlayer(updated.id, updated);
        },
      )
      .subscribe();

    // Charger les joueurs actuels
    supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .then(({ data }: { data: PlayerRow[] | null }) => {
        if (data) setPlayers(data);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameCode, gameId, updatePlayer, setPlayers]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      <HexMap tiles={tiles} players={players} />
    </div>
  );
}
