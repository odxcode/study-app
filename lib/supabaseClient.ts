import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isValidSupabaseUrl = (() => {
  try {
    const url = new URL(supabaseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
})();

export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl && supabaseAnonKey,
);

const authError = {
  message:
    'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.',
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      auth: {
        signUp: async () => ({ data: null, error: authError }),
        signInWithPassword: async () => ({ error: authError }),
      },
      from: (_table: string) => ({
        insert: async () => ({ error: authError }),
      }),
    } as any);
