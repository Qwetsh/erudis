import { usePlayerStore } from './store/use-player-store';
import { JoinScreen } from './features/join/JoinScreen';
import { CharacterSelectScreen } from './features/character-select/CharacterSelectScreen';
import { WaitingScreen } from './features/WaitingScreen';

function App() {
  const gameId = usePlayerStore((s) => s.gameId);
  const characterId = usePlayerStore((s) => s.characterId);
  const phase = usePlayerStore((s) => s.phase);

  // Pas encore connecté → écran de join
  if (!gameId) {
    return <JoinScreen />;
  }

  // Connecté mais pas de personnage → sélection
  if (!characterId) {
    return <CharacterSelectScreen />;
  }

  // Partie en cours → placeholder
  if (phase === 'playing') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <h1 className="text-2xl font-bold">Partie en cours...</h1>
      </div>
    );
  }

  // En attente du lancement
  return <WaitingScreen />;
}

export default App;
