import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@erudis/shared';
import type { EditorModuleConfig, FieldConfig } from './types';

type EntityEditorProps<T extends Record<string, unknown>> = {
  config: EditorModuleConfig<T>;
};

export function EntityEditor<T extends Record<string, unknown>>({
  config,
}: EntityEditorProps<T>) {
  const [items, setItems] = useState<(T & { id: string })[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>(
    config.defaultValues as Record<string, unknown>,
  );
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from(config.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setItems((data ?? []) as (T & { id: string })[]);
    }
    setLoading(false);
  }, [config.tableName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = config.searchField
    ? items.filter((item) => {
        const val = String(item[config.searchField!] ?? '');
        return val.toLowerCase().includes(search.toLowerCase());
      })
    : items;

  const selectItem = (item: T & { id: string }) => {
    setSelectedId(item.id);
    const data: Record<string, unknown> = {};
    for (const field of config.fields) {
      data[field.name] = item[field.name as keyof T];
    }
    setFormData(data);
    setError(null);
  };

  const resetForm = () => {
    setSelectedId(null);
    setFormData(config.defaultValues as Record<string, unknown>);
    setError(null);
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = async () => {
    setError(null);
    const result = config.schema.safeParse(formData);
    if (!result.success) {
      setError(result.error.errors.map((e) => e.message).join(', '));
      return;
    }

    setLoading(true);
    const db = supabase as any;
    if (selectedId) {
      const { error: updateError } = await db
        .from(config.tableName)
        .update(result.data)
        .eq('id', selectedId);

      if (updateError) setError(updateError.message);
    } else {
      const { error: insertError } = await db
        .from(config.tableName)
        .insert(result.data);

      if (insertError) setError(insertError.message);
    }

    await fetchItems();
    resetForm();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }

    setLoading(true);
    await supabase.from(config.tableName).delete().eq('id', id);
    await fetchItems();
    if (selectedId === id) resetForm();
    setConfirmDelete(null);
    setLoading(false);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Liste */}
      <div className="w-1/3 flex flex-col gap-2">
        <h2 className="text-xl font-bold">{config.title}</h2>

        {config.searchField && (
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full px-3 py-2 bg-zinc-800 rounded border border-zinc-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}

        <button
          onClick={resetForm}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-medium"
        >
          + Nouveau
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {loading && items.length === 0 && (
            <p className="text-zinc-400 text-sm">Chargement...</p>
          )}
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                selectedId === item.id
                  ? 'bg-blue-600/30 border border-blue-500'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
              onClick={() => selectItem(item)}
            >
              <span className="truncate text-sm">
                {config.searchField
                  ? String(item[config.searchField as keyof T] ?? item.id)
                  : item.id}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                className={`ml-2 px-2 py-1 text-xs rounded ${
                  confirmDelete === item.id
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-700 text-zinc-400 hover:bg-red-600 hover:text-white'
                }`}
              >
                {confirmDelete === item.id ? 'Confirmer' : '✕'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire */}
      <div className="w-2/3 flex flex-col gap-3">
        <h3 className="text-lg font-semibold">
          {selectedId ? 'Modifier' : 'Créer'}
        </h3>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {config.fields
          .filter((f) => !f.hidden)
          .map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={formData[field.name]}
              onChange={(val) => handleFieldChange(field.name, val)}
            />
          ))}

        {/* Preview */}
        {config.preview && formData && (
          <div className="mt-2 p-3 bg-zinc-800 rounded border border-zinc-700">
            <p className="text-xs text-zinc-400 mb-1">Aperçu</p>
            <config.preview item={formData as T} />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-white font-medium"
          >
            {selectedId ? 'Sauvegarder' : 'Créer'}
          </button>
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-300"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const baseClass = 'w-full px-3 py-2 bg-zinc-800 rounded border border-zinc-700 text-white';

  switch (field.type) {
    case 'text':
      return (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-400">{field.label}</span>
          <input
            type="text"
            className={baseClass}
            placeholder={field.placeholder}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );

    case 'number':
      return (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-400">{field.label}</span>
          <input
            type="number"
            className={baseClass}
            placeholder={field.placeholder}
            value={value !== undefined && value !== null ? Number(value) : ''}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </label>
      );

    case 'select':
      return (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-400">{field.label}</span>
          <select
            className={baseClass}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">-- Choisir --</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      );

    case 'textarea':
      return (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-400">{field.label}</span>
          <textarea
            className={`${baseClass} h-24 resize-y`}
            placeholder={field.placeholder}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );

    case 'json':
      return (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-400">{field.label} (JSON)</span>
          <textarea
            className={`${baseClass} h-32 resize-y font-mono text-sm`}
            placeholder={field.placeholder ?? '{}'}
            value={
              typeof value === 'string'
                ? value
                : JSON.stringify(value ?? {}, null, 2)
            }
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
          />
        </label>
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-zinc-400">{field.label}</span>
        </label>
      );
  }
}
