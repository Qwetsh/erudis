import { useState } from 'react';
import { supabase, generateMap } from '@erudis/shared';

const db = supabase as any;

type MapGenConfig = {
  size: number;
  zones: number;
  combatDensity: number;
  chestDensity: number;
  seed: string;
};

export function MapEditor({ gameId }: { gameId: string }) {
  const [mode, setMode] = useState<'procedural' | 'manual'>('procedural');
  const [config, setConfig] = useState<MapGenConfig>({
    size: 16,
    zones: 4,
    combatDensity: 0.3,
    chestDensity: 0.15,
    seed: String(Math.floor(Math.random() * 100000)),
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);

    try {
      const seed = Number(config.seed) || 42;
      const mapResult = generateMap({ size: config.size, seed });

      // Supprimer les hex existants
      await db.from('map_hexes').delete().eq('game_id', gameId);

      // Insérer les nouveaux hex par batch
      const rows = mapResult.tiles.map((tile: { q: number; r: number; terrain: string; zone: string; poi: string | null; discovered: boolean }) => ({
        game_id: gameId,
        q: tile.q,
        r: tile.r,
        terrain: tile.terrain,
        zone: tile.zone,
        poi: tile.poi,
        discovered: tile.discovered,
      }));

      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await db.from('map_hexes').insert(batch);
        if (error) {
          setResult(`Erreur insertion batch: ${error.message}`);
          return;
        }
      }

      setResult(`Carte générée : ${rows.length} hexagones`);
    } catch (err) {
      setResult(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('procedural')}
          className={`px-4 py-2 rounded ${
            mode === 'procedural' ? 'bg-blue-600' : 'bg-zinc-700'
          }`}
        >
          Génération procédurale
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`px-4 py-2 rounded ${
            mode === 'manual' ? 'bg-blue-600' : 'bg-zinc-700'
          }`}
        >
          Éditeur manuel
        </button>
      </div>

      {mode === 'procedural' && (
        <div className="flex flex-col gap-3 max-w-md">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-400">
              Taille (diamètre) : {config.size}×{config.size}
            </span>
            <input
              type="range"
              min={12}
              max={30}
              value={config.size}
              onChange={(e) =>
                setConfig({ ...config, size: Number(e.target.value) })
              }
              className="w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-400">
              Nombre de zones : {config.zones}
            </span>
            <input
              type="range"
              min={2}
              max={6}
              value={config.zones}
              onChange={(e) =>
                setConfig({ ...config, zones: Number(e.target.value) })
              }
              className="w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-400">
              Densité combats : {Math.round(config.combatDensity * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={config.combatDensity * 100}
              onChange={(e) =>
                setConfig({
                  ...config,
                  combatDensity: Number(e.target.value) / 100,
                })
              }
              className="w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-400">
              Densité coffres : {Math.round(config.chestDensity * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={50}
              value={config.chestDensity * 100}
              onChange={(e) =>
                setConfig({
                  ...config,
                  chestDensity: Number(e.target.value) / 100,
                })
              }
              className="w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-400">Seed</span>
            <input
              type="text"
              className="px-3 py-2 bg-zinc-800 rounded border border-zinc-700"
              value={config.seed}
              onChange={(e) => setConfig({ ...config, seed: e.target.value })}
            />
          </label>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded font-medium"
          >
            {generating ? 'Génération...' : 'Générer la carte'}
          </button>

          {result && (
            <p className="text-sm text-zinc-300 bg-zinc-800 p-2 rounded">
              {result}
            </p>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="text-zinc-400">
          <p>Éditeur de carte manuelle — sélectionnez un hex et modifiez son terrain/POI.</p>
          <p className="text-sm mt-2">
            L'éditeur visuel utilise le composant HexMap existant avec un mode édition.
          </p>
        </div>
      )}
    </div>
  );
}
