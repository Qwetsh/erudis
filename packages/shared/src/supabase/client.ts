import { createClient } from '@supabase/supabase-js';
import type { Database } from './types.ts';

function getEnv(viteKey: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (import.meta as any).env;
    if (meta?.[viteKey]) return meta[viteKey] as string;
  } catch { /* not in Vite */ }
  return '';
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
