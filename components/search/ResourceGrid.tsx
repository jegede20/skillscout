'use client';

import { motion } from 'framer-motion';
import { ResourceCard } from './ResourceCard';
import type { Resource } from '@/lib/types';

export function ResourceGrid({ resources, onSwap }: { resources: Resource[]; onSwap: (oldId: string, next: Resource) => void }) {
  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
      className="grid gap-4 sm:grid-cols-2"
      aria-label="Recommended free resources"
    >
      {resources.map((r, i) => (
        <li key={r.id} className="contents">
          <ResourceCard resource={r} index={i} onSwap={(next) => onSwap(r.id, next)} />
        </li>
      ))}
    </motion.ul>
  );
}
