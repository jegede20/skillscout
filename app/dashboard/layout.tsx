'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { History, LayoutDashboard, UserRound } from 'lucide-react';
import { useAuthState } from '@/lib/auth-state';
import { useHydrated } from '@/lib/use-hydrated';
import { useSkillStore } from '@/lib/store';
import { fetchRemoteRoadmaps, fetchRemoteSearches } from '@/lib/remote';

const TABS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/profile', label: 'Profile', icon: UserRound },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const auth = useAuthState();

  // Signed in with Supabase: load the server copy of roadmaps and history into the local store.
  const replaceRoadmaps = useSkillStore((s) => s.replaceRoadmaps);
  const replaceSearches = useSkillStore((s) => s.replaceSearches);
  useEffect(() => {
    if (auth.status !== 'authed' || auth.mode !== 'supabase') return;
    fetchRemoteRoadmaps().then((list) => list && replaceRoadmaps(list));
    fetchRemoteSearches().then((list) => list && replaceSearches(list));
  }, [auth.status, auth.mode, replaceRoadmaps, replaceSearches]);

  // Client-side guard (demo mode). In Supabase mode middleware.ts already redirects.
  useEffect(() => {
    if (hydrated && auth.status === 'anon') router.replace(`/auth/signin?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, auth.status, pathname, router]);

  if (!hydrated || auth.status === 'loading') {
    return (
      <div className="mx-auto max-w-content space-y-4 px-4 py-12" role="status" aria-live="polite">
        <span className="sr-only">Loading your dashboard</span>
        <div className="skeleton h-12 w-1/2 rounded-md" aria-hidden="true" />
        <div className="skeleton h-40 w-full rounded-2xl" aria-hidden="true" />
      </div>
    );
  }
  if (auth.status === 'anon') return null;

  return (
    <div className="mx-auto max-w-content px-4 pt-8">
      <nav aria-label="Dashboard" className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = t.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                active ? 'border-orange bg-orange text-black' : 'border-line bg-surface text-muted hover:text-fg'
              }`}
            >
              <t.icon aria-hidden="true" className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
