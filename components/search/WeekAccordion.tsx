'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock, Flag } from 'lucide-react';
import { useState } from 'react';
import { PlatformBadge } from './ResourceCard';
import { SwapButton } from './SwapButton';
import { track } from '@/lib/analytics';
import type { Resource, RoadmapWeek } from '@/lib/types';

export function taskKey(week: number, resourceId: string) {
  return `${week}:${resourceId}`;
}

export function WeekAccordion({
  week,
  completed,
  onToggle,
  onSwap,
  defaultOpen = false,
  headingId,
}: {
  week: RoadmapWeek;
  completed: Record<string, boolean>;
  onToggle: (key: string) => void;
  onSwap?: (oldId: string, next: Resource) => void;
  defaultOpen?: boolean;
  headingId: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const done = week.resources.filter((r) => completed[taskKey(week.week, r.resourceId)]).length;
  const total = week.resources.length;
  const weekHours = week.resources.reduce((s, r) => s + r.estimatedHours, 0);
  const panelId = `week-panel-${week.week}-${headingId}`;

  return (
    <div className="card-surface overflow-hidden !rounded-xl">
      <h4 id={headingId}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <span
            aria-hidden="true"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold ${
              total > 0 && done === total ? 'bg-beginner text-black' : 'bg-line text-fg'
            }`}
          >
            {week.week}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base font-semibold leading-snug">{week.title}</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden="true" className="h-3 w-3" /> {weekHours}h
              </span>
              {total > 0 && <span>{done}/{total} done</span>}
            </span>
          </span>
          <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </h4>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-line px-4 pb-4 pt-4">
              {week.topics.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {week.topics.map((t) => (
                    <li key={t} className="rounded-md bg-line/60 px-2 py-0.5 font-mono text-[11px]">
                      {t}
                    </li>
                  ))}
                </ul>
              )}

              <ul className="space-y-3">
                {week.resources.map((res) => {
                  const key = taskKey(week.week, res.resourceId);
                  const checked = !!completed[key];
                  const inputId = `chk-${week.week}-${res.resourceId}-${headingId}`;
                  return (
                    <li key={key} className="flex gap-3 rounded-lg border border-line p-3">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          onToggle(key);
                          if (!checked) track('roadmap_saved', { step: 'task_done' });
                        }}
                        className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-orange"
                        aria-label={`Mark "${res.title}" as completed`}
                      />
                      <div className="min-w-0 flex-1">
                        <PlatformBadge platform={res.platform} />
                        <p className={`mt-1 font-medium leading-snug ${checked ? 'line-through opacity-60' : ''}`}>{res.title}</p>
                        <p className="mt-1 text-sm text-muted">{res.action}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span className="inline-flex items-center gap-1">
                            <Clock aria-hidden="true" className="h-3 w-3" /> {res.estimatedHours}h
                          </span>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-accent underline-offset-4 hover:underline"
                            onClick={() => track('resource_clicked', { platform: res.platform, source: 'roadmap' })}
                          >
                            Start Learning →
                          </a>
                          {onSwap && (
                            <SwapButton
                              compact
                              resourceId={res.resourceId}
                              title={res.title}
                              skillTags={week.topics}
                              onSwapped={(next) => onSwap(res.resourceId, next)}
                            />
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="flex items-start gap-2 rounded-lg bg-yellow/15 p-3 text-sm">
                <Flag aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#92400E] dark:text-yellow" />
                <span>
                  <strong className="font-semibold">Milestone:</strong> {week.milestone}
                </span>
              </p>

              {total > 0 && (
                <button
                  type="button"
                  className="btn-ghost !py-1.5 text-sm"
                  onClick={() => week.resources.forEach((r) => {
                    const key = taskKey(week.week, r.resourceId);
                    if (!completed[key]) onToggle(key);
                  })}
                >
                  Mark whole week complete
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
