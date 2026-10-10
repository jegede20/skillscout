'use client';

import { animate, useInView, useMotionValue, useTransform, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => Math.round(v).toLocaleString('en-US'));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, { duration: 1.6, ease: 'easeOut' });
    return () => controls.stop();
  }, [inView, to, value]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

export function StatsCounter({ resources, skills, learners }: { resources: number; skills: number; learners: number | null }) {
  const stats = [
    { label: 'free resources', node: <Counter to={resources} suffix="+" /> },
    { label: 'skills mapped', node: <Counter to={skills} suffix="+" /> },
    {
      label: 'learners',
      node: learners !== null ? <Counter to={learners} suffix="+" /> : <span className="block text-base leading-tight sm:text-3xl">Be the first</span>,
    },
  ];

  return (
    <section aria-label="Platform statistics" className="mx-auto max-w-content px-4">
      <dl className="grid grid-cols-3 gap-2 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card-surface flex min-w-0 flex-col items-start p-3 sm:p-6">
            <dt className="order-2 mt-1 font-mono text-[10px] uppercase leading-tight tracking-wider text-muted sm:text-sm">{s.label}</dt>
            <dd className="order-1 font-display text-2xl font-bold tracking-tight sm:text-5xl md:text-6xl">{s.node}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
