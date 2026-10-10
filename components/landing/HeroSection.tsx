'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Compass, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { track } from '@/lib/analytics';

const LINE_1 = ['Learn', 'Anything.'];
const LINE_2 = ['Pay', 'Nothing.'];
const EXAMPLES = ['guitar for fun', 'get a job in tech', 'Python for data', 'public speaking', 'budget like a pro'];

const wordVariants = {
  hidden: { y: '110%', rotate: 4, opacity: 0 },
  show: (i: number) => ({ y: '0%', rotate: 0, opacity: 1, transition: { delay: 0.15 + i * 0.09, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const } }),
};

export function HeroSection({ resourceCount }: { resourceCount: number }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const headlineScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const headlineSkew = useTransform(scrollYProgress, [0, 1], [0, -4]);

  const submit = (value: string) => {
    const term = value.trim();
    if (term.length < 2) return;
    track('search_performed', { source: 'hero' });
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <section ref={ref} aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* decorative blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-4 h-72 w-72 rounded-full bg-orange/20 blur-3xl dark:bg-orange/30" />
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-cyan/15 blur-3xl dark:bg-cyan/25" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-yellow/15 blur-3xl dark:bg-yellow/25" />

      <div className="relative mx-auto max-w-content px-4 pb-12 pt-8 md:pt-12">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 font-mono text-xs text-muted"
        >
          <Compass aria-hidden="true" className="h-3.5 w-3.5 text-yellow" />
          Your shortcut to any skill
        </motion.p>

        <motion.h1
          id="hero-title"
          style={{ scale: headlineScale, skewY: headlineSkew }}
          className="font-display text-[clamp(3.2rem,11vw,8.5rem)] font-bold leading-[0.9] tracking-tighter"
        >
          <span className="block overflow-hidden pb-[0.24em] -mb-[0.24em]">
            {LINE_1.map((w, i) => (
              <motion.span key={w} custom={i} variants={wordVariants} initial="hidden" animate="show" className="mr-[0.25em] inline-block">
                {w}
              </motion.span>
            ))}
          </span>
          <span className="block overflow-hidden pb-[0.24em] -mb-[0.24em]">
            {LINE_2.map((w, i) => (
              <motion.span
                key={w}
                custom={i + 2}
                variants={wordVariants}
                initial="hidden"
                animate="show"
                className={`mr-[0.25em] inline-block ${i === 1 ? 'text-accent' : ''}`}
              >
                {i === 1 ? <span className="kinetic-stroke font-light italic">{w}</span> : w}
              </motion.span>
            ))}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-8 max-w-2xl text-lg text-muted md:text-xl"
        >
          Describe a skill. Get a curated list of free resources from verified platforms and a week-by-week roadmap with
          prerequisites and time estimates. From {resourceCount} vetted resources.
        </motion.p>

        <motion.form
          role="search"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          onSubmit={(e) => {
            e.preventDefault();
            submit(q);
          }}
          className="mt-10 max-w-3xl"
        >
          <label htmlFor="hero-search" className="sr-only">
            What do you want to learn?
          </label>
          <div className="group flex items-center gap-2 rounded-full border-2 border-line bg-surface p-2 pl-6 shadow-xl shadow-orange/5 transition focus-within:border-orange">
            <Search aria-hidden="true" className="h-6 w-6 shrink-0 text-muted" />
            <input
              id="hero-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="I want to learn…"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-3 text-lg text-fg placeholder:text-muted focus:outline-none"
            />
            <button type="submit" className="btn-primary shrink-0 !py-3">
              Scout it <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Example searches">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => submit(ex)}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted transition hover:border-cyan hover:text-fg"
              >
                {ex}
              </button>
            ))}
          </div>
        </motion.form>
      </div>
    </section>
  );
}
