'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Share2, Check } from 'lucide-react';
import { RoadmapPanel } from '@/components/search/RoadmapPanel';
import { useSkillStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';
import { syncProgress } from '@/lib/remote';
import type { Resource } from '@/lib/types';

export default function SavedRoadmapPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const hydrated = useHydrated();
  const saved = useSkillStore((s) => s.roadmaps.find((r) => r.id === id));
  const toggleTask = useSkillStore((s) => s.toggleTask);
  const setFeedback = useSkillStore((s) => s.setRoadmapFeedback);
  const swapRoadmapResource = useSkillStore((s) => s.swapRoadmapResource);
  const [copied, setCopied] = useState(false);

  if (!hydrated) return null;

  if (!saved) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="font-display text-3xl font-bold">We couldn’t find that roadmap.</p>
        <p className="mt-2 text-muted">It may have been created on another browser. Roadmaps are saved per device for now.</p>
        <Link href="/dashboard" className="btn-primary mt-6">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  const share = async () => {
    const url = `${window.location.origin}/dashboard/roadmap/${saved.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  const onSwap = (oldId: string, next: Resource) => swapRoadmapResource(saved.id, oldId, next);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className="btn-ghost !py-1.5 text-sm">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Dashboard
        </Link>
        <button type="button" onClick={share} className="btn-ghost !py-1.5 text-sm" aria-live="polite">
          {copied ? <Check aria-hidden="true" className="h-4 w-4 text-beginner" /> : <Share2 aria-hidden="true" className="h-4 w-4" />}
          {copied ? 'Link copied' : 'Share roadmap'}
        </button>
      </div>

      <p className="text-muted">
        Searched for <span className="text-fg">“{saved.userQuery}”</span>
      </p>

      <div className="mx-auto max-w-3xl">
        <RoadmapPanel
          roadmap={saved.roadmap}
          status={saved.roadmap.source === 'ai' ? 'ai' : 'fallback'}
          roadmapId={saved.id}
          titleAs="h1"
          progress={saved.completed}
          onToggle={(key) => {
            const nowDone = !saved.completed[key];
            toggleTask(saved.id, key);
            syncProgress(saved.id, key, nowDone, saved.remote);
          }}
          onSwap={onSwap}
          feedback={saved.feedback}
          onFeedback={(rating) => setFeedback(saved.id, rating)}
        />
      </div>
    </div>
  );
}
