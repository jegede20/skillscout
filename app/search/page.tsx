import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchView } from '@/components/search/SearchView';
import { LoadingState } from '@/components/search/LoadingState';

type Props = { searchParams: { q?: string } };

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = searchParams.q?.trim();
  if (!q) {
    return { title: 'Explore skills', description: 'Search any skill and get free resources plus a learning roadmap.' };
  }
  return {
    title: `Free resources for ${q}`,
    description: `Curated free courses, videos, and interactive lessons for ${q}, plus an AI-built week-by-week roadmap.`,
    openGraph: { title: `Learn ${q} for free · SkillScout`, description: `Free resources and a roadmap to learn ${q}.` },
  };
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-content px-4 py-10">
          <LoadingState />
        </main>
      }
    >
      <SearchView />
    </Suspense>
  );
}
