import { useState } from 'react';
import { ARCHETYPES, supabase, type CharacterRow } from '@erudis/shared';
import { usePlayerStore } from '../../store/use-player-store';
import { CharacterCard } from './CharacterCard';

export function CharacterSelectScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedArchetype = usePlayerStore((s) => s.selectedArchetype);
  const selectArchetype = usePlayerStore((s) => s.selectArchetype);
  const setCharacterId = usePlayerStore((s) => s.setCharacterId);
  const playerId = usePlayerStore((s) => s.playerId);

  async function handleConfirm() {
    if (!selectedArchetype || !playerId) return;
    setLoading(true);
    setError(null);

    try {
      // Trouver le personnage correspondant à l'archétype
      const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .eq('archetype', selectedArchetype)
        .limit(1);

      const character = (characters as CharacterRow[] | null)?.[0];

      // Déterminer les stats à appliquer
      const archetypeData = ARCHETYPES.find((a) => a.id === selectedArchetype);
      if (!archetypeData) {
        setError('Archétype introuvable');
        return;
      }

      const stats = character
        ? { hp: character.hp, atk: character.atk, def: character.def, vit: character.vit, force: character.force }
        : archetypeData.stats;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('players')
        .update({
          hp: stats.hp,
          hp_max: stats.hp,
          atk: stats.atk,
          def: stats.def,
          vit: stats.vit,
          force: stats.force,
          archetype: selectedArchetype,
          character_id: character?.id ?? null,
        })
        .eq('id', playerId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setCharacterId(character?.id ?? selectedArchetype);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 p-4 text-white">
      <h2 className="mb-4 text-center text-2xl font-bold">Choisis ton personnage</h2>

      <div className="flex-1 space-y-3 overflow-y-auto pb-20">
        {ARCHETYPES.map((archetype) => (
          <CharacterCard
            key={archetype.id}
            archetype={archetype}
            selected={selectedArchetype === archetype.id}
            onSelect={() => selectArchetype(archetype.id)}
          />
        ))}
      </div>

      {error && <p className="text-center text-red-400 text-sm">{error}</p>}

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-4">
        <button
          onClick={handleConfirm}
          disabled={!selectedArchetype || loading}
          className="w-full rounded-xl bg-indigo-600 py-4 text-lg font-semibold transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Validation...' : 'Confirmer'}
        </button>
      </div>
    </div>
  );
}
