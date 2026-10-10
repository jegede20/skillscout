import type { Difficulty, Format } from '@/lib/types';

const DIFF_STYLE: Record<Difficulty, string> = {
  beginner: 'bg-beginner/15 text-[#15803D] dark:text-beginner border-beginner/40',
  intermediate: 'bg-intermediate/15 text-[#B45309] dark:text-intermediate border-intermediate/40',
  advanced: 'bg-advanced/15 text-[#B91C1C] dark:text-advanced border-advanced/40',
};

const FORMAT_LABEL: Record<Format, string> = {
  video: 'Video',
  text: 'Reading',
  interactive: 'Interactive',
  podcast: 'Podcast',
  course: 'Course',
  book: 'Book',
};

export function DifficultyBadge({ level }: { level: Difficulty }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${DIFF_STYLE[level]}`}>
      {level}
    </span>
  );
}

export function FormatBadge({ format }: { format: Format }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted">
      {FORMAT_LABEL[format]}
    </span>
  );
}

export function TagBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-fill px-2 py-0.5 font-mono text-[11px] text-fg">{children}</span>
  );
}
