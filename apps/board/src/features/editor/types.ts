import type { z } from 'zod';

/** Configuration d'un champ pour l'EntityEditor */
export type FieldConfig = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'json' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  hidden?: boolean;
};

/** Configuration d'un module d'éditeur */
export type EditorModuleConfig<T = Record<string, unknown>> = {
  tableName: string;
  title: string;
  schema: z.ZodType<T>;
  fields: FieldConfig[];
  defaultValues: Partial<T>;
  preview?: React.ComponentType<{ item: T }>;
  searchField?: string;
};
