'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSkillStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';
import { CATEGORIES, CATEGORY_BY_ID } from '@/lib/categories';
import { DifficultyBadge } from '@/components/ui/Badge';
import type { CategoryId } from '@/lib/types';

const RANGES = [
  { id: 'all', label: 'All time', days: Infinity },
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 30 },
] as const;

export default function HistoryPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const searches = useSkillStore((s) => s.searches);
  const roadmaps = useSkillStore((s) => s.roadmaps);
  const visits = useSkillStore((s) => s.visits);
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('all');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');

  const cutoff = useMemo(() => {
    const r = RANGES.find((x) => x.id === range)!;
    return r.days === Infinity ? 0 : Date.now() - r.days * 86400000;
  }, [range]);

  const filteredSearches = searches.filter(
    (s) => new Date(s.createdAt).getTime() >= cutoff && (category === 'all' || s.categoryIds.includes(category)),
  );
  const filteredRoadmaps = roadmaps.filter((r) => new Date(r.createdAt).getTime() >= cutoff);
  const filteredVisits = visits.filter((v) => new Date(v.at).getTime() >= cutoff);

  if (!hydrated) return null;

  return (
    <div className="space-y-10 pb-16">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted">Dashboard</p>
          <h1 className="mt-2 font-display text-5xl font-bold tracking-tight md:text-7xl">Your <span className="text-accent">history</span></h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col text-xs text-muted">
            Date
            <select value={range} onChange={(e) => setRange(e.target.value as typeof range)} className="input-base mt-1 !py-2 text-sm text-fg">
              {RANGES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs text-muted">
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId | 'all')} className="input-base mt-1 !py-2 text-sm text-fg">
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section aria-labelledby="searches-h">
        <h2 id="searches-h" className="mb-4 font-display text-3xl font-bold">Searches</h2>
        {filteredSearches.length === 0 ? (
          <p className="text-muted">No searches match these filters.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {filteredSearches.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{s.query}</p>
                  <p className="text-xs text-muted">
                    {new Date(s.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} · {s.resultsCount} resources
                    {s.categoryIds[0] && ` · ${CATEGORY_BY_ID[s.categoryIds[0]]?.name}`}
                  </p>
                </div>
                <button type="button" className="btn-ghost !py-1.5 text-sm" onClick={() => router.push(`/search?q=${encodeURIComponent(s.query)}`)}>
                  Search again
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="roadmaps-h">
        <h2 id="roadmaps-h" className="mb-4 font-display text-3xl font-bold">Saved roadmaps</h2>
        {filteredRoadmaps.length === 0 ? (
          <p className="text-muted">No saved roadmaps in this range.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {filteredRoadmaps.map((r) => (
              <li key={r.id}>
                <Link href={`/dashboard/roadmap/${r.id}`} className="card-surface flex items-center justify-between gap-3 p-4 hover:-translate-y-0.5">
                  <span className="font-semibold">{r.skillName}</span>
                  <DifficultyBadge level={r.difficulty} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="visits-h">
        <h2 id="visits-h" className="mb-4 font-display text-3xl font-bold">Resources you opened</h2>
        {filteredVisits.length === 0 ? (
          <p className="text-muted">Nothing opened yet. “Start Learning” clicks land here.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {filteredVisits.slice(0, 100).map((v, i) => (
              <li key={`${v.resourceId}-${i}`} className="flex items-center justify-between gap-3 p-4">
                <a href={v.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-accent hover:underline">
                  {v.title}
                </a>
                <span className="shrink-0 text-xs text-muted">{new Date(v.at).toLocaleDateString('en-GB')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
