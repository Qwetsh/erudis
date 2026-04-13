import { useState } from 'react';
import { joinGame, type GamePhase } from '@erudis/shared';
import { usePlayerStore } from '../../store/use-player-store';

export function JoinScreen() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const setGameInfo = usePlayerStore((s) => s.setGameInfo);

  async function handleJoin() {
    if (!code.trim() || !name.trim()) {
      setError('Le code et le prénom sont requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await joinGame(code.toUpperCase(), name.trim());

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      const { game, player } = result.data;
      setPlayer(player.id as string, player.name as string);
      setGameInfo(game.id as string, game.code as string, game.phase as GamePhase);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gray-900 p-6 text-white">
      <h1 className="text-3xl font-bold">Érudis</h1>
      <p className="text-gray-400">Entre le code affiché sur le tableau</p>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="CODE"
        maxLength={6}
        className="w-full max-w-xs rounded-lg bg-gray-800 px-4 py-3 text-center font-mono text-3xl tracking-[0.3em] placeholder:text-gray-600"
      />

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ton prénom"
        maxLength={20}
        className="w-full max-w-xs rounded-lg bg-gray-800 px-4 py-3 text-center text-lg placeholder:text-gray-600"
      />

      <button
        onClick={handleJoin}
        disabled={loading || !code.trim() || !name.trim()}
        className="w-full max-w-xs rounded-xl bg-indigo-600 px-6 py-4 text-xl font-semibold transition-colors hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Connexion...' : 'Rejoindre'}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
