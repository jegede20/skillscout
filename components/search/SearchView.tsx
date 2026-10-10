'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from './SearchBar';
import { FilterBar } from './FilterBar';
import { ResourceGrid } from './ResourceGrid';
import { RoadmapPanel } from './RoadmapPanel';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { track } from '@/lib/analytics';
import { persistRoadmap, syncSearch } from '@/lib/remote';
import { useAuthState } from '@/lib/auth-state';
import { useSkillStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';
import type { Filters, Resource, SearchResponse } from '@/lib/types';
import { CATEGORY_BY_ID } from '@/lib/categories';

type ViewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: SearchResponse };

export function SearchView() {
  const params = useSearchParams();
  const router = useRouter();
  const q = (params.get('q') ?? '').trim();
  const hydrated = useHydrated();
  const auth = useAuthState();
  const remote = hydrated && auth.mode === 'supabase' && auth.status === 'authed';
  const remoteRef = useRef(false);
  remoteRef.current = remote;
  const addSearch = useSkillStore((s) => s.addSearch);
  const savedRoadmaps = useSkillStore((s) => s.roadmaps);
  const setRoadmapFeedback = useSkillStore((s) => s.setRoadmapFeedback);

  const [filters, setFilters] = useState<Filters>({});
  const [view, setView] = useState<ViewState>({ status: q ? 'loading' : 'idle' });
  const [resources, setResources] = useState<Resource[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | undefined>(undefined);
  const [liveMsg, setLiveMsg] = useState('');
  const requestSeq = useRef(0);

  const filterKey = JSON.stringify(filters);

  const run = useCallback(
    async (query: string, f: Filters) => {
      const seq = ++requestSeq.current;
      setView({ status: 'loading' });
      setLiveMsg('Scouting resources…');
      setSavedId(null);
      setFeedback(undefined);
      setProgress({});
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, filters: f }),
        });
        const json = (await res.json()) as SearchResponse & { error?: string };
        if (!res.ok) throw new Error(json.error ?? 'Search failed. Please try again.');
        if (seq !== requestSeq.current) return; // a newer search superseded this one

        setResources(json.resources);
        setView({ status: 'ready', data: json });
        setLiveMsg(`${json.resources.length} resources found. Roadmap ready.`);
        addSearch({
          query,
          resultsCount: json.resources.length,
          categoryIds: json.categoryIds,
        });
        syncSearch(query, json.resources.length, remoteRef.current);
        track('search_performed', { results: json.resources.length, exact: json.exactMatch });
        track('roadmap_generated', { status: json.roadmapStatus, source: json.roadmap.source });
      } catch (err) {
        if (seq !== requestSeq.current) return;
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        setView({ status: 'error', message });
        setLiveMsg(`Search failed: ${message}`);
      }
    },
    [addSearch],
  );

  useEffect(() => {
    if (!q) {
      setView({ status: 'idle' });
      return;
    }
    run(q, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filterKey, run]);

  const onSwap = (oldId: string, next: Resource) => {
    setResources((list) => list.map((r) => (r.id === oldId ? next : r)));
    setView((v) => {
      if (v.status !== 'ready') return v;
      const roadmap = {
        ...v.data.roadmap,
        weeklyRoadmap: v.data.roadmap.weeklyRoadmap.map((w) => ({
          ...w,
          resources: w.resources.map((res) =>
            res.resourceId === oldId
              ? { ...res, resourceId: next.id, title: next.title, platform: next.platform, url: next.url, estimatedHours: next.durationHours }
              : res,
          ),
        })),
      };
      return { status: 'ready', data: { ...v.data, roadmap } };
    });
  };

  const toggle = (key: string) => setProgress((p) => ({ ...p, [key]: !p[key] }));

  const onSave = async () => {
    if (view.status !== 'ready') return;
    if (auth.status !== 'authed') {
      router.push(`/auth/signup?next=${encodeURIComponent(`/search?q=${encodeURIComponent(q)}`)}`);
      return;
    }
    const id = await persistRoadmap({ query: q, roadmap: view.data.roadmap, remote });
    setSavedId(id);
    track('roadmap_saved', { source: 'search' });
    setLiveMsg('Roadmap saved to your dashboard.');
  };

  const data = view.status === 'ready' ? view.data : null;
  const alreadySaved = !!data && savedRoadmaps.some((r) => r.userQuery === q && r.roadmap.skillName === data.roadmap.skillName);
  const locked = hydrated && auth.status === 'anon';
  const showResources = resources.length > 0;

  return (
    <main className="mx-auto max-w-content px-4 pb-10">
      <SearchBar key={q} defaultValue={q} sticky />

      <div aria-live="polite" className="sr-only">
        {liveMsg}
      </div>

      <div className="flex flex-col gap-2 pt-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted">Results for</p>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
            {q ? <span className="text-accent">“{q}”</span> : 'Find a skill'}
          </h1>
        </div>
        {data && (
          <p className="text-sm text-muted">
            {data.resources.length} free resources · {data.estimatedHours}h plan
            {data.categoryIds.length > 0 && (
              <>
                {' · '}
                {data.categoryIds.map((c) => CATEGORY_BY_ID[c]?.name).filter(Boolean).join(', ')}
              </>
            )}
          </p>
        )}
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Roadmap first on mobile, second column on desktop */}
        <aside aria-label="Learning roadmap" className="order-1 lg:order-2 lg:sticky lg:top-40 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:pr-1 lg:self-start">
          {view.status === 'loading' && (
            <div className="card-surface space-y-4 p-6" aria-hidden="true">
              <div className="skeleton h-8 w-2/3 rounded-md" />
              <div className="skeleton h-4 w-1/3 rounded" />
              <div className="skeleton h-14 w-full rounded-xl" />
              <div className="skeleton h-14 w-full rounded-xl" />
              <div className="skeleton h-14 w-full rounded-xl" />
            </div>
          )}
          {data && (
            <RoadmapPanel
              roadmap={data.roadmap}
              status={data.roadmapStatus}
              roadmapId={data.cacheKey}
              progress={progress}
              onToggle={toggle}
              onSwap={onSwap}
              onRefresh={() => run(q, filters)}
              refreshing={view.status === 'loading'}
              onSave={onSave}
              saved={!!savedId || alreadySaved}
              feedback={feedback}
              onFeedback={(rating) => {
                setFeedback(rating);
                if (savedId) setRoadmapFeedback(savedId, rating);
              }}
              locked={locked}
              unlockHref={`/auth/signup?next=${encodeURIComponent(`/search?q=${encodeURIComponent(q)}`)}`}
            />
          )}
        </aside>

        <section aria-labelledby="results-title" className="order-2 lg:order-1 min-w-0">
          <h2 id="results-title" className="sr-only">
            Resources
          </h2>

          {view.status === 'idle' && (
            <div className="card-surface p-8 text-center">
              <p className="font-display text-2xl font-bold">What do you want to learn?</p>
              <p className="mt-2 text-muted">Search above. We will pull free resources and build your roadmap.</p>
            </div>
          )}

          {view.status === 'loading' && !showResources && <LoadingState />}

          {view.status === 'error' && (
            <div role="alert" className="card-surface border-advanced/60 p-6">
              <p className="font-semibold text-advanced">We couldn’t scout that right now.</p>
              <p className="mt-1 text-sm text-muted">{view.message}</p>
              <button type="button" className="btn-primary mt-4 !py-2 text-sm" onClick={() => run(q, filters)}>
                Try again
              </button>
            </div>
          )}

          {data && !data.exactMatch && data.resources.length > 0 && (
            <div className="mb-5">
              <EmptyState query={q} related={data.relatedSkills} />
            </div>
          )}

          {data && data.resources.length === 0 && view.status === 'ready' && <EmptyState query={q} related={data.relatedSkills} />}

          {showResources && (
            <div className={view.status === 'loading' ? 'opacity-60 transition' : ''}>
              <ResourceGrid resources={resources} onSwap={onSwap} />
            </div>
          )}

          {data && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'ItemList',
                  itemListElement: resources.slice(0, 10).map((r, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    item: {
                      '@type': 'Course',
                      name: r.title,
                      description: r.description,
                      url: r.url,
                      provider: { '@type': 'Organization', name: r.platform },
                      isAccessibleForFree: true,
                      timeRequired: `PT${r.durationHours}H`,
                    },
                  })),
                }),
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}
