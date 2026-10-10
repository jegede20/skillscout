'use client';

import type { Filters, Difficulty, Format, DurationBucket } from '@/lib/types';

type Option<T extends string> = { value: T | undefined; label: string };

const DIFFICULTY: Option<Difficulty>[] = [
  { value: undefined, label: 'All' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
const FORMAT: Option<Format>[] = [
  { value: undefined, label: 'All' },
  { value: 'video', label: 'Video' },
  { value: 'text', label: 'Text' },
  { value: 'interactive', label: 'Interactive' },
  { value: 'course', label: 'Course' },
];
const DURATION: Option<DurationBucket>[] = [
  { value: undefined, label: 'Any' },
  { value: 'short', label: 'Short (≤5h)' },
  { value: 'medium', label: 'Medium (5–30h)' },
  { value: 'long', label: 'Long (30h+)' },
];

function Group<T extends string>({
  legend,
  options,
  value,
  onPick,
}: {
  legend: string;
  options: Option<T>[];
  value: T | undefined;
  onPick: (v: T | undefined) => void;
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="mr-1 font-mono text-xs uppercase tracking-wider text-muted">{legend}</legend>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.label}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(o.value)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              active ? 'border-orange bg-orange text-black' : 'border-line bg-surface text-muted hover:border-orange hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </fieldset>
  );
}

export function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  return (
    <div className="flex flex-col gap-3 py-4">
      <Group legend="Difficulty" options={DIFFICULTY} value={filters.difficulty} onPick={(v) => onChange({ ...filters, difficulty: v })} />
      <Group legend="Format" options={FORMAT} value={filters.format} onPick={(v) => onChange({ ...filters, format: v })} />
      <Group legend="Duration" options={DURATION} value={filters.duration} onPick={(v) => onChange({ ...filters, duration: v })} />
    </div>
  );
}
