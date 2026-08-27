import { createClient } from '@supabase/supabase-js';

const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const supabaseUrl = configuredSupabaseUrl.replace(/\/(?:rest\/v1|auth\/v1)\/?$/, '');

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

if (!isSupabaseConfigured) {
  throw new Error(
    'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
