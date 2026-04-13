import { useState } from 'react';
import { createGame } from '@erudis/shared';
import { useGameStore } from '../../store/use-game-store';
import type { GamePhase } from '@erudis/shared';

export function CreateGame() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setGame = useGameStore((s) => s.setGame);

  async function handleCreate() {
    setLoading(true);
    setError(null);

    try {
      const result = await createGame();

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      const { game } = result.data;
      setGame(game.id as string, game.code as string, game.phase as GamePhase);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-5xl font-bold tracking-tight">Érudis</h1>
      <p className="text-lg text-gray-400">Créez une partie pour que vos élèves puissent rejoindre</p>
      <button
        onClick={handleCreate}
        disabled={loading}
        className="rounded-xl bg-indigo-600 px-8 py-4 text-2xl font-semibold transition-colors hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Création...' : 'Créer une partie'}
      </button>
      {error && (
        <p className="text-red-400">{error}</p>
      )}
    </div>
  );
}
