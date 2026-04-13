import type { ArchetypeInfo } from '@erudis/shared';

type Props = {
  archetype: ArchetypeInfo;
  selected: boolean;
  onSelect: () => void;
};

export function CharacterCard({ archetype, selected, onSelect }: Props) {
  const { stats } = archetype;

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-xl p-4 text-left transition-all ${
        selected
          ? 'bg-indigo-600 ring-2 ring-indigo-400'
          : 'bg-gray-800 hover:bg-gray-700'
      }`}
    >
      <h3 className="text-lg font-bold">{archetype.name}</h3>
      <p className="mb-3 text-sm text-gray-300">{archetype.description}</p>
      <div className="grid grid-cols-5 gap-1 text-center text-xs">
        <div>
          <div className="font-semibold text-red-400">{stats.hp}</div>
          <div className="text-gray-500">PV</div>
        </div>
        <div>
          <div className="font-semibold text-orange-400">{stats.atk}</div>
          <div className="text-gray-500">ATK</div>
        </div>
        <div>
          <div className="font-semibold text-blue-400">{stats.def}</div>
          <div className="text-gray-500">DEF</div>
        </div>
        <div>
          <div className="font-semibold text-green-400">{stats.vit}</div>
          <div className="text-gray-500">VIT</div>
        </div>
        <div>
          <div className="font-semibold text-yellow-400">{stats.force}</div>
          <div className="text-gray-500">FOR</div>
        </div>
      </div>
    </button>
  );
}
