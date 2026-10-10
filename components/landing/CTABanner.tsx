import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTABanner() {
  return (
    <section aria-labelledby="cta-title" className="mx-auto max-w-content px-4">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-white md:p-14 dark:bg-surface dark:border dark:border-line">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-orange/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-cyan/30 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <h2 id="cta-title" className="max-w-xl font-display text-4xl font-bold leading-tight md:text-5xl">
            Your next skill is <span className="text-yellow">one search away.</span>
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/signup" className="btn-primary">
              Create free account <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link href="/search?q=public%20speaking" className="btn-ghost !border-white/30 !bg-transparent !text-white dark:!text-fg">
              Try a search
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
