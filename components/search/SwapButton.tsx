'use client';

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { Resource } from '@/lib/types';

/** "Find Alternative": asks the API for another verified resource with overlapping tags. */
export function SwapButton({
  resourceId,
  title,
  skillTags,
  onSwapped,
  compact = false,
}: {
  resourceId: string;
  title: string;
  skillTags: string[];
  onSwapped: (next: Resource) => void;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const swap = async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch('/api/swap-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId, skillTags }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No alternative found.');
      onSwapped(json.resource as Resource);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={swap}
        disabled={busy}
        className="btn-ghost !px-3 !py-1.5 text-sm"
        aria-label={`Find an alternative to ${title}`}
      >
        <RefreshCw aria-hidden="true" className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
        {compact ? 'Swap' : 'Find alternative'}
      </button>
      {note && (
        <span role="status" className="text-xs text-muted">
          {note}
        </span>
      )}
    </span>
  );
}
