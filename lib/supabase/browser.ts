'use client';

import { createBrowserClient } from '@supabase/ssr';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** When false the app runs in demo mode: local accounts stored in the browser. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
