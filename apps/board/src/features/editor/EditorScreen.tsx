import { useState } from 'react';
import { EntityEditor } from './EntityEditor';
import {
  monstersModule,
  itemsModule,
  charactersModule,
  questionsModule,
  eventsModule,
  questsModule,
  encountersModule,
} from './modules';
import type { EditorModuleConfig } from './types';

const modules: { key: string; label: string; config: EditorModuleConfig }[] = [
  { key: 'monsters', label: 'Monstres', config: monstersModule },
  { key: 'items', label: 'Objets', config: itemsModule },
  { key: 'characters', label: 'Personnages', config: charactersModule },
  { key: 'questions', label: 'Questions', config: questionsModule },
  { key: 'events', label: 'Événements', config: eventsModule },
  { key: 'quests', label: 'Quêtes', config: questsModule },
  { key: 'encounters', label: 'Rencontres', config: encountersModule },
];

export function EditorScreen() {
  const [activeModule, setActiveModule] = useState('monsters');

  const currentModule = modules.find((m) => m.key === activeModule);

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-white">
      {/* Tabs */}
      <nav className="flex gap-1 p-2 bg-zinc-800 border-b border-zinc-700 overflow-x-auto">
        {modules.map((mod) => (
          <button
            key={mod.key}
            onClick={() => setActiveModule(mod.key)}
            className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap ${
              activeModule === mod.key
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            {mod.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {currentModule && (
          <EntityEditor key={currentModule.key} config={currentModule.config} />
        )}
      </div>
    </div>
  );
}
