'use client';

import { useSkillStore, type SavedRoadmap, type SearchRecord } from '@/lib/store';
import type { Roadmap } from '@/lib/types';

/**
 * Client helpers for server-backed storage. Every function degrades to browser-local
 * storage when the user is not signed in to Supabase, so the app works in demo mode too.
 */

export async function fetchRemoteRoadmaps(): Promise<SavedRoadmap[] | null> {
  try {
    const res = await fetch('/api/roadmaps', { cache: 'no-store' });
    if (!res.ok) return null;
    return ((await res.json()).roadmaps ?? []) as SavedRoadmap[];
  } catch {
    return null;
  }
}

export async function fetchRemoteSearches(): Promise<SearchRecord[] | null> {
  try {
    const res = await fetch('/api/history', { cache: 'no-store' });
    if (!res.ok) return null;
    return ((await res.json()).searches ?? []) as SearchRecord[];
  } catch {
    return null;
  }
}

/** Saves a roadmap to the server when `remote` is true, then mirrors it in the local store. Returns the id to use. */
export async function persistRoadmap(args: { query: string; roadmap: Roadmap; remote: boolean }): Promise<string> {
  const { query, roadmap, remote } = args;
  if (remote) {
    try {
      const res = await fetch('/api/roadmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: query, roadmap }),
      });
      if (res.ok) {
        const { id } = (await res.json()) as { id: string };
        return useSkillStore.getState().saveRoadmap({ query, roadmap, id, remote: true });
      }
    } catch {
      /* fall through to local save */
    }
  }
  return useSkillStore.getState().saveRoadmap({ query, roadmap });
}

/** Persists one checkbox change. `key` has the form `${week}:${resourceId}`. */
export function syncProgress(roadmapId: string, key: string, completed: boolean, remote?: boolean) {
  if (!remote) return;
  const [week, resourceId] = key.split(':');
  fetch(`/api/roadmaps/${roadmapId}/progress`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekNumber: Number(week), resourceId, completed }),
    keepalive: true,
  }).catch(() => {
    /* progress stays in the local store; it will sync on the next change */
  });
}

export function syncSearch(query: string, resultsCount: number, remote: boolean) {
  if (!remote) return;
  fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, resultsCount }),
    keepalive: true,
  }).catch(() => {});
}
