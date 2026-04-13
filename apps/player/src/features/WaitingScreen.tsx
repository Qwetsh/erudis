import { useEffect } from 'react';
import { supabase } from '@erudis/shared';
import { usePlayerStore } from '../store/use-player-store';

export function WaitingScreen() {
  const gameId = usePlayerStore((s) => s.gameId);
  const gameCode = usePlayerStore((s) => s.gameCode);
  const playerId = usePlayerStore((s) => s.playerId);
  const playerName = usePlayerStore((s) => s.playerName);
  const setPhase = usePlayerStore((s) => s.setPhase);

  useEffect(() => {
    if (!gameCode || !gameId || !playerId) return;

    // Canal board pour le Presence + écouter le changement de phase
    const boardChannel = supabase
      .channel(`game:${gameCode}:board`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const updated = payload.new as { phase: string };
          if (updated.phase === 'playing' || updated.phase === 'gameOver') {
            setPhase(updated.phase as 'playing' | 'gameOver');
          }
        },
      )
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await boardChannel.track({ player_id: playerId, player_name: playerName });
        }
      });

    return () => {
      supabase.removeChannel(boardChannel);
    };
  }, [gameCode, gameId, playerId, playerName, setPhase]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gray-900 text-white">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-indigo-400" />
      <h2 className="text-2xl font-bold">En attente du lancement</h2>
      <p className="text-gray-400">{playerName}, ta place est réservée !</p>
      <p className="text-sm text-gray-500">Le prof va lancer la partie...</p>
    </div>
  );
}
