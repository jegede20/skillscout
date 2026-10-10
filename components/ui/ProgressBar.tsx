'use client';

import { motion } from 'framer-motion';

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-fg">
          {value} / {max} · {pct}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        className="h-2.5 w-full overflow-hidden rounded-full bg-line"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange via-yellow to-cyan"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
