'use client';

import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { track } from '@/lib/analytics';

export function FeedbackButtons({
  roadmapId,
  value,
  onChange,
}: {
  roadmapId: string;
  value?: 'up' | 'down';
  onChange: (rating: 'up' | 'down') => void;
}) {
  const [sending, setSending] = useState(false);
  const [thanks, setThanks] = useState(false);

  const send = async (rating: 'up' | 'down') => {
    setSending(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmapId, rating }),
      });
      onChange(rating);
      track('feedback_given', { rating });
      setThanks(true);
    } finally {
      setSending(false);
    }
  };

  const base = 'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-50';
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted">Was this roadmap helpful?</span>
      <button
        type="button"
        aria-pressed={value === 'up'}
        disabled={sending}
        onClick={() => send('up')}
        className={`${base} ${value === 'up' ? 'border-beginner bg-beginner/15 text-beginner' : 'border-line hover:border-beginner'}`}
      >
        <ThumbsUp aria-hidden="true" className="h-4 w-4" /> Yes
      </button>
      <button
        type="button"
        aria-pressed={value === 'down'}
        disabled={sending}
        onClick={() => send('down')}
        className={`${base} ${value === 'down' ? 'border-advanced bg-advanced/15 text-advanced' : 'border-line hover:border-advanced'}`}
      >
        <ThumbsDown aria-hidden="true" className="h-4 w-4" /> Not really
      </button>
      <span role="status" className="text-sm text-muted">{thanks ? 'Thanks for the feedback!' : ''}</span>
    </div>
  );
}
