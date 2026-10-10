'use client';

import { motion } from 'framer-motion';
import { Search, Map, Trophy } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Describe the skill',
    body: 'Type what you want in plain words: “get a job in tech” or “guitar for fun”. We understand the intent, not just keywords.',
    color: 'bg-orange text-black',
  },
  {
    icon: Map,
    title: 'Get your roadmap',
    body: 'We rank verified free resources and build a week-by-week plan with prerequisites, hours, and milestones.',
    color: 'bg-cyan text-black',
  },
  {
    icon: Trophy,
    title: 'Track and finish',
    body: 'Tick off resources, watch your progress bar fill, and save paths to your dashboard. Learn at your pace.',
    color: 'bg-yellow text-black',
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="mx-auto max-w-content px-4">
      <motion.h2
        id="how-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-4xl font-bold tracking-tight md:text-6xl"
      >
        How it <span className="italic text-accent">works</span>
      </motion.h2>
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.12, duration: 0.5 }}
            className="card-surface relative overflow-hidden p-7"
          >
            <span aria-hidden="true" className="absolute -right-2 -top-6 font-display text-[8rem] font-bold leading-none text-line/70 select-none">
              {i + 1}
            </span>
            <motion.span
              aria-hidden="true"
              whileHover={{ rotate: -8, scale: 1.08 }}
              className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${s.color}`}
            >
              <s.icon className="h-7 w-7" />
            </motion.span>
            <h3 className="relative mt-6 font-display text-2xl font-bold">{s.title}</h3>
            <p className="relative mt-3 text-muted">{s.body}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
