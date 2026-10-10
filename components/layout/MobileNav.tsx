'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, History, Home, Info, LayoutDashboard } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Explore', icon: Compass },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/about', label: 'About', icon: Info },
];

/** Bottom navigation for small screens (PWA-style app bar). */
export function MobileNav() {
  const pathname = usePathname();
  // The landing page has its own hero navigation, so the tab bar stays hidden there.
  if (pathname === '/') return null;
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${active ? 'text-accent' : 'text-muted'}`}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
