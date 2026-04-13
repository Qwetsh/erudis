import { useState, useEffect } from 'react';
import { supabase } from '@erudis/shared';

const db = supabase as any;

type PlayerStats = {
  playerId: string;
  playerName: string;
  questionsTotal: number;
  questionsCorrect: number;
  combatsWon: number;
  combatsLost: number;
  goldEarned: number;
  themes: Record<string, { total: number; correct: number }>;
};

export function Statistics({ gameId }: { gameId: string }) {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      // Récupérer les joueurs
      const { data: players } = await db
        .from('players')
        .select('id, name')
        .eq('game_id', gameId);

      if (!players) {
        setLoading(false);
        return;
      }

      const results: PlayerStats[] = [];

      for (const player of players) {
        // Questions
        const { data: history } = await db
          .from('player_question_history')
          .select('answered_correctly, questions(theme)')
          .eq('player_id', player.id);

        const questionsTotal = history?.length ?? 0;
        const questionsCorrect = (history ?? []).filter(
          (h: { answered_correctly: boolean }) => h.answered_correctly,
        ).length;

        // Thèmes
        const themes: Record<string, { total: number; correct: number }> = {};
        for (const h of history ?? []) {
          const theme = (h as any).questions?.theme ?? 'unknown';
          if (!themes[theme]) themes[theme] = { total: 0, correct: 0 };
          themes[theme].total++;
          if ((h as any).answered_correctly) themes[theme].correct++;
        }

        // Logs combat
        const { count: combatsWon } = await db
          .from('game_logs')
          .select('*', { count: 'exact', head: true })
          .eq('player_id', player.id)
          .eq('event_type', 'combat_won');

        const { count: combatsLost } = await db
          .from('game_logs')
          .select('*', { count: 'exact', head: true })
          .eq('player_id', player.id)
          .eq('event_type', 'combat_lost');

        results.push({
          playerId: player.id,
          playerName: player.name,
          questionsTotal,
          questionsCorrect,
          combatsWon: combatsWon ?? 0,
          combatsLost: combatsLost ?? 0,
          goldEarned: 0,
          themes,
        });
      }

      setStats(results);
      setLoading(false);
    };

    fetchStats();
  }, [gameId]);

  if (loading) return <p className="text-zinc-400">Chargement des statistiques...</p>;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Statistiques par élève</h3>

      {stats.map((s) => (
        <div key={s.playerId} className="bg-zinc-800 p-4 rounded border border-zinc-700">
          <h4 className="font-medium text-lg">{s.playerName}</h4>

          <div className="grid grid-cols-4 gap-2 mt-2 text-sm">
            <div>
              <span className="text-zinc-400">Questions</span>
              <p className="font-medium">
                {s.questionsCorrect}/{s.questionsTotal}
                {s.questionsTotal > 0 && (
                  <span className="text-zinc-400 ml-1">
                    ({Math.round((s.questionsCorrect / s.questionsTotal) * 100)}%)
                  </span>
                )}
              </p>
            </div>
            <div>
              <span className="text-zinc-400">Combats gagnés</span>
              <p className="font-medium">{s.combatsWon}</p>
            </div>
            <div>
              <span className="text-zinc-400">Combats perdus</span>
              <p className="font-medium">{s.combatsLost}</p>
            </div>
          </div>

          {Object.keys(s.themes).length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-zinc-400 mb-1">Par thème :</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(s.themes).map(([theme, data]) => (
                  <span
                    key={theme}
                    className="px-2 py-1 bg-zinc-700 rounded text-xs"
                  >
                    {theme}: {data.correct}/{data.total}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
