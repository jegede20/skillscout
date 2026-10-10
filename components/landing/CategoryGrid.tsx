'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import type { Category } from '@/lib/types';

const ACCENTS = ['text-orange', 'text-cyan', 'text-yellow'];

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {categories.map((c, i) => (
        <motion.li
          key={c.id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ delay: (i % 6) * 0.05, duration: 0.45 }}
        >
          <Link
            href={`/search?q=${encodeURIComponent(c.name)}`}
            className="card-surface group flex h-full flex-col gap-3 p-4 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,212,255,0.45)]"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-line/60 ${ACCENTS[i % 3]} transition group-hover:scale-110`}>
              <CategoryIcon name={c.icon} className="h-5 w-5" />
            </span>
            <span className="font-display text-base font-semibold leading-tight">{c.name}</span>
            <span className="text-xs text-muted">{c.blurb}</span>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}
