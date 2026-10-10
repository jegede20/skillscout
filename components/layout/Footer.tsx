'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';

/** Pages where the footer is hidden: the auth forms and the Explore results page. */
const HIDDEN_ON = ['/auth', '/search'];

export function Footer() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo className="text-2xl" />
          <p className="mt-2 max-w-xs text-sm text-muted">Your shortcut to any skill. Learn anything. Pay nothing.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-3 text-sm">
          <Link className="hover:text-accent" href="/search">Explore skills</Link>
          <Link className="hover:text-accent" href="/about">About</Link>
          <Link className="hover:text-accent" href="/about#platforms">Platforms</Link>
          <Link className="hover:text-accent" href="/about#contact">Feedback</Link>
          <Link className="hover:text-accent" href="/auth/signup">Create account</Link>
          <Link className="hover:text-accent" href="/auth/signin">Sign in</Link>
        </nav>
        <p className="text-sm text-muted">
          Every resource we list is free. No free-trial traps, no paywalls.
          <br />
          © {new Date().getFullYear()} SkillScout.
        </p>
      </div>
    </footer>
  );
}
