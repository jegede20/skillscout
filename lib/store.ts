'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CategoryId, Difficulty, Resource, Roadmap } from '@/lib/types';

export interface SavedRoadmap {
  id: string;
  skillName: string;
  userQuery: string;
  difficulty: Difficulty;
  estimatedTotalHours: number;
  createdAt: string;
  roadmap: Roadmap;
  completed: Record<string, boolean>; // key: `${week}:${resourceId}`
  feedback?: 'up' | 'down';
  remote?: boolean; // true when the roadmap lives in Supabase
}

export interface SearchRecord {
  id: string;
  query: string;
  resultsCount: number;
  categoryIds: CategoryId[];
  createdAt: string;
}

export interface VisitRecord {
  resourceId: string;
  title: string;
  url: string;
  at: string;
}

export interface Profile {
  fullName: string;
  email: string;
  bio: string;
}

interface State {
  // demo-mode identity (used when Supabase is not configured)
  demoUser: Profile | null;
  profile: Profile;
  interests: CategoryId[];
  goal: string;
  onboarded: boolean;
  searches: SearchRecord[];
  roadmaps: SavedRoadmap[];
  visits: VisitRecord[];

  signInDemo: (p: { fullName: string; email: string }) => void;
  signOutDemo: () => void;
  updateProfile: (p: Partial<Profile>) => void;
  setInterests: (ids: CategoryId[]) => void;
  setGoal: (goal: string) => void;
  completeOnboarding: () => void;
  addSearch: (s: Omit<SearchRecord, 'id' | 'createdAt'>) => void;
  saveRoadmap: (r: { query: string; roadmap: Roadmap; id?: string; remote?: boolean }) => string;
  replaceRoadmaps: (list: SavedRoadmap[]) => void;
  replaceSearches: (list: SearchRecord[]) => void;
  toggleTask: (roadmapId: string, key: string) => void;
  setRoadmapFeedback: (roadmapId: string, rating: 'up' | 'down') => void;
  swapRoadmapResource: (roadmapId: string, oldResourceId: string, next: Resource) => void;
  recordVisit: (v: { resourceId: string; title: string; url: string }) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useSkillStore = create<State>()(
  persist(
    (set, get) => ({
      demoUser: null,
      profile: { fullName: '', email: '', bio: '' },
      interests: [],
      goal: '',
      onboarded: false,
      searches: [],
      roadmaps: [],
      visits: [],

      signInDemo: ({ fullName, email }) => {
        const profile = { fullName, email, bio: get().profile.bio };
        set({ demoUser: profile, profile });
      },
      signOutDemo: () => set({ demoUser: null }),
      updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p }, demoUser: s.demoUser ? { ...s.demoUser, ...p } : null })),
      setInterests: (ids) => set({ interests: ids }),
      setGoal: (goal) => set({ goal }),
      completeOnboarding: () => set({ onboarded: true }),

      addSearch: (s) =>
        set((st) => ({
          searches: [{ ...s, id: uid(), createdAt: new Date().toISOString() }, ...st.searches].slice(0, 200),
        })),

      saveRoadmap: ({ query, roadmap, id: givenId, remote }) => {
        const id = givenId ?? uid();
        set((st) => ({
          roadmaps: [
            {
              id,
              skillName: roadmap.skillName,
              userQuery: query,
              difficulty: roadmap.difficulty,
              estimatedTotalHours: roadmap.estimatedTotalHours,
              createdAt: new Date().toISOString(),
              roadmap,
              completed: {},
              remote: !!remote,
            },
            ...st.roadmaps.filter((r) => r.id !== id),
          ],
        }));
        return id;
      },

      // Server copy wins. Local-only roadmaps (saved before sign-in or while offline) are kept.
      replaceRoadmaps: (list) =>
        set((st) => ({ roadmaps: [...list, ...st.roadmaps.filter((r) => !r.remote && !list.some((x) => x.id === r.id))] })),

      replaceSearches: (list) => set({ searches: list.slice(0, 200) }),

      toggleTask: (roadmapId, key) =>
        set((st) => ({
          roadmaps: st.roadmaps.map((r) =>
            r.id === roadmapId ? { ...r, completed: { ...r.completed, [key]: !r.completed[key] } } : r,
          ),
        })),

      setRoadmapFeedback: (roadmapId, rating) =>
        set((st) => ({ roadmaps: st.roadmaps.map((r) => (r.id === roadmapId ? { ...r, feedback: rating } : r)) })),

      swapRoadmapResource: (roadmapId, oldResourceId, next) =>
        set((st) => ({
          roadmaps: st.roadmaps.map((saved) => {
            if (saved.id !== roadmapId) return saved;
            const weeklyRoadmap = saved.roadmap.weeklyRoadmap.map((w) => ({
              ...w,
              resources: w.resources.map((res) =>
                res.resourceId === oldResourceId
                  ? { ...res, resourceId: next.id, title: next.title, platform: next.platform, url: next.url, estimatedHours: next.durationHours }
                  : res,
              ),
            }));
            return { ...saved, roadmap: { ...saved.roadmap, weeklyRoadmap } };
          }),
        })),

      recordVisit: (v) =>
        set((st) => ({ visits: [{ ...v, at: new Date().toISOString() }, ...st.visits].slice(0, 500) })),
    }),
    {
      name: 'skillscout-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
