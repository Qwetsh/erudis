import { usePlayerStore } from './store/use-player-store';
import { JoinScreen } from './features/join/JoinScreen';
import { CharacterSelectScreen } from './features/character-select/CharacterSelectScreen';
import { WaitingScreen } from './features/WaitingScreen';
import { PlayerGameScreen } from './features/game/PlayerGameScreen';

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

  // Partie en cours
  if (phase === 'playing') {
    return <PlayerGameScreen />;
  }

  // En attente du lancement
  return <WaitingScreen />;
}

export default App;
