'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Clock, Lightbulb, Play, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SearchBar } from '@/components/search/SearchBar';
import { useAuthState } from '@/lib/auth-state';
import { useSkillStore, type SavedRoadmap } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';
import { CATEGORY_BY_ID } from '@/lib/categories';
import { DifficultyBadge } from '@/components/ui/Badge';

function progressOf(r: SavedRoadmap) {
  const tasks = r.roadmap.weeklyRoadmap.flatMap((w) => w.resources.map((res) => `${w.week}:${res.resourceId}`));
  const done = tasks.filter((k) => r.completed[k]).length;
  return { done, total: tasks.length };
}

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const auth = useAuthState();
  const roadmaps = useSkillStore((s) => s.roadmaps);
  const searches = useSkillStore((s) => s.searches);
  const interests = useSkillStore((s) => s.interests);
  const skills = roadmaps.map((r) => r.skillName);
  const [recs, setRecs] = useState<{ skill: string; reason: string }[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const goal = useSkillStore.getState().goal;
    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, interests, skills }),
    })
      .then((r) => r.json())
      .then((j) => setRecs(j.recommendations ?? []))
      .catch(() => setRecs([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated) return null;
  const first = auth.user?.name.split(' ')[0] ?? 'there';
  const lastActive = roadmaps[0];
  const recentSearches = searches.slice(0, 6);

  return (
    <div className="space-y-12 pb-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-wider text-muted">Dashboard</p>
        <h1 className="mt-2 font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
          Welcome back, <span className="text-accent">{first}.</span>
        </h1>
        <div className="mt-6 max-w-2xl">
          <SearchBar />
        </div>
      </header>

      {lastActive && (
        <section aria-labelledby="continue-title" className="card-surface flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted">Continue learning</p>
            <h2 id="continue-title" className="font-display text-3xl font-bold">{lastActive.skillName}</h2>
            <p className="text-sm text-muted">Started {new Date(lastActive.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
          </div>
          <Link href={`/dashboard/roadmap/${lastActive.id}`} className="btn-primary">
            <Play aria-hidden="true" className="h-4 w-4" /> Resume path
          </Link>
        </section>
      )}

      <section aria-labelledby="paths-title">
        <div className="mb-5 flex items-end justify-between">
          <h2 id="paths-title" className="font-display text-3xl font-bold md:text-4xl">Active learning paths</h2>
          <span className="text-sm text-muted">{roadmaps.length} saved</span>
        </div>
        {roadmaps.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="font-display text-2xl font-bold">No paths yet</p>
            <p className="mt-2 text-muted">Search a skill and tap “Save to dashboard” to start a roadmap.</p>
            <Link href="/search" className="btn-primary mt-5">
              Explore skills <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roadmaps.map((r) => {
              const { done, total } = progressOf(r);
              const weeks = r.roadmap.weeklyRoadmap.length;
              const weeksDone = r.roadmap.weeklyRoadmap.filter((w) => w.resources.length && w.resources.every((res) => r.completed[`${w.week}:${res.resourceId}`])).length;
              return (
                <li key={r.id}>
                  <Link href={`/dashboard/roadmap/${r.id}`} className="card-surface group block h-full p-5 hover:-translate-y-1">
                    <div className="mb-3 flex items-center justify-between">
                      <DifficultyBadge level={r.difficulty} />
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Clock aria-hidden="true" className="h-3 w-3" /> {r.estimatedTotalHours}h
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-bold leading-tight group-hover:text-accent">{r.skillName}</h3>
                    <p className="mt-1 line-clamp-1 text-sm text-muted">From: “{r.userQuery}”</p>
                    <div className="mt-5">
                      <ProgressBar value={weeksDone} max={weeks} label="Weeks" />
                      <p className="mt-2 text-xs text-muted">{done} of {total} resources checked off</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="history-title">
          <div className="mb-4 flex items-end justify-between">
            <h2 id="history-title" className="font-display text-2xl font-bold md:text-3xl">Your search history</h2>
            <Link href="/dashboard/history" className="text-sm font-semibold text-accent hover:underline">See all</Link>
          </div>
          {recentSearches.length === 0 ? (
            <p className="text-muted">Nothing yet. Your searches will show up here.</p>
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {recentSearches.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.query}</p>
                    <p className="text-xs text-muted">{s.resultsCount} resources · {new Date(s.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/search?q=${encodeURIComponent(s.query)}`)}
                    className="btn-ghost !px-3 !py-1.5 text-sm"
                    aria-label={`Search again for ${s.query}`}
                  >
                    <Search aria-hidden="true" className="h-3.5 w-3.5" /> Re-search
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recs-title">
          <h2 id="recs-title" className="mb-4 font-display text-2xl font-bold md:text-3xl">Recommended for you</h2>
          {recs === null ? (
            <div className="space-y-3" aria-hidden="true">
              <div className="skeleton h-20 rounded-2xl" />
              <div className="skeleton h-20 rounded-2xl" />
            </div>
          ) : (
            <ul className="grid gap-3">
              {recs.map((rec) => {
                const cat = Object.values(CATEGORY_BY_ID).find((c) => c.name.toLowerCase() === rec.skill.toLowerCase());
                const href = `/search?q=${encodeURIComponent(rec.skill)}`;
                return (
                  <li key={rec.skill}>
                    <Link href={href} className="card-surface flex items-start gap-4 p-4 hover:-translate-y-0.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow/20 text-[#92400E] dark:text-yellow">
                        <Lightbulb aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">{rec.skill}</span>
                        <span className="block text-sm text-muted">{rec.reason}</span>
                        {cat && <span className="mt-1 block font-mono text-[11px] text-muted">{cat.name}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
