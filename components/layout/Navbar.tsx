'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '@/components/brand/Logo';
import { useAuthState } from '@/lib/auth-state';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/browser';
import { useSkillStore } from '@/lib/store';

const LINKS = [
  { href: '/search', label: 'Explore' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthState();
  const signOutDemo = useSkillStore((s) => s.signOutDemo);

  const signOut = async () => {
    if (isSupabaseConfigured) await getSupabase().auth.signOut();
    else signOutDemo();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-bg/80 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="SkillScout home" className="rounded-md">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition hover:text-accent ${active ? 'text-accent' : 'text-muted'}`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {auth.status === 'authed' ? (
            <>
              <span className="hidden text-sm text-muted lg:inline">Hi, {auth.user?.name.split(' ')[0]}</span>
              <button type="button" onClick={signOut} className="btn-ghost !px-3" aria-label="Sign out">
                <LogOut aria-hidden="true" className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="btn-ghost hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn-primary !px-4 !py-2 text-sm">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
