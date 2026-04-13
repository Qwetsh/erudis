import { useState } from 'react';
import { useGameStore } from './store/use-game-store';
import { LobbyScreen } from './features/lobby/LobbyScreen';
import { MapScreen } from './features/map/MapScreen';
import { EditorScreen } from './features/editor/EditorScreen';
import { AnimationLayer } from './features/animations/AnimationLayer';

function App() {
  const phase = useGameStore((s) => s.phase);
  const [showEditor, setShowEditor] = useState(false);

  if (showEditor) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowEditor(false)}
          className="absolute top-2 right-2 z-50 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-white text-sm"
        >
          Retour au jeu
        </button>
        <EditorScreen />
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <>
        <AnimationLayer />
        <MapScreen />
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowEditor(true)}
        className="absolute top-2 right-2 z-50 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm"
      >
        Éditeur
      </button>
      <LobbyScreen />
    </div>
  );
}

export default App;
