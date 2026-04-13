import { useGameStore } from '../../store/use-game-store';

export function GameCode() {
  const gameCode = useGameStore((s) => s.gameCode);

  if (!gameCode) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xl text-gray-400">Code de la partie</p>
      <div className="rounded-2xl bg-gray-800 px-12 py-6">
        <span className="font-mono text-7xl font-bold tracking-[0.3em] text-white">
          {gameCode}
        </span>
      </div>
      <p className="text-gray-500">Les élèves entrent ce code sur leur téléphone</p>
    </div>
  );
}
