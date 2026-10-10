'use client';

import { motion } from 'framer-motion';
import { BookOpen, Clock, FileText, GraduationCap, Headphones, MousePointerClick, Video, ArrowUpRight } from 'lucide-react';
import { DifficultyBadge, FormatBadge } from '@/components/ui/Badge';
import { SwapButton } from './SwapButton';
import { track } from '@/lib/analytics';
import { useSkillStore } from '@/lib/store';
import type { Format, Resource } from '@/lib/types';

const FORMAT_ICON: Record<Format, typeof Video> = {
  video: Video,
  text: FileText,
  interactive: MousePointerClick,
  podcast: Headphones,
  course: GraduationCap,
  book: BookOpen,
};

export function PlatformBadge({ platform }: { platform: string }) {
  const initials = platform
    .replace(/\(.*?\)/g, '')
    .split(/[\s—-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-muted">
      <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-md bg-fg text-[10px] font-bold text-bg">
        {initials}
      </span>
      {platform}
    </span>
  );
}

export function ResourceCard({
  resource,
  onSwap,
  index = 0,
}: {
  resource: Resource;
  onSwap: (next: Resource) => void;
  index?: number;
}) {
  const recordVisit = useSkillStore((s) => s.recordVisit);
  const FormatIcon = FORMAT_ICON[resource.format];

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05 }}
      whileHover={{ y: -4 }}
      className="card-surface group flex h-full flex-col p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <PlatformBadge platform={resource.platform} />
        <DifficultyBadge level={resource.difficulty} />
      </div>

      <h3 className="font-display text-xl font-bold leading-snug">{resource.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted">{resource.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 font-mono text-xs">
          <FormatIcon aria-hidden="true" className="h-3.5 w-3.5" />
          <FormatBadge format={resource.format} />
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock aria-hidden="true" className="h-3.5 w-3.5" />
          <span>{resource.durationHours}h</span>
        </span>
        <span className="font-mono text-xs text-accent">Free</span>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <SwapButton resourceId={resource.id} title={resource.title} skillTags={resource.skillTags} onSwapped={onSwap} />
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            track('resource_clicked', { platform: resource.platform, difficulty: resource.difficulty });
            recordVisit({ resourceId: resource.id, title: resource.title, url: resource.url });
          }}
          aria-label={`Start learning: ${resource.title} (opens in a new tab)`}
          className="inline-flex items-center gap-1 rounded-full bg-orange px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
        >
          Start Learning <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>
    </motion.article>
  );
}
