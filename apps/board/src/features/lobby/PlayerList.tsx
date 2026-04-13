import { useGameStore } from '../../store/use-game-store';
import { ARCHETYPES, type PlayerRow } from '@erudis/shared';

export function PlayerList() {
  const players = useGameStore((s) => s.players);

  return (
    <div className="w-full max-w-lg">
      <h2 className="mb-4 text-xl font-semibold text-gray-300">
        Joueurs connectés ({players.filter((p: PlayerRow) => p.is_connected).length}/{players.length})
      </h2>
      {players.length === 0 ? (
        <p className="text-gray-500">En attente de joueurs...</p>
      ) : (
        <ul className="space-y-2">
          {players.map((player: PlayerRow) => {
            const archetypeInfo = player.archetype
              ? ARCHETYPES.find((a) => a.id === player.archetype) ?? null
              : null;

            return (
              <li
                key={player.id}
                className="flex items-center gap-3 rounded-lg bg-gray-800 px-4 py-3"
              >
                <span className={`h-3 w-3 rounded-full ${player.is_connected ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className="font-medium">{player.name}</span>
                {archetypeInfo && (
                  <span className="ml-auto rounded bg-indigo-600/30 px-2 py-1 text-xs text-indigo-300">
                    {archetypeInfo.name}
                  </span>
                )}
                {!archetypeInfo && player.character_id && (
                  <span className="ml-auto text-xs text-gray-400">Personnage choisi</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
