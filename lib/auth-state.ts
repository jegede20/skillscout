'use client';

import { useEffect, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/browser';
import { useSkillStore } from '@/lib/store';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface AuthState {
  status: 'loading' | 'authed' | 'anon';
  user: AuthUser | null;
  mode: 'supabase' | 'demo';
}

/** Single source of truth for "who is signed in", works in both Supabase and demo mode. */
export function useAuthState(): AuthState {
  const demoUser = useSkillStore((s) => s.demoUser);
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null, mode: isSupabaseConfigured ? 'supabase' : 'demo' });

  useEffect(() => {
    setHydrated(true);
    if (!isSupabaseConfigured) return;

    const supabase = getSupabase();
    const toState = (u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): AuthState =>
      u
        ? {
            status: 'authed',
            mode: 'supabase',
            user: {
              id: u.id,
              email: u.email ?? '',
              name: (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'Learner',
              avatarUrl: (u.user_metadata?.avatar_url as string) || null,
            },
          }
        : { status: 'anon', user: null, mode: 'supabase' };

    supabase.auth.getUser().then(({ data }) => setState(toState(data.user)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setState(toState(session?.user ?? null)));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (isSupabaseConfigured) return state;

  // Demo mode: derive from the persisted store once hydrated.
  if (!hydrated) return { status: 'loading', user: null, mode: 'demo' };
  return demoUser
    ? { status: 'authed', mode: 'demo', user: { id: 'demo', name: demoUser.fullName || 'Learner', email: demoUser.email, avatarUrl: demoUser.avatarUrl ?? null } }
    : { status: 'anon', mode: 'demo', user: null };
}
