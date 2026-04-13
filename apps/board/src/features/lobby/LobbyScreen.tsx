import { useEffect, useState } from 'react';
import { supabase, startGame, type PlayerRow, type GamePhase } from '@erudis/shared';
import { useGameStore } from '../../store/use-game-store';
import { CreateGame } from './CreateGame';
import { GameCode } from './GameCode';
import { PlayerList } from './PlayerList';

export function LobbyScreen() {
  const gameId = useGameStore((s) => s.gameId);
  const gameCode = useGameStore((s) => s.gameCode);
  const phase = useGameStore((s) => s.phase);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const setPhase = useGameStore((s) => s.setPhase);

  useEffect(() => {
    if (!gameCode || !gameId) return;

    const channel = supabase
      .channel(`game:${gameCode}:board`)
      // Nouveau joueur rejoint
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          addPlayer(payload.new as unknown as PlayerRow);
        },
      )
      // Joueur met à jour (choix personnage, connexion)
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
      // Changement de phase de la partie
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
          if (updated.phase === 'playing') {
            setPhase('playing');
          }
        },
      )
      // Presence pour connexion/déconnexion temps réel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const connectedIds = new Set(
          Object.values(state).flatMap((entries) =>
            (entries as unknown as Array<{ player_id: string }>).map((e) => e.player_id)
          ),
        );
        // Mettre à jour l'état de connexion de chaque joueur
        const currentPlayers = useGameStore.getState().players;
        for (const player of currentPlayers) {
          const isConnected = connectedIds.has(player.id);
          if (player.is_connected !== isConnected) {
            updatePlayer(player.id, { is_connected: isConnected } as Partial<PlayerRow>);
          }
        }
      })
      .subscribe();

    // Charger les joueurs existants
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
  }, [gameCode, gameId, addPlayer, updatePlayer, setPlayers, setPhase]);

  if (!gameId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <CreateGame />
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <h1 className="text-4xl font-bold">Partie en cours...</h1>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-12 bg-gray-900 text-white">
      <GameCode />
      <PlayerList />
      <StartButton />
    </div>
  );
}

function StartButton() {
  const gameId = useGameStore((s) => s.gameId);
  const players = useGameStore((s) => s.players);
  const setPhase = useGameStore((s) => s.setPhase);
  const [loading, setLoading] = useState(false);

  const connectedPlayers = players.filter((p: PlayerRow) => p.is_connected);
  const canStart = connectedPlayers.length >= 1;

  async function handleStart() {
    if (!gameId || !canStart) return;
    setLoading(true);

    try {
      const result = await startGame(gameId);

      if (result.success) {
        setPhase('playing' as GamePhase);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={!canStart || loading}
      className="rounded-xl bg-green-600 px-8 py-4 text-xl font-semibold transition-colors hover:bg-green-500 disabled:opacity-50"
    >
      {loading ? 'Lancement...' : `Lancer la partie (${connectedPlayers.length} joueur${connectedPlayers.length > 1 ? 's' : ''})`}
    </button>
  );
}
