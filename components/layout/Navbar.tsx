'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '@/components/brand/Logo';
import { useAuthState } from '@/lib/auth-state';

const LINKS = [
  { href: '/search', label: 'Explore' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const pathname = usePathname();
  const auth = useAuthState();

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
              {auth.user?.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- user photo, decorative next to the greeting
                <img src={auth.user.avatarUrl} alt="" className="hidden h-8 w-8 rounded-full object-cover sm:block" />
              )}
              <span className="hidden text-sm text-muted lg:inline">Hi, {auth.user?.name.split(' ')[0]}</span>
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
