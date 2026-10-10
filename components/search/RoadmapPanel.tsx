'use client';

import Link from 'next/link';
import { ArrowRight, Bookmark, BookmarkCheck, Clock, Lock, RefreshCw, Route, Target } from 'lucide-react';
import { DifficultyBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { FeedbackButtons } from './FeedbackButtons';
import { WeekAccordion } from './WeekAccordion';
import type { Resource, Roadmap, RoadmapStatus } from '@/lib/types';

const STATUS_COPY: Record<RoadmapStatus, string> = {
  ai: 'AI-personalised',
  fallback: 'Template plan · verified resources',
  timeout: 'AI was slow · showing a template plan',
  rate_limited: 'Too many requests · showing a template plan',
};

export interface RoadmapPanelProps {
  roadmap: Roadmap;
  status: RoadmapStatus;
  roadmapId: string;
  progress: Record<string, boolean>;
  onToggle: (key: string) => void;
  onSwap?: (oldId: string, next: Resource) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onSave?: () => void;
  saved?: boolean;
  feedback?: 'up' | 'down';
  onFeedback?: (rating: 'up' | 'down') => void;
  locked?: boolean;
  unlockHref?: string;
}

export function RoadmapPanel(props: RoadmapPanelProps) {
  const { roadmap, status, roadmapId, progress, onToggle, onSwap, onRefresh, refreshing, onSave, saved, feedback, onFeedback, locked, unlockHref } = props;
  const weeks = roadmap.weeklyRoadmap;
  const completedWeeks = weeks.filter((w) => w.resources.length > 0 && w.resources.every((r) => progress[`${w.week}:${r.resourceId}`])).length;

  return (
    <section aria-labelledby="roadmap-title" className="relative">
      <div className={`card-surface space-y-6 p-5 md:p-6 ${locked ? 'select-none' : ''}`} aria-hidden={locked || undefined}>
        <header className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">Your learning path</p>
          <h2 id="roadmap-title" className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {roadmap.skillName}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <DifficultyBadge level={roadmap.difficulty} />
            <span className="inline-flex items-center gap-1.5 text-muted">
              <Clock aria-hidden="true" className="h-4 w-4" /> ~{roadmap.estimatedTotalHours} hours total
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan/15 px-2.5 py-0.5 text-xs font-medium text-[#006E85] dark:text-cyan">
              <Route aria-hidden="true" className="h-3 w-3" /> {STATUS_COPY[status]}
            </span>
          </div>
          {roadmap.notes && <p className="text-sm text-muted">{roadmap.notes}</p>}
        </header>

        {roadmap.prerequisites.length > 0 && (
          <div>
            <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted">Prerequisite chain</h3>
            <ol className="flex flex-wrap items-center gap-2">
              {roadmap.prerequisites.map((p, i) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="rounded-full border border-line px-3 py-1 text-sm">{p}</span>
                  {i < roadmap.prerequisites.length - 1 && <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted" />}
                </li>
              ))}
              <li className="flex items-center gap-2">
                <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted" />
                <span className="rounded-full bg-orange px-3 py-1 text-sm font-semibold text-black">{roadmap.skillName}</span>
              </li>
            </ol>
          </div>
        )}

        {weeks.length > 0 ? (
          <>
            <ProgressBar value={completedWeeks} max={weeks.length} label="Weeks completed" />
            <div className="space-y-3" role="list" aria-label="Weekly plan">
              {weeks.map((w, i) => (
                <div key={w.week} role="listitem">
                  <WeekAccordion
                    week={w}
                    completed={progress}
                    onToggle={onToggle}
                    onSwap={onSwap}
                    defaultOpen={i === 0}
                    headingId={`${roadmapId}-w${w.week}`}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-muted">
            <Target aria-hidden="true" className="mx-auto mb-2 h-6 w-6" />
            No plan yet. Try a broader skill name.
          </p>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <div className="flex flex-wrap gap-2">
            {onSave && (
              <button type="button" onClick={onSave} disabled={saved} className="btn-primary !px-4 !py-2 text-sm">
                {saved ? <BookmarkCheck aria-hidden="true" className="h-4 w-4" /> : <Bookmark aria-hidden="true" className="h-4 w-4" />}
                {saved ? 'Saved to dashboard' : 'Save to dashboard'}
              </button>
            )}
            {onRefresh && (
              <button type="button" onClick={onRefresh} disabled={refreshing} className="btn-ghost !px-4 !py-2 text-sm">
                <RefreshCw aria-hidden="true" className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh plan
              </button>
            )}
          </div>
          {onFeedback && <FeedbackButtons roadmapId={roadmapId} value={feedback} onChange={onFeedback} />}
        </footer>
      </div>

      {locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-bg/85 p-6 backdrop-blur-md dark:bg-bg/60">
          <div className="max-w-sm rounded-2xl border border-line bg-surface p-6 text-center shadow-2xl">
            <Lock aria-hidden="true" className="mx-auto mb-3 h-7 w-7 text-orange" />
            <p className="font-display text-2xl font-bold">Sign up to unlock your full learning path</p>
            <p className="mt-2 text-sm text-muted">Free forever. Save roadmaps, track progress, and pick up where you left off.</p>
            <Link href={unlockHref ?? '/auth/signup'} className="btn-primary mt-5 w-full">
              Unlock my roadmap <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
