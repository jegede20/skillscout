'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

/** Two-column auth layout with an animated kinetic backdrop. */
export function AuthShell({ title, accent, children, footnote }: { title: string; accent: string; children: React.ReactNode; footnote?: string }) {
  return (
    <main className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-content items-center gap-10 px-4 py-12 md:grid-cols-2">
      <KineticBackdrop />
      <section aria-labelledby="auth-title" className="relative">
        <h1 id="auth-title" className="font-display text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[0.92] tracking-tighter">
          {title} <span className="italic text-accent">{accent}</span>
        </h1>
        <p className="mt-6 max-w-md text-muted">{footnote ?? 'Free forever. Your roadmaps and progress, saved in one place.'}</p>
        <p className="mt-8 text-sm text-muted">
          <Link href="/search" className="underline-offset-4 hover:text-accent hover:underline">
            Or keep exploring without an account →
          </Link>
        </p>
      </section>
      <section className="relative card-surface p-6 md:p-8" aria-label="Form">
        {children}
      </section>
    </main>
  );
}

function KineticBackdrop() {
  const words = ['LEARN', 'BUILD', 'GROW', 'SHIP', 'REPEAT'];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {words.map((w, i) => (
        <motion.span
          key={w}
          className="absolute whitespace-nowrap font-display text-[9rem] font-bold leading-none text-line/60 md:text-[11rem]"
          style={{ top: `${10 + i * 18}%`, left: i % 2 ? '-5%' : '20%' }}
          animate={{ x: i % 2 ? [0, 60, 0] : [0, -60, 0] }}
          transition={{ duration: 14 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {w}
        </motion.span>
      ))}
    </div>
  );
}
