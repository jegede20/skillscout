import WebSocket from 'ws';
// Node 20 has no global WebSocket; supabase-js realtime needs one even when unused.
if (typeof globalThis.WebSocket === 'undefined') (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

/** Server-side storage is available only when Supabase is configured. */
export const serverStorageEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

/** Supabase client bound to the request's session cookies, so Row Level Security applies to every query. */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list: CookieToSet[]) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a read-only context; middleware refreshes the session.
        }
      },
    },
  });
}

/** Returns the signed-in user and a request-scoped client, or null. */
export async function getSession(): Promise<{ supabase: ReturnType<typeof createClient>; user: User } | null> {
  if (!serverStorageEnabled) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}
