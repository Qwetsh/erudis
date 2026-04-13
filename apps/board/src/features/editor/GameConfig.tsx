import { useState, useEffect } from 'react';
import { supabase } from '@erudis/shared';

const db = supabase as any;

type ConfigEntry = {
  key: string;
  value: unknown;
  label: string;
  type: 'number' | 'boolean';
};

const CONFIG_KEYS: ConfigEntry[] = [
  { key: 'shop_price_multiplier', value: 1.0, label: 'Multiplicateur prix boutique', type: 'number' },
  { key: 'pvp_damage_k', value: 3, label: 'Constante K (dégâts PvP)', type: 'number' },
  { key: 'pvp_timer', value: 30, label: 'Timer PvP (secondes)', type: 'number' },
  { key: 'question_multiplier_duo', value: 2, label: 'Multiplicateur Duo', type: 'number' },
  { key: 'question_multiplier_quatre', value: 4, label: 'Multiplicateur Quatre', type: 'number' },
  { key: 'question_multiplier_cash', value: 8, label: 'Multiplicateur Cash', type: 'number' },
  { key: 'fog_enabled', value: true, label: 'Brouillard de guerre', type: 'boolean' },
  { key: 'pvp_enabled', value: true, label: 'PvP activé', type: 'boolean' },
  { key: 'forge_cost', value: 50, label: 'Coût de forge', type: 'number' },
];

export function GameConfig({ gameId }: { gameId: string }) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await db
        .from('game_config')
        .select('key, value')
        .eq('game_id', gameId);

      const configMap: Record<string, unknown> = {};
      for (const entry of CONFIG_KEYS) {
        configMap[entry.key] = entry.value;
      }
      for (const row of data ?? []) {
        configMap[row.key] = row.value;
      }
      setValues(configMap);
    };

    const fetchTemplates = async () => {
      const { data } = await db
        .from('config_templates')
        .select('id, name')
        .order('created_at', { ascending: false });
      setTemplates((data as { id: string; name: string }[]) ?? []);
    };

    fetchConfig();
    fetchTemplates();
  }, [gameId]);

  const updateConfig = async (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));

    await db
      .from('game_config')
      .upsert(
        { game_id: gameId, key, value: JSON.stringify(value), updated_at: new Date().toISOString() },
        { onConflict: 'game_id,key' },
      );
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) return;

    await db.from('config_templates').insert({
      name: templateName,
      config: values,
    });

    setTemplateName('');
    const { data } = await supabase
      .from('config_templates')
      .select('id, name')
      .order('created_at', { ascending: false });
    setTemplates((data as { id: string; name: string }[]) ?? []);
  };

  const loadTemplate = async (templateId: string) => {
    const { data } = await db
      .from('config_templates')
      .select('config')
      .eq('id', templateId)
      .single();

    if (data?.config) {
      const config = data.config as Record<string, unknown>;
      setValues(config);
      for (const [key, value] of Object.entries(config)) {
        await updateConfig(key, value);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Configuration en direct</h3>

      <div className="grid grid-cols-2 gap-3">
        {CONFIG_KEYS.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2">
            <label className="text-sm text-zinc-400 flex-1">{entry.label}</label>
            {entry.type === 'number' ? (
              <input
                type="number"
                className="w-24 px-2 py-1 bg-zinc-800 rounded border border-zinc-700 text-sm"
                value={Number(values[entry.key] ?? entry.value)}
                onChange={(e) => updateConfig(entry.key, Number(e.target.value))}
              />
            ) : (
              <input
                type="checkbox"
                checked={Boolean(values[entry.key] ?? entry.value)}
                onChange={(e) => updateConfig(entry.key, e.target.checked)}
                className="w-4 h-4"
              />
            )}
          </div>
        ))}
      </div>

      {/* Templates */}
      <div className="border-t border-zinc-700 pt-4 flex flex-col gap-2">
        <h4 className="font-medium">Templates</h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nom du template..."
            className="flex-1 px-3 py-2 bg-zinc-800 rounded border border-zinc-700"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <button
            onClick={saveTemplate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded"
          >
            Sauvegarder
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => loadTemplate(t.id)}
              className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
